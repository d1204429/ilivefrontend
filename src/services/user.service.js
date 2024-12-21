import api from './api'

class UserService {
    constructor() {
        this.baseUrl = '/users'
    }

    // 獲取用戶資料
    async getUserProfile() {
        try {
            const response = await api.get(`${this.baseUrl}/profile`)
            return response.data
        } catch (error) {
            throw this.handleError(error, '獲取用戶資料失敗')
        }
    }

    // 更新用戶資料
    async updateUserProfile(userData) {
        try {
            const response = await api.put(`${this.baseUrl}/profile`, userData)
            return response.data
        } catch (error) {
            throw this.handleError(error, '更新用戶資料失敗')
        }
    }

    // 更改密碼
    async changePassword(passwordData) {
        try {
            const response = await api.put(`${this.baseUrl}/password`, passwordData)
            return response.data
        } catch (error) {
            throw this.handleError(error, '更改密碼失敗')
        }
    }

    // 上傳頭像
    async uploadAvatar(formData) {
        try {
            const response = await api.post(`${this.baseUrl}/avatar`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            return response.data
        } catch (error) {
            throw this.handleError(error, '上傳頭像失敗')
        }
    }

    // 刪除帳號
    async deleteAccount() {
        try {
            const response = await api.delete(`${this.baseUrl}/account`)
            return response.data
        } catch (error) {
            throw this.handleError(error, '刪除帳號失敗')
        }
    }

    // 獲取用戶偏好設定
    async getUserPreferences() {
        try {
            const response = await api.get(`${this.baseUrl}/preferences`)
            return response.data
        } catch (error) {
            throw this.handleError(error, '獲取用戶偏好設定失敗')
        }
    }

    // 更新用戶偏好設定
    async updateUserPreferences(preferences) {
        try {
            const response = await api.put(`${this.baseUrl}/preferences`, preferences)
            return response.data
        } catch (error) {
            throw this.handleError(error, '更新用戶偏好設定失敗')
        }
    }

    // 驗證電子郵件
    async verifyEmail(token) {
        try {
            const response = await api.post(`${this.baseUrl}/verify-email`, { token })
            return response.data
        } catch (error) {
            throw this.handleError(error, '驗證電子郵件失敗')
        }
    }

    // 重新發送驗證郵件
    async resendVerificationEmail() {
        try {
            const response = await api.post(`${this.baseUrl}/resend-verification`)
            return response.data
        } catch (error) {
            throw this.handleError(error, '重新發送驗證郵件失敗')
        }
    }

    // 統一的錯誤處理
    handleError(error, defaultMessage) {
        const errorMessage = error.response?.data?.message || defaultMessage
        const errorCode = error.response?.status
        const errorData = {
            message: errorMessage,
            code: errorCode,
            timestamp: new Date().toISOString()
        }

        // 特定錯誤碼處理
        switch (errorCode) {
            case 401:
                errorData.message = '請重新登入'
                break
            case 403:
                errorData.message = '您沒有權限執行此操作'
                break
            case 404:
                errorData.message = '找不到用戶資料'
                break
            case 422:
                errorData.message = '提供的資料無效'
                break
        }

        return errorData
    }
}

export default new UserService()
