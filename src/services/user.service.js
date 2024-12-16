import axios from 'axios'
import { handleError } from '@/utils/errorHandler'

const API_URL = '/api/v1/users'

class UserService {
    // 獲取用戶資料
    async getUserProfile(userId) {
        try {
            const response = await axios.get(`${API_URL}/${userId}`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 更新用戶資料
    async updateProfile(userId, userData) {
        try {
            const response = await axios.put(`${API_URL}/${userId}`, userData)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 更新密碼
    async updatePassword(userId, passwordData) {
        try {
            const response = await axios.put(`${API_URL}/${userId}/password`, passwordData)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 獲取用戶訂單
    async getUserOrders(userId, params = {}) {
        try {
            const response = await axios.get(`${API_URL}/${userId}/orders`, { params })
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 獲取用戶地址列表
    async getUserAddresses(userId) {
        try {
            const response = await axios.get(`${API_URL}/${userId}/addresses`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 新增地址
    async addAddress(userId, addressData) {
        try {
            const response = await axios.post(`${API_URL}/${userId}/addresses`, addressData)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 更新地址
    async updateAddress(userId, addressId, addressData) {
        try {
            const response = await axios.put(`${API_URL}/${userId}/addresses/${addressId}`, addressData)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 刪除地址
    async deleteAddress(userId, addressId) {
        try {
            const response = await axios.delete(`${API_URL}/${userId}/addresses/${addressId}`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 設置預設地址
    async setDefaultAddress(userId, addressId) {
        try {
            const response = await axios.put(`${API_URL}/${userId}/addresses/${addressId}/default`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 獲取用戶收藏列表
    async getFavorites(userId) {
        try {
            const response = await axios.get(`${API_URL}/${userId}/favorites`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 新增收藏
    async addToFavorites(userId, productId) {
        try {
            const response = await axios.post(`${API_URL}/${userId}/favorites`, { productId })
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 移除收藏
    async removeFromFavorites(userId, productId) {
        try {
            const response = await axios.delete(`${API_URL}/${userId}/favorites/${productId}`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 獲取用戶通知
    async getNotifications(userId) {
        try {
            const response = await axios.get(`${API_URL}/${userId}/notifications`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 標記通知為已讀
    async markNotificationAsRead(userId, notificationId) {
        try {
            const response = await axios.put(`${API_URL}/${userId}/notifications/${notificationId}/read`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 刪除通知
    async deleteNotification(userId, notificationId) {
        try {
            const response = await axios.delete(`${API_URL}/${userId}/notifications/${notificationId}`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 更新用戶設定
    async updateSettings(userId, settings) {
        try {
            const response = await axios.put(`${API_URL}/${userId}/settings`, settings)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 獲取用戶設定
    async getSettings(userId) {
        try {
            const response = await axios.get(`${API_URL}/${userId}/settings`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }
}

export default new UserService()
