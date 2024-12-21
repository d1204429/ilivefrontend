import { orderApi } from '@/services/api'
import store from '@/store'

class OrderService {
    /**
     * 創建訂單
     * @param {Object} orderData - 訂單資料
     * @returns {Promise}
     */
    async createOrder(orderData) {
        try {
            const response = await orderApi.create(orderData)
            await store.dispatch('order/addOrder', response.data)
            return response.data
        } catch (error) {
            console.error('創建訂單失敗:', error)
            throw error
        }
    }

    /**
     * 獲取訂單列表
     * @param {Object} params - 查詢參數
     * @param {number} params.page - 頁碼
     * @param {number} params.limit - 每頁數量
     * @param {string} params.status - 訂單狀態
     * @param {string} params.startDate - 開始日期
     * @param {string} params.endDate - 結束日期
     * @returns {Promise}
     */
    async getOrders(params = {}) {
        try {
            const response = await orderApi.getList(params)
            await store.dispatch('order/setOrders', response.data)
            return response.data
        } catch (error) {
            console.error('獲取訂單列表失敗:', error)
            throw error
        }
    }

    /**
     * 獲取訂單詳情
     * @param {string} orderId - 訂單ID
     * @returns {Promise}
     */
    async getOrderDetail(orderId) {
        try {
            const response = await orderApi.getById(orderId)
            await store.dispatch('order/setCurrentOrder', response.data)
            return response.data
        } catch (error) {
            console.error('獲取訂單詳情失敗:', error)
            throw error
        }
    }

    /**
     * 取消訂單
     * @param {string} orderId - 訂單ID
     * @param {string} reason - 取消原因
     * @returns {Promise}
     */
    async cancelOrder(orderId, reason) {
        try {
            const response = await orderApi.cancel(orderId, reason)
            await store.dispatch('order/updateOrder', {
                id: orderId,
                data: response.data
            })
            return response.data
        } catch (error) {
            console.error('取消訂單失敗:', error)
            throw error
        }
    }

    /**
     * 支付訂單
     * @param {string} orderId - 訂單ID
     * @param {Object} paymentData - 支付資料
     * @returns {Promise}
     */
    async payOrder(orderId, paymentData) {
        try {
            const response = await orderApi.pay(orderId, paymentData)
            await store.dispatch('order/updateOrder', {
                id: orderId,
                data: response.data
            })
            return response.data
        } catch (error) {
            console.error('支付訂單失敗:', error)
            throw error
        }
    }

    /**
     * 獲取支付方式列表
     * @returns {Promise}
     */
    async getPaymentMethods() {
        try {
            const response = await orderApi.getPaymentMethods()
            return response.data
        } catch (error) {
            console.error('獲取支付方式失敗:', error)
            throw error
        }
    }

    /**
     * 確認收貨
     * @param {string} orderId - 訂單ID
     * @returns {Promise}
     */
    async confirmReceipt(orderId) {
        try {
            const response = await orderApi.confirmReceipt(orderId)
            await store.dispatch('order/updateOrder', {
                id: orderId,
                data: response.data
            })
            return response.data
        } catch (error) {
            console.error('確認收貨失敗:', error)
            throw error
        }
    }

    /**
     * 獲取物流追蹤資訊
     * @param {string} orderId - 訂單ID
     * @returns {Promise}
     */
    async getShipmentTracking(orderId) {
        try {
            const response = await orderApi.getShipmentTracking(orderId)
            return response.data
        } catch (error) {
            console.error('獲取物流追蹤失敗:', error)
            throw error
        }
    }

    /**
     * 申請退款
     * @param {string} orderId - 訂單ID
     * @param {Object} refundData - 退款資料
     * @returns {Promise}
     */
    async requestRefund(orderId, refundData) {
        try {
            const response = await orderApi.requestRefund(orderId, refundData)
            await store.dispatch('order/updateOrder', {
                id: orderId,
                data: response.data
            })
            return response.data
        } catch (error) {
            console.error('申請退款失敗:', error)
            throw error
        }
    }

    /**
     * 獲取退款狀態
     * @param {string} orderId - 訂單ID
     * @returns {Promise}
     */
    async getRefundStatus(orderId) {
        try {
            const response = await orderApi.getRefundStatus(orderId)
            return response.data
        } catch (error) {
            console.error('獲取退款狀態失敗:', error)
            throw error
        }
    }

    /**
     * 獲取訂單統計資訊
     * @returns {Promise}
     */
    async getOrderStatistics() {
        try {
            const response = await orderApi.getStatistics()
            return response.data
        } catch (error) {
            console.error('獲取訂單統計失敗:', error)
            throw error
        }
    }

    /**
     * 批量獲取訂單
     * @param {Array} orderIds - 訂單ID陣列
     * @returns {Promise}
     */
    async batchGetOrders(orderIds) {
        try {
            const response = await orderApi.batchGet(orderIds)
            return response.data
        } catch (error) {
            console.error('批量獲取訂單失敗:', error)
            throw error
        }
    }
}

export default new OrderService()
