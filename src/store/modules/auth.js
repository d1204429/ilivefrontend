import axios from 'axios'

export default {
    // 登入
    async login(credentials) {
        try {
            const response = await axios.post('/api/v1/users/login', credentials)
            const { token, user } = response.data

            // 儲存token到localStorage
            localStorage.setItem('token', token)

            // 設定axios預設headers
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

            return response.data
        } catch (error) {
            throw new Error(error.response?.data?.message || '登入失敗')
        }
    },

    // 登出
    async logout() {
        try {
            await axios.post('/api/v1/users/logout')

            // 清除localStorage
            localStorage.removeItem('token')

            // 清除axios headers
            delete axios.defaults.headers.common['Authorization']
        } catch (error) {
            console.error('登出失敗:', error)
            throw error
        }
    },

    // 註冊
    async register(userData) {
        try {
            const response = await axios.post('/api/v1/users/register', userData)
            return response.data
        } catch (error) {
            throw new Error(error.response?.data?.message || '註冊失敗')
        }
    },

    // 檢查登入狀態
    checkAuth() {
        const token = localStorage.getItem('token')
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            return true
        }
        return false
    },

    // 取得當前用戶資訊
    async getCurrentUser() {
        try {
            const response = await axios.get('/api/v1/users/profile')
            return response.data
        } catch (error) {
            throw new Error('獲取用戶資訊失敗')
        }
    },

    // 更新用戶資料
    async updateProfile(userData) {
        try {
            const response = await axios.put('/api/v1/users/profile', userData)
            return response.data
        } catch (error) {
            throw new Error(error.response?.data?.message || '更新資料失敗')
        }
    },

    // 修改密碼
    async changePassword(passwords) {
        try {
            await axios.put('/api/v1/users/password', passwords)
        } catch (error) {
            throw new Error(error.response?.data?.message || '修改密碼失敗')
        }
    },

    // 重設密碼請求
    async requestPasswordReset(email) {
        try {
            await axios.post('/api/v1/users/password-reset', { email })
        } catch (error) {
            throw new Error(error.response?.data?.message || '重設密碼請求失敗')
        }
    },

    // 驗證token
    async validateToken(token) {
        try {
            const response = await axios.post('/api/v1/users/validate-token', { token })
            return response.data
        } catch (error) {
            throw new Error('無效的token')
        }
    }
}
