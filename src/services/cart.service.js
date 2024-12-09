import axios from 'axios'
import { handleError } from '@/utils/errorHandler'

const API_URL = '/api/v1/cart'

class CartService {
    // 獲取購物車內容
    async getCartItems() {
        try {
            const response = await axios.get(`${API_URL}/items`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 添加商品到購物車
    async addToCart(productId, quantity, options = {}) {
        try {
            const response = await axios.post(`${API_URL}/items`, {
                productId,
                quantity,
                ...options
            })
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 更新購物車商品數量
    async updateQuantity(cartItemId, quantity) {
        try {
            const response = await axios.put(`${API_URL}/items/${cartItemId}`, {
                quantity
            })
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 從購物車移除商品
    async removeItem(cartItemId) {
        try {
            const response = await axios.delete(`${API_URL}/items/${cartItemId}`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 清空購物車
    async clearCart() {
        try {
            const response = await axios.delete(`${API_URL}/clear`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 獲取購物車摘要
    async getCartSummary() {
        try {
            const response = await axios.get(`${API_URL}/summary`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 檢查商品庫存
    async checkStock(cartItems) {
        try {
            const response = await axios.post(`${API_URL}/check-stock`, {
                items: cartItems
            })
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 應用優惠券
    async applyCoupon(couponCode) {
        try {
            const response = await axios.post(`${API_URL}/apply-coupon`, {
                code: couponCode
            })
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 移除優惠券
    async removeCoupon() {
        try {
            const response = await axios.delete(`${API_URL}/remove-coupon`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 計算運費
    async calculateShipping(address) {
        try {
            const response = await axios.post(`${API_URL}/calculate-shipping`, address)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }

    // 驗證購物車
    async validateCart() {
        try {
            const response = await axios.get(`${API_URL}/validate`)
            return response.data
        } catch (error) {
            throw handleError(error)
        }
    }
}

export default new CartService()
