import axios from 'axios'
import { handleError } from '@/utils/errorHandler'

const API_URL = '/api/v1/users'

class UserService {
    // 獲取用戶資料
    async getUserProfile() {
        try {
            const response = await axios.get(`${API_URL}/profile`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 更新用戶資料
    async updateProfile(userData) {
        try {
            const response = await axios.put(`${API_URL}/profile`, userData)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 更新密碼
    async updatePassword(passwordData) {
        try {
            const response = await axios.put(`${API_URL}/password`, passwordData)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 獲取用戶訂單
    async getUserOrders(params = {}) {
        try {
            const response = await axios.get(`${API_URL}/orders`, { params })
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 獲取用戶地址列表
    async getUserAddresses() {
        try {
            const response = await axios.get(`${API_URL}/addresses`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 新增地址
    async addAddress(addressData) {
        try {
            const response = await axios.post(`${API_URL}/addresses`, addressData)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 更新地址
    async updateAddress(addressId, addressData) {
        try {
            const response = await axios.put(`${API_URL}/addresses/${addressId}`, addressData)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 刪除地址
    async deleteAddress(addressId) {
        try {
            const response = await axios.delete(`${API_URL}/addresses/${addressId}`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 設置預設地址
    async setDefaultAddress(addressId) {
        try {
            const response = await axios.put(`${API_URL}/addresses/${addressId}/default`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 獲取用戶收藏列表
    async getFavorites() {
        try {
            const response = await axios.get(`${API_URL}/favorites`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 新增收藏
    async addToFavorites(productId) {
        try {
            const response = await axios.post(`${API_URL}/favorites`, { productId })
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 移除收藏
    async removeFromFavorites(productId) {
        try {
            const response = await axios.delete(`${API_URL}/favorites/${productId}`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 獲取用戶通知
    async getNotifications() {
        try {
            const response = await axios.get(`${API_URL}/notifications`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 標記通知為已讀
    async markNotificationAsRead(notificationId) {
        try {
            const response = await axios.put(`${API_URL}/notifications/${notificationId}/read`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 刪除通知
    async deleteNotification(notificationId) {
        try {
            const response = await axios.delete(`${API_URL}/notifications/${notificationId}`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 更新用戶設定
    async updateSettings(settings) {
        try {
            const response = await axios.put(`${API_URL}/settings`, settings)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 獲取用戶設定
    async getSettings() {
        try {
            const response = await axios.get(`${API_URL}/settings`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }
}

export default new UserService()
