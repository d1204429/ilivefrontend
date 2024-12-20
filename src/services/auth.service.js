import api from '@/utils/axios'
import { handleError } from '@/utils/errorHandler'

class AuthService {
    constructor() {
        this.token = localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        this.refreshToken = localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY)
        this.user = JSON.parse(localStorage.getItem('user'))
    }

    setAuthData(data) {
        if (data.accessToken) {
            localStorage.setItem(import.meta.env.VITE_JWT_TOKEN_KEY, data.accessToken)
            this.token = data.accessToken
        }
        if (data.refreshToken) {
            localStorage.setItem(import.meta.env.VITE_JWT_REFRESH_KEY, data.refreshToken)
            this.refreshToken = data.refreshToken
        }
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user))
            this.user = data.user
        }
    }

    clearAuthData() {
        localStorage.removeItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        localStorage.removeItem(import.meta.env.VITE_JWT_REFRESH_KEY)
        localStorage.removeItem('user')
        localStorage.removeItem('rememberedUsername')
        this.token = null
        this.refreshToken = null
        this.user = null
    }

    getCurrentUser() {
        return this.user
    }

    isAuthenticated() {
        return !!this.token && !!this.user
    }

    async login(username, password) {
        try {
            const response = await api.post('/users/login', {
                username,
                password
            })

            if (response && response.accessToken) {
                this.setAuthData({
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
                    user: response.user
                })
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
        try {
            if (!this.refreshToken) {
                throw new Error('無效的刷新令牌')
            }

            const response = await api.post('/users/refresh-token', {
                refreshToken: this.refreshToken
            })

            if (response && response.accessToken) {
                this.setAuthData({
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken
                })
                return response
            }
            throw new Error('Token更新失敗')
        } catch (error) {
            this.clearAuthData()
            throw handleError(error)
        }
    }

    async getProfile() {
        try {
            const userId = this.user?.userId
            if (!userId) throw new Error('用戶未登入')

            const response = await api.get(`/users/${userId}`)
            if (response && response.user) {
                const updatedUserData = { ...this.user, ...response.user }
                this.setAuthData({ user: updatedUserData })
                return response.user
            }
            throw new Error('獲取用戶資料失敗')
        } catch (error) {
            throw handleError(error)
        }
    }

    async updateProfile(profileData) {
        try {
            const userId = this.user?.userId
            if (!userId) throw new Error('用戶未登入')

            const response = await api.put(`/users/${userId}`, profileData)
            if (response && response.user) {
                const updatedUserData = { ...this.user, ...response.user }
                this.setAuthData({ user: updatedUserData })
                return response.user
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
            this.clearAuthData()
        }
    }
}

export default new AuthService()
