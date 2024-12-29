import api from '@/utils/axios'
import { handleError } from '@/utils/errorHandler'
import router from '@/router'
import store from '@/store'

class AuthService {
    constructor() {
        this.token = localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        this.refreshToken = localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY)
        this.user = JSON.parse(localStorage.getItem('user'))
        this.tokenRefreshTimeout = null
        this.isRefreshing = false
        this.refreshSubscribers = []
        this.tokenExpirationTime = parseInt(localStorage.getItem('tokenExpirationTime'))

        if (this.token && this.tokenExpirationTime) {
            this.setupTokenRefresh()
        }
    }

    setAuthData(data) {
        try {
            if (data.accessToken) {
                localStorage.setItem(import.meta.env.VITE_JWT_TOKEN_KEY, data.accessToken)
                this.token = data.accessToken

                const tokenExpiration = parseInt(import.meta.env.VITE_TOKEN_EXPIRATION) || 3600
                this.tokenExpirationTime = Date.now() + tokenExpiration * 1000
                localStorage.setItem('tokenExpirationTime', this.tokenExpirationTime.toString())

                this.setupTokenRefresh()
                api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
            }
            if (data.refreshToken) {
                localStorage.setItem(import.meta.env.VITE_JWT_REFRESH_KEY, data.refreshToken)
                this.refreshToken = data.refreshToken
            }
            if (data.user) {
                const userStr = JSON.stringify(data.user)
                localStorage.setItem('user', userStr)
                this.user = data.user
            }
        } catch (error) {
            console.error('設置認證數據時發生錯誤:', error)
            throw error
        }
    }

    clearAuthData() {
        try {
            if (this.tokenRefreshTimeout) {
                clearTimeout(this.tokenRefreshTimeout)
            }
            localStorage.removeItem(import.meta.env.VITE_JWT_TOKEN_KEY)
            localStorage.removeItem(import.meta.env.VITE_JWT_REFRESH_KEY)
            localStorage.removeItem('user')
            localStorage.removeItem('rememberedUsername')
            localStorage.removeItem('tokenExpirationTime')

            delete api.defaults.headers.common['Authorization']

            this.token = null
            this.refreshToken = null
            this.user = null
            this.tokenRefreshTimeout = null
            this.isRefreshing = false
            this.refreshSubscribers = []
            this.tokenExpirationTime = null
        } catch (error) {
            console.error('清除認證數據時發生錯誤:', error)
        }
    }
    setupTokenRefresh() {
        if (this.tokenRefreshTimeout) {
            clearTimeout(this.tokenRefreshTimeout)
        }

        const currentTime = Date.now()

        if (!this.tokenExpirationTime || currentTime >= this.tokenExpirationTime) {
            this.refreshAccessToken().catch(() => this.handleAuthError())
            return
        }

        const timeUntilRefresh = this.tokenExpirationTime - currentTime - (5 * 60 * 1000)
        this.tokenRefreshTimeout = setTimeout(() => {
            this.refreshAccessToken().catch(() => this.handleAuthError())
        }, Math.max(0, timeUntilRefresh))
    }

    onTokenRefreshed(token) {
        this.refreshSubscribers.forEach(callback => callback(token))
        this.refreshSubscribers = []
    }

    addRefreshSubscriber(callback) {
        this.refreshSubscribers.push(callback)
    }

    getCurrentUser() {
        try {
            return this.user ? JSON.parse(JSON.stringify(this.user)) : null
        } catch (error) {
            console.error('獲取當前用戶數據時發生錯誤:', error)
            return null
        }
    }

    isAuthenticated() {
        try {
            const currentTime = Date.now()
            return (
                !!this.token &&
                !!this.user &&
                !!this.tokenExpirationTime &&
                currentTime < this.tokenExpirationTime
            )
        } catch (error) {
            console.error('檢查認證狀態時發生錯誤:', error)
            return false
        }
    }

    async login(username, password, rememberMe = false) {
        try {
            const response = await api.post('/users/login', {
                username,
                password
            })

            if (response?.accessToken && response?.user) {
                this.setAuthData({
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
                    user: response.user
                })

                if (rememberMe) {
                    localStorage.setItem('rememberedUsername', username)
                }

                await store.dispatch('auth/loginSuccess', response)
                return response
            }
            throw new Error('登入失敗：未收到有效的認證資料')
        } catch (error) {
            await store.dispatch('auth/loginFailure', error)
            if (error.response?.status === 401) {
                throw new Error('用戶名或密碼錯誤')
            }
            throw handleError(error)
        }
    }

    async register(userData) {
        try {
            const response = await api.post('/users/register', userData)

            if (response && response.status === 'success') {
                return response
            }
            throw new Error('註冊失敗：' + (response.message || '未知錯誤'))
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

            const response = await api.post('/users/refresh-token', {
                refreshToken: this.refreshToken
            }, {
                skipAuth: true,
                retry: false
            })

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
        await store.dispatch('auth/logout')
        this.clearAuthData()
        const currentRoute = router.currentRoute.value
        if (currentRoute.name !== 'login') {
            router.push({
                path: '/login',
                query: {
                    redirect: currentRoute.fullPath,
                    error: 'session_expired'
                }
            })
        }
    }

    async getProfile() {
        try {
            const response = await api.get('/users/profile')
            if (response) {
                const updatedUserData = { ...this.user, ...response }
                this.setAuthData({ user: updatedUserData })
                await store.dispatch('auth/updateUserProfile', updatedUserData)
                return updatedUserData
            }
            throw new Error('獲取用戶資料失敗')
        } catch (error) {
            if (error.response?.status === 401) {
                try {
                    await this.refreshAccessToken()
                    return await this.getProfile()
                } catch (refreshError) {
                    await this.handleAuthError()
                }
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
                await store.dispatch('auth/updateUserProfile', updatedUserData)
                return updatedUserData
            }
            throw new Error('更新用戶資料失敗')
        } catch (error) {
            throw handleError(error)
        }
    }

    async changePassword(oldPassword, newPassword) {
        try {
            const userId = this.user?.userId
            if (!userId) throw new Error('用戶未登入')

            const response = await api.put(`/users/${userId}/password`, {
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
            await store.dispatch('auth/logout')
            this.clearAuthData()
            router.push('/login')
        }
    }
}

export default new AuthService()
