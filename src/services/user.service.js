import api from './api'
import { handleError } from '@/utils/errorHandler'

class UserService {
    constructor() {
        this.baseUrl = '/users'
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        }
    }

    // 驗證用戶資料
    validateUserData(userData) {
        const requiredFields = ['username', 'email']
        const missingFields = requiredFields.filter(field => !userData[field])

        if (missingFields.length > 0) {
            throw new Error(`缺少必要欄位: ${missingFields.join(', ')}`)
        }

        if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
            throw new Error('無效的電子郵件格式')
        }
    }

    // 獲取用戶資料
    async getUserProfile() {
        try {
            const response = await api.get(`${this.baseUrl}/profile`)
            return this.processResponse(response)
        } catch (error) {
            throw this.handleServiceError(error, '獲取用戶資料失敗')
        }
    }

    // 更新用戶資料
    async updateUserProfile(userData) {
        try {
            this.validateUserData(userData)
            const response = await api.put(`${this.baseUrl}/profile`, userData)
            return this.processResponse(response)
        } catch (error) {
            throw this.handleServiceError(error, '更新用戶資料失敗')
        }
    }

    // 更改密碼
    async changePassword(passwordData) {
        try {
            if (!passwordData.oldPassword || !passwordData.newPassword) {
                throw new Error('請提供舊密碼和新密碼')
            }

            if (passwordData.newPassword.length < 8) {
                throw new Error('新密碼長度必須至少8個字符')
            }

            const response = await api.put(`${this.baseUrl}/password`, passwordData)
            return this.processResponse(response)
        } catch (error) {
            throw this.handleServiceError(error, '更改密碼失敗')
        }
    }

    // 上傳頭像
    async uploadAvatar(file) {
        try {
            if (!file || !(file instanceof File)) {
                throw new Error('請提供有效的檔案')
            }

            const maxSize = 5 * 1024 * 1024 // 5MB
            if (file.size > maxSize) {
                throw new Error('檔案大小不能超過5MB')
            }

            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
            if (!allowedTypes.includes(file.type)) {
                throw new Error('只支援 JPG、PNG 或 GIF 格式')
            }

            const formData = new FormData()
            formData.append('avatar', file)

            const response = await api.post(`${this.baseUrl}/avatar`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            return this.processResponse(response)
        } catch (error) {
            throw this.handleServiceError(error, '上傳頭像失敗')
        }
    }

    // 刪除帳號
    async deleteAccount(confirmationData) {
        try {
            if (!confirmationData.password) {
                throw new Error('請提供密碼以確認刪除')
            }

            const response = await api.delete(`${this.baseUrl}/account`, {
                data: confirmationData
            })
            return this.processResponse(response)
        } catch (error) {
            throw this.handleServiceError(error, '刪除帳號失敗')
        }
    }

    // 獲取用戶偏好設定
    async getUserPreferences() {
        try {
            const response = await api.get(`${this.baseUrl}/preferences`)
            return this.processResponse(response)
        } catch (error) {
            throw this.handleServiceError(error, '獲取用戶偏好設定失敗')
        }
    }

    // 更新用戶偏好設定
    async updateUserPreferences(preferences) {
        try {
            const response = await api.put(`${this.baseUrl}/preferences`, preferences)
            return this.processResponse(response)
        } catch (error) {
            throw this.handleServiceError(error, '更新用戶偏好設定失敗')
        }
    }

    // 驗證電子郵件
    async verifyEmail(token) {
        try {
            if (!token) {
                throw new Error('缺少驗證令牌')
            }

            const response = await api.post(`${this.baseUrl}/verify-email`, { token })
            return this.processResponse(response)
        } catch (error) {
            throw this.handleServiceError(error, '驗證電子郵件失敗')
        }
    }

    // 重新發送驗證郵件
    async resendVerificationEmail() {
        try {
            const response = await api.post(`${this.baseUrl}/resend-verification`)
            return this.processResponse(response)
        } catch (error) {
            throw this.handleServiceError(error, '重新發送驗證郵件失敗')
        }
    }

    // 處理響應數據
    processResponse(response) {
        if (!response || !response.data) {
            throw new Error('無效的響應數據')
        }
        return response.data
    }

    // 統一的錯誤處理
    handleServiceError(error, defaultMessage) {
        const errorData = {
            message: error.response?.data?.message || error.message || defaultMessage,
            code: error.response?.status || 500,
            timestamp: new Date().toISOString(),
            details: error.response?.data?.details || {}
        }

        // 特定錯誤碼處理
        switch (errorData.code) {
            case 400:
                errorData.message = '請求參數錯誤'
                break
            case 401:
                errorData.message = '請重新登入'
                errorData.requiresAuth = true
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
            case 429:
                errorData.message = '請求過於頻繁，請稍後再試'
                break
        }

        handleError(errorData)
        return errorData
    }

    // 檢查用戶會話狀態
    async checkSession() {
        try {
            const response = await api.get(`${this.baseUrl}/session`)
            return this.processResponse(response)
        } catch (error) {
            throw this.handleServiceError(error, '檢查會話狀態失敗')
        }
    }
}

export default new UserService()
