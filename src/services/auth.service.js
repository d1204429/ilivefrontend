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
            const response = await api.post('/users/login', {
                username,
                password
            })

            if (response.accessToken) {
                this.setAuthData({
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
                    user: response.user
                })
                return response
            }
            throw new Error('登入失敗：未收到有效的認證Token')
        } catch (error) {
            throw handleError(error)
        }
    }

    async register(userData) {
        try {
            const response = await api.post('/users/register', {
                username: userData.username,
                password: userData.password,
                email: userData.email,
                fullName: userData.fullName,
                phoneNumber: userData.phoneNumber,
                address: userData.address
            })

            if (response) {
                await this.login(userData.username, userData.password)
                return response
            }
            throw new Error('註冊失敗')
        } catch (error) {
            throw handleError(error)
        }
    }

    async getProfile() {
        try {
            const response = await api.get('/users/profile')
            const updatedUserData = { ...this.user, ...response }
            this.setAuthData({ user: updatedUserData })
            return response
        } catch (error) {
            throw handleError(error)
        }
    }

    async updateProfile(profileData) {
        try {
            const response = await api.put('/users/profile', profileData)
            const updatedUserData = { ...this.user, ...response }
            this.setAuthData({ user: updatedUserData })
            return response
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
            await api.post('/users/logout')
        } catch (error) {
            console.error('登出時發生錯誤:', error)
        } finally {
            this.clearAuthData()
        }
    }
}

export default new AuthService()
