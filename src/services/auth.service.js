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
        this.token = null
        this.refreshToken = null
        this.user = null
    }

    getCurrentUser() {
        return this.user
    }

    isAuthenticated() {
        return !!this.token
    }

    async login(username, password) {
        try {
            const response = await api.post('/api/v1/users/login', {
                username,
                password
            })

            if (response.data && response.data.accessToken) {
                this.setAuthData({
                    accessToken: response.data.accessToken,
                    refreshToken: response.data.refreshToken,
                    user: response.data.user
                })
                return response.data
            }
            throw new Error('登入失敗：未收到有效的認證Token')
        } catch (error) {
            throw handleError(error)
        }
    }

    async register(userData) {
        try {
            const response = await api.post('/api/v1/users/register', {
                username: userData.username,
                password: userData.password,
                email: userData.email,
                fullName: userData.fullName,
                phoneNumber: userData.phoneNumber,
                address: userData.address
            })

            if (response.data) {
                await this.login(userData.username, userData.password)
                return response.data
            }
            throw new Error('註冊失敗')
        } catch (error) {
            throw handleError(error)
        }
    }

    async refreshAccessToken() {
        try {
            const response = await api.post('/api/v1/users/refresh-token', {
                refreshToken: this.refreshToken
            })

            if (response.data && response.data.accessToken) {
                this.setAuthData({
                    accessToken: response.data.accessToken,
                    refreshToken: response.data.refreshToken
                })
                return response.data
            }
            throw new Error('Token更新失敗')
        } catch (error) {
            this.clearAuthData()
            throw handleError(error)
        }
    }

    async getProfile() {
        try {
            const userId = this.user ? this.user.userId : null
            if (!userId) throw new Error('用戶未登入')

            const response = await api.get(`/api/v1/users/${userId}`)
            if (response.data) {
                const updatedUserData = { ...this.user, ...response.data }
                this.setAuthData({ user: updatedUserData })
                return response.data
            }
            throw new Error('獲取用戶資料失敗')
        } catch (error) {
            throw handleError(error)
        }
    }

    async updateProfile(profileData) {
        try {
            const userId = this.user ? this.user.userId : null
            if (!userId) throw new Error('用戶未登入')

            const response = await api.put(`/api/v1/users/${userId}`, profileData)
            if (response.data) {
                const updatedUserData = { ...this.user, ...response.data }
                this.setAuthData({ user: updatedUserData })
                return response.data
            }
            throw new Error('更新用戶資料失敗')
        } catch (error) {
            throw handleError(error)
        }
    }

    async changePassword(oldPassword, newPassword) {
        try {
            const userId = this.user ? this.user.userId : null
            if (!userId) throw new Error('用戶未登入')

            const response = await api.put(`/api/v1/users/${userId}/password`, {
                oldPassword,
                newPassword
            })
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    async logout() {
        try {
            if (this.token) {
                await api.post('/api/v1/users/logout')
            }
        } catch (error) {
            console.error('登出時發生錯誤:', error)
        } finally {
            this.clearAuthData()
        }
    }
}

export default new AuthService()
