import api from '@/utils/axios'

class AuthService {
    constructor() {
        this.token = localStorage.getItem('token')
        this.user = JSON.parse(localStorage.getItem('user'))
    }

    setUserData(data) {
        if (data.accessToken) {
            localStorage.setItem('token', data.accessToken)
            this.token = data.accessToken
        }
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user))
            this.user = data.user
        }
    }

    clearUserData() {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        this.token = null
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

            if (response.data.accessToken) {
                this.setUserData({
                    accessToken: response.data.accessToken,
                    user: response.data.user
                })
                await this.fetchUserProfile()
                return response.data
            }
            throw new Error('登入失敗：未收到有效的認證Token')
        } catch (error) {
            throw this.handleError(error)
        }
    }

    async fetchUserProfile() {
        try {
            const response = await api.get('/api/v1/users/profile')
            const userData = this.getCurrentUser()
            const updatedUserData = { ...userData, ...response.data }
            this.setUserData({ user: updatedUserData })
            return response.data
        } catch (error) {
            throw this.handleError(error)
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
                address: userData.address,
                birthday: userData.birthday,
                gender: userData.gender
            })

            if (response.data) {
                await this.login(userData.username, userData.password)
                return response.data
            }
            throw new Error('註冊失敗')
        } catch (error) {
            throw this.handleError(error)
        }
    }

    async logout() {
        try {
            await api.post('/api/v1/users/logout')
        } catch (error) {
            console.error('登出時發生錯誤:', error)
        } finally {
            this.clearUserData()
        }
    }

    handleError(error) {
        let errorMessage = '發生未知錯誤'

        if (error.response) {
            const { status, data } = error.response

            switch (status) {
                case 400:
                    errorMessage = data.message || '請求參數錯誤'
                    break
                case 401:
                    errorMessage = '認證失敗，請重新登入'
                    this.clearUserData()
                    break
                case 403:
                    errorMessage = '無權限執行此操作'
                    break
                case 404:
                    errorMessage = '請求的資源不存在'
                    break
                case 429:
                    errorMessage = '請求過於頻繁，請稍後再試'
                    break
                case 500:
                    errorMessage = '伺服器錯誤，請稍後再試'
                    break
                default:
                    errorMessage = data.message || `請求失敗 (${status})`
            }
        } else if (error.request) {
            errorMessage = '網路連接失敗，請檢查網路設置'
        } else {
            errorMessage = error.message
        }

        return new Error(errorMessage)
    }
}

export default new AuthService()
