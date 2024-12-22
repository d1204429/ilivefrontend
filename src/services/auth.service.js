import api from '@/utils/axios'
import router from '@/router'
import store from '@/store'
import { handleError, AppError, ErrorTypes } from '@/utils/errorHandler'

const TOKEN_CONFIG = {
    ACCESS_TOKEN_KEY: import.meta.env.VITE_JWT_TOKEN_KEY || 'access_token',
    REFRESH_TOKEN_KEY: import.meta.env.VITE_JWT_REFRESH_KEY || 'refresh_token',
    TOKEN_PREFIX: 'Bearer',
    REFRESH_INTERVAL: parseInt(import.meta.env.VITE_TOKEN_REFRESH_INTERVAL) || 900000,
    TOKEN_EXPIRED_CODE: 'TOKEN_EXPIRED'
}

class AuthService {
    constructor() {
        this.init()
    }

    init() {
        this.token = localStorage.getItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY)
        this.refreshToken = localStorage.getItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY)
        this.user = JSON.parse(localStorage.getItem('user'))
        this.tokenRefreshTimeout = null
        this.isRefreshing = false
        this.refreshSubscribers = []
        this.failedQueue = []

        if (this.token && this.user) {
            this.setupTokenRefresh()
            this.setAxiosAuthHeader(this.token)
        }
    }

    setAxiosAuthHeader(token) {
        if (token) {
            api.defaults.headers.common.Authorization = `${TOKEN_CONFIG.TOKEN_PREFIX} ${token}`
        } else {
            delete api.defaults.headers.common.Authorization
        }
    }

    setAuthData(data) {
        if (data.accessToken) {
            localStorage.setItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY, data.accessToken)
            this.token = data.accessToken
            this.setAxiosAuthHeader(data.accessToken)
            this.setupTokenRefresh()
        }
        if (data.refreshToken) {
            localStorage.setItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY, data.refreshToken)
            this.refreshToken = data.refreshToken
        }
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user))
            this.user = data.user
            store.dispatch('auth/setUser', data.user)
        }
    }

    clearAuthData() {
        if (this.tokenRefreshTimeout) {
            clearTimeout(this.tokenRefreshTimeout)
        }
        localStorage.removeItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY)
        localStorage.removeItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY)
        localStorage.removeItem('user')
        localStorage.removeItem('rememberedUsername')
        this.setAxiosAuthHeader(null)
        this.token = null
        this.refreshToken = null
        this.user = null
        this.tokenRefreshTimeout = null
        this.isRefreshing = false
        this.refreshSubscribers = []
        this.failedQueue = []
        store.dispatch('auth/clearUser')
    }

    setupTokenRefresh() {
        if (this.tokenRefreshTimeout) {
            clearTimeout(this.tokenRefreshTimeout)
        }

        const jwtToken = this.parseJwt(this.token)
        if (!jwtToken) return

        const expiresIn = (jwtToken.exp * 1000) - Date.now()
        const refreshTime = Math.max(expiresIn - TOKEN_CONFIG.REFRESH_INTERVAL, 0)

        this.tokenRefreshTimeout = setTimeout(async () => {
            try {
                await this.refreshAccessToken()
            } catch (error) {
                await this.handleAuthError(error)
            }
        }, refreshTime)
    }

    parseJwt(token) {
        try {
            const base64Url = token.split('.')[1]
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            }).join(''))
            return JSON.parse(jsonPayload)
        } catch (e) {
            console.error('Token parsing failed:', e)
            return null
        }
    }

    async login(username, password, rememberMe = false) {
        try {
            const response = await api.post('/api/v1/auth/login', {
                username,
                password
            })

            if (!response?.data?.accessToken || !response?.data?.user) {
                throw new AppError('登入失敗：伺服器回應格式錯誤', ErrorTypes.AUTH)
            }

            this.setAuthData({
                accessToken: response.data.accessToken,
                refreshToken: response.data.refreshToken,
                user: response.data.user
            })

            if (rememberMe) {
                localStorage.setItem('rememberedUsername', username)
            }

            await store.dispatch('cart/loadCart')
            return response.data
        } catch (error) {
            if (error.response?.status === 401) {
                throw new AppError('用戶名或密碼錯誤', ErrorTypes.AUTH)
            }
            throw error
        }
    }

    async refreshAccessToken() {
        if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
                this.refreshSubscribers.push({ resolve, reject })
            })
        }

        this.isRefreshing = true

        try {
            if (!this.refreshToken) {
                throw new AppError('無效的刷新令牌', ErrorTypes.AUTH)
            }

            const response = await api.post('/api/v1/auth/refresh-token', {
                refreshToken: this.refreshToken
            }, {
                skipAuthRefresh: true
            })

            if (!response?.data?.accessToken) {
                throw new AppError('Token 更新失敗：伺服器回應格式錯誤', ErrorTypes.AUTH)
            }

            this.setAuthData({
                accessToken: response.data.accessToken,
                refreshToken: response.data.refreshToken
            })

            this.refreshSubscribers.forEach(({ resolve }) =>
                resolve(response.data.accessToken)
            )
            return response.data.accessToken
        } catch (error) {
            this.refreshSubscribers.forEach(({ reject }) => reject(error))
            throw error
        } finally {
            this.isRefreshing = false
            this.refreshSubscribers = []
        }
    }

    async register(userData) {
        try {
            const response = await api.post('/api/v1/auth/register', userData)
            return response.data
        } catch (error) {
            const errorMessage = error.response?.data?.message
            if (errorMessage) {
                if (errorMessage.includes('Username')) {
                    throw new AppError('此用戶名已被使用', ErrorTypes.VALIDATION)
                }
                if (errorMessage.includes('Email')) {
                    throw new AppError('此電子郵件已被註冊', ErrorTypes.VALIDATION)
                }
                if (errorMessage.includes('PhoneNumber')) {
                    throw new AppError('此手機號碼已被註冊', ErrorTypes.VALIDATION)
                }
                throw new AppError(errorMessage, ErrorTypes.VALIDATION)
            }
            throw error
        }
    }

    async getProfile() {
        try {
            const userId = this.user?.userId
            if (!userId) {
                throw new AppError('未找到用戶ID', ErrorTypes.AUTH)
            }

            const response = await api.get(`/api/v1/users/${userId}`)
            if (response?.data) {
                const updatedUserData = { ...this.user, ...response.data }
                this.setAuthData({ user: updatedUserData })
                return response.data
            }
            throw new AppError('獲取用戶資料失敗', ErrorTypes.API)
        } catch (error) {
            throw error
        }
    }

    async updateProfile(profileData) {
        try {
            const userId = this.user?.userId
            if (!userId) {
                throw new AppError('未找到用戶ID', ErrorTypes.AUTH)
            }

            const response = await api.put(`/api/v1/users/${userId}`, profileData)
            if (response?.data) {
                const updatedUserData = { ...this.user, ...response.data }
                this.setAuthData({ user: updatedUserData })
                return response.data
            }
            throw new AppError('更新用戶資料失敗', ErrorTypes.API)
        } catch (error) {
            throw error
        }
    }

    async changePassword(oldPassword, newPassword) {
        try {
            const userId = this.user?.userId
            if (!userId) {
                throw new AppError('未找到用戶ID', ErrorTypes.AUTH)
            }

            const response = await api.put(`/api/v1/users/${userId}/password`, {
                oldPassword,
                newPassword
            })
            return response.data
        } catch (error) {
            if (error.response?.status === 401) {
                throw new AppError('原密碼錯誤', ErrorTypes.AUTH)
            }
            throw error
        }
    }

    async logout() {
        try {
            if (this.token) {
                await api.post('/api/v1/auth/logout')
            }
        } catch (error) {
            console.error('登出時發生錯誤:', error)
        } finally {
            this.clearAuthData()
            await store.dispatch('cart/clearCart')
            router.push('/login')
        }
    }

    async handleAuthError(error) {
        this.clearAuthData()
        const currentPath = router.currentRoute.value.fullPath
        if (currentPath !== '/login') {
            await router.push({
                path: '/login',
                query: {
                    redirect: currentPath,
                    error: 'session_expired'
                }
            })
        }
        throw error
    }

    getCurrentUser() {
        return this.user
    }

    isAuthenticated() {
        return !!this.token && !!this.user
    }
}

export default new AuthService()
