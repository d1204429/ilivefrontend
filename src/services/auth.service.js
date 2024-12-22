import api from '@/utils/axios'
import router from '@/router'
import store from '@/store'
import { handleError } from '@/utils/errorHandler'

// Token相關常量
const TOKEN_CONFIG = {
    ACCESS_TOKEN_KEY: import.meta.env.VITE_JWT_TOKEN_KEY,
    REFRESH_TOKEN_KEY: import.meta.env.VITE_JWT_REFRESH_KEY,
    TOKEN_PREFIX: 'Bearer',
    REFRESH_INTERVAL: parseInt(import.meta.env.VITE_TOKEN_REFRESH_INTERVAL) || 900000
}

class AuthService {
    constructor() {
        this.token = localStorage.getItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY)
        this.refreshToken = localStorage.getItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY)
        this.user = JSON.parse(localStorage.getItem('user'))
        this.tokenRefreshTimeout = null
        this.isRefreshing = false
        this.refreshSubscribers = []
    }

    setAuthData(data) {
        if (data.accessToken) {
            localStorage.setItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY, data.accessToken)
            this.token = data.accessToken
            this.setupTokenRefresh()
        }
        if (data.refreshToken) {
            localStorage.setItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY, data.refreshToken)
            this.refreshToken = data.refreshToken
        }
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user))
            this.user = data.user
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
        this.token = null
        this.refreshToken = null
        this.user = null
        this.tokenRefreshTimeout = null
        this.isRefreshing = false
        this.refreshSubscribers = []
    }

    setupTokenRefresh() {
        if (this.tokenRefreshTimeout) {
            clearTimeout(this.tokenRefreshTimeout)
        }
        this.tokenRefreshTimeout = setTimeout(() => {
            this.refreshAccessToken().catch(() => {
                this.handleAuthError()
            })
        }, TOKEN_CONFIG.REFRESH_INTERVAL)
    }

    onTokenRefreshed(token) {
        this.refreshSubscribers.forEach(callback => callback(token))
        this.refreshSubscribers = []
    }

    addRefreshSubscriber(callback) {
        this.refreshSubscribers.push(callback)
    }

    getCurrentUser() {
        return this.user
    }

    isAuthenticated() {
        return !!this.token && !!this.user
    }

    async login(username, password, rememberMe = false) {
        try {
            const response = await api.post('/users/login', { username, password })

            if (response?.accessToken && response?.user) {
                this.setAuthData({
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
                    user: response.user
                })

                if (rememberMe) {
                    localStorage.setItem('rememberedUsername', username)
                }

                return response
            }
            throw new Error('登入失敗：未收到有效的認證資料')
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
                this.addRefreshSubscriber(token => {
                    if (token) {
                        resolve(token)
                    } else {
                        reject(new Error('Token refresh failed'))
                    }
                })
            })
        }

        this.isRefreshing = true

        try {
            if (!this.refreshToken) {
                throw new Error('無效的刷新令牌')
            }

            const response = await api.post('/users/refresh-token',
                { refreshToken: this.refreshToken },
                { skipAuth: true }
            )

            if (response?.accessToken) {
                this.setAuthData({
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken
                })
                this.onTokenRefreshed(response.accessToken)
                return response
            }
            throw new Error('Token更新失敗')
        } catch (error) {
            this.onTokenRefreshed(null)
            await this.handleAuthError()
            throw error
        } finally {
            this.isRefreshing = false
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

    async register(userData) {
        try {
            const response = await api.post('/users/register', userData)
            return response
        } catch (error) {
            const errorMessage = error.response?.data?.message
            if (errorMessage) {
                if (errorMessage.includes('用戶名已存在')) {
                    throw new Error('此用戶名已被使用')
                }
                if (errorMessage.includes('電子郵件已存在')) {
                    throw new Error('此電子郵件已被註冊')
                }
                if (errorMessage.includes('手機號碼已存在')) {
                    throw new Error('此手機號碼已被註冊')
                }
                throw new Error(errorMessage)
            }
            throw handleError(error)
        }
    }

    async getProfile() {
        try {
            const response = await api.get('/users/profile')
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
            const response = await api.put('/users/profile', profileData)
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
            const response = await api.put('/users/password', {
                oldPassword,
                newPassword
            })
            return response
        } catch (error) {
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
}

export default new AuthService()
