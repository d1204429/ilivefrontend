// src/services/user.service.js
import api from './api'
import { handleError } from '@/utils/errorHandler'
import { validateEmail, validatePassword } from '@/utils/validators'

class UserService {
    constructor() {
        this.baseUrl = '/users'
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        }
    }

    // 資料驗證器
    validateUserData(userData) {
        const requiredFields = ['username', 'email', 'fullName']
        const missingFields = requiredFields.filter(field => !userData[field])

        if (missingFields.length > 0) {
            throw new Error(`缺少必要欄位: ${missingFields.join(', ')}`)
        }

        if (!validateEmail(userData.email)) {
            throw new Error('無效的電子郵件格式')
        }

        if (userData.phoneNumber && !/^\d{10}$/.test(userData.phoneNumber)) {
            throw new Error('無效的電話號碼格式')
        }
    }

    // 獲取用戶資料
    async getUserProfile() {
        try {
            const response = await api.get(`${this.baseUrl}/profile`, {
                headers: {
                    ...this.defaultHeaders,
                    'Cache-Control': 'no-cache'
                }
            })
            return this.processResponse(response)
        } catch (error) {
            throw this.handleServiceError(error, '獲取用戶資料失敗')
        }
    }

    // 更新用戶資料
    async updateUserProfile(userData) {
        try {
            this.validateUserData(userData)
            const response = await api.put(`${this.baseUrl}/profile`, userData, {
                headers: this.defaultHeaders
            })
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

            if (!validatePassword(passwordData.newPassword)) {
                throw new Error('新密碼必須包含至少8個字符，包括大小寫字母、數字和特殊符號')
            }

            const response = await api.put(`${this.baseUrl}/password`, passwordData, {
                headers: this.defaultHeaders
            })
            return this.processResponse(response)
        } catch (error) {
            throw this.handleServiceError(error, '更改密碼失敗')
        }
    }

    // 上傳頭像
    async uploadAvatar(file) {
        try {
            const validationResult = this.validateAvatarFile(file)
            if (!validationResult.isValid) {
                throw new Error(validationResult.message)
            }

            const formData = new FormData()
            formData.append('avatar', file)

            const response = await api.post(`${this.baseUrl}/avatar`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 30000 // 30秒超時
            })
            return this.processResponse(response)
        } catch (error) {
            throw this.handleServiceError(error, '上傳頭像失敗')
        }
    }

    // 驗證頭像檔案
    validateAvatarFile(file) {
        if (!file || !(file instanceof File)) {
            return { isValid: false, message: '請提供有效的檔案' }
        }

        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            return { isValid: false, message: '檔案大小不能超過5MB' }
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
        if (!allowedTypes.includes(file.type)) {
            return { isValid: false, message: '只支援 JPG、PNG 或 GIF 格式' }
        }

        return { isValid: true }
    }

    // 刪除帳號
    async deleteAccount(confirmationData) {
        try {
            if (!confirmationData.password) {
                throw new Error('請提供密碼以確認刪除')
            }

            const response = await api.delete(`${this.baseUrl}/account`, {
                data: confirmationData,
                headers: this.defaultHeaders
            })
            return this.processResponse(response)
        } catch (error) {
            throw this.handleServiceError(error, '刪除帳號失敗')
        }
    }

    // 處理響應數據
    processResponse(response) {
        if (!response || !response.data) {
            throw new Error('無效的響應數據')
        }

        // 特殊狀態處理
        if (response.status === 204) {
            return { success: true }
        }

        return response.data
    }

    // 統一的錯誤處理
    handleServiceError(error, defaultMessage) {
        const errorData = {
            message: error.response?.data?.message || error.message || defaultMessage,
            code: error.response?.status || 500,
            timestamp: new Date().toISOString(),
            details: error.response?.data?.details || {},
            originalError: error
        }

        // 特定錯誤碼處理
        switch (errorData.code) {
            case 400:
                errorData.message = '請求參數錯誤，請檢查輸入內容'
                break
            case 401:
                errorData.message = '身份驗證已過期，請重新登入'
                errorData.requiresAuth = true
                break
            case 403:
                errorData.message = '您沒有權限執行此操作'
                break
            case 404:
                errorData.message = '找不到請求的資源'
                break
            case 422:
                errorData.message = '提供的資料格式無效'
                break
            case 429:
                errorData.message = '請求過於頻繁，請稍後再試'
                break
            case 500:
                errorData.message = '服務器發生錯誤，請稍後再試'
                break
        }

        handleError(errorData)
        return errorData
    }

    // 檢查用戶會話狀態
    async checkSession() {
        try {
            const response = await api.get(`${this.baseUrl}/session`, {
                headers: {
                    ...this.defaultHeaders,
                    'Cache-Control': 'no-cache'
                }
            })
            return this.processResponse(response)
        } catch (error) {
            throw this.handleServiceError(error, '檢查會話狀態失敗')
        }
    }
}

export default new UserService()
