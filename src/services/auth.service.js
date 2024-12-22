import api from '@/utils/axios'
import router from '@/router'
import store from '@/store'
import { handleError } from '@/utils/errorHandler'

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

        if (this.token && this.user) {
            this.setupTokenRefresh()
        }
    }

    setAuthData(data) {
        if (data.accessToken) {
            localStorage.setItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY, data.accessToken)
            this.token = data.accessToken
            api.defaults.headers.common.Authorization = `${TOKEN_CONFIG.TOKEN_PREFIX} ${data.accessToken}`
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
        delete api.defaults.headers.common.Authorization
        this.token = null
        this.refreshToken = null
        this.user = null
        this.tokenRefreshTimeout = null
        this.isRefreshing = false
        this.refreshSubscribers = []
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

        this.tokenRefreshTimeout = setTimeout(() => {
            this.refreshAccessToken().catch(() => {
                this.handleAuthError()
            })
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
            return null
        }
    }

    async login(username, password, rememberMe = false) {
        try {
            const response = await api.post('/users/login', {
                username,
                password
            })

            if (!response?.accessToken || !response?.user) {
                throw new Error('登入失敗：伺服器回應格式錯誤')
            }

            this.setAuthData({
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
                user: response.user
            })

            if (rememberMe) {
                localStorage.setItem('rememberedUsername', username)
            }

            await store.dispatch('cart/loadCart')
            return response
        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('用戶名或密碼錯誤')
            }
            throw handleError(error)
        }
    }

    async refreshAccessToken() {
        if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
                this.refreshSubscribers.push(token => {
                    if (token) {
                        resolve(token)
                    } else {
                        reject(new Error('Token 更新失敗'))
                    }
                })
            })
        }

        this.isRefreshing = true

        try {
            if (!this.refreshToken) {
                throw new Error('無效的刷新令牌')
            }

            const response = await api.post('/users/refresh-token', {
                refreshToken: this.refreshToken
            }, {
                skipAuth: true
            })

            if (!response?.accessToken) {
                throw new Error('Token 更新失敗：伺服器回應格式錯誤')
            }

            this.setAuthData({
                accessToken: response.accessToken,
                refreshToken: response.refreshToken
            })

            this.refreshSubscribers.forEach(callback => callback(response.accessToken))
            this.refreshSubscribers = []

            return response.accessToken
        } catch (error) {
            this.refreshSubscribers.forEach(callback => callback(null))
            this.refreshSubscribers = []
            await this.handleAuthError()
            throw error
        } finally {
            this.isRefreshing = false
        }
    }

    async register(userData) {
        try {
            const response = await api.post('/users/register', userData)
            return response
        } catch (error) {
            const errorMessage = error.response?.data?.message
            if (errorMessage) {
                if (errorMessage.includes('Username')) {
                    throw new Error('此用戶名已被使用')
                }
                if (errorMessage.includes('Email')) {
                    throw new Error('此電子郵件已被註冊')
                }
                if (errorMessage.includes('PhoneNumber')) {
                    throw new Error('此手機號碼已被註冊')
                }
                throw new Error(errorMessage)
            }
            throw handleError(error)
        }
    }

    async getProfile() {
        try {
            const userId = this.user?.userId
            if (!userId) {
                throw new Error('未找到用戶ID')
            }

            const response = await api.get(`/users/${userId}`)
            if (response) {
                const updatedUserData = { ...this.user, ...response }
                this.setAuthData({ user: updatedUserData })
                return response
            }
            throw new Error('獲取用戶資料失敗')
        } catch (error) {
            if (error.response?.status === 401) {
                await this.handleAuthError()
            }
            throw handleError(error)
        }
    }

    async updateProfile(profileData) {
        try {
            const userId = this.user?.userId
            if (!userId) {
                throw new Error('未找到用戶ID')
            }

            const response = await api.put(`/users/${userId}`, profileData)
            if (response) {
                const updatedUserData = { ...this.user, ...response }
                this.setAuthData({ user: updatedUserData })
                return response
            }
            throw new Error('更新用戶資料失敗')
        } catch (error) {
            throw handleError(error)
        }
    }

    async changePassword(oldPassword, newPassword) {
        try {
            const userId = this.user?.userId
            if (!userId) {
                throw new Error('未找到用戶ID')
            }

            const response = await api.put(`/users/${userId}/password`, {
                oldPassword,
                newPassword
            })
            return response
        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('原密碼錯誤')
            }
            throw handleError(error)
        }
    }

    async logout() {
        try {
            if (this.token) {
                await api.post('/users/logout')
            }
        } catch (error) {
            console.error('登出時發生錯誤:', error)
        } finally {
            this.clearAuthData()
            await store.dispatch('cart/clearCart')
            router.push('/login')
        }
    }

    async handleAuthError() {
        this.clearAuthData()
        router.push({
            path: '/login',
            query: {
                redirect: router.currentRoute.value.fullPath,
                error: 'session_expired'
            }
        })
    }

    getCurrentUser() {
        return this.user
    }

    isAuthenticated() {
        return !!this.token && !!this.user
    }
}

export default new AuthService()
