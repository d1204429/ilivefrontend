import axios from 'axios'
import { handleError } from '@/utils/errorHandler'
import store from '@/store'

const API_URL = import.meta.env.VITE_API_BASE_URL + '/api/v1/cart'

// 請求配置
const REQUEST_CONFIG = {
    timeout: 15000,
    retryTimes: 3,
    retryDelay: 1000,
    validateStatus: status => status >= 200 && status < 300
}

class CartService {
    constructor() {
        this.pendingRequests = new Map()
    }

    // 取消重複請求
    cancelPendingRequests(requestId) {
        if (this.pendingRequests.has(requestId)) {
            this.pendingRequests.get(requestId).cancel('Operation canceled due to new request')
            this.pendingRequests.delete(requestId)
        }
    }

    // 生成請求ID
    generateRequestId(method, url, data = null) {
        return `${method}-${url}-${JSON.stringify(data)}`
    }

    // 基礎請求方法
    async request(method, url, data = null, config = {}) {
        const requestId = this.generateRequestId(method, url, data)
        this.cancelPendingRequests(requestId)

        const source = axios.CancelToken.source()
        this.pendingRequests.set(requestId, source)

        try {
            const response = await axios({
                method,
                url: `${API_URL}${url}`,
                ...(data && { data }),
                ...REQUEST_CONFIG,
                ...config,
                cancelToken: source.token
            })
            return response.data
        } catch (error) {
            if (axios.isCancel(error)) {
                console.log('Request canceled:', error.message)
                throw new Error('操作已取消')
            }
            throw handleError(error)
        } finally {
            this.pendingRequests.delete(requestId)
        }
    }

    // 獲取購物車內容
    async getCartItems() {
        return this.request('get', '/items')
    }

    // 添加商品到購物車
    async addToCart(productId, quantity = 1, options = {}) {
        if (!productId) throw new Error('商品ID不能為空')
        if (quantity < 1) throw new Error('商品數量必須大於0')

        return this.request('post', '/items', {
            productId,
            quantity,
            ...options
        })
    }

    // 更新購物車商品數量
    async updateQuantity(cartItemId, quantity) {
        if (!cartItemId) throw new Error('購物車項目ID不能為空')
        if (quantity < 0) throw new Error('商品數量不能小於0')

        return this.request('put', `/items/${cartItemId}`, { quantity })
    }

    // 從購物車移除商品
    async removeItem(cartItemId) {
        if (!cartItemId) throw new Error('購物車項目ID不能為空')
        return this.request('delete', `/items/${cartItemId}`)
    }

    // 清空購物車
    async clearCart() {
        return this.request('delete', '/clear')
    }

    // 獲取購物車摘要
    async getCartSummary() {
        return this.request('get', '/summary')
    }

    // 檢查商品庫存
    async checkStock(cartItems) {
        if (!Array.isArray(cartItems) || !cartItems.length) {
            throw new Error('購物車項目不能為空')
        }
        return this.request('post', '/check-stock', { items: cartItems })
    }

    // 應用優惠券
    async applyCoupon(couponCode) {
        if (!couponCode?.trim()) throw new Error('優惠券代碼不能為空')
        return this.request('post', '/apply-coupon', { code: couponCode.trim() })
    }

    // 移除優惠券
    async removeCoupon() {
        return this.request('delete', '/remove-coupon')
    }

    // 計算運費
    async calculateShipping(address) {
        if (!address || !address.zipCode) {
            throw new Error('請提供完整的收貨地址')
        }
        return this.request('post', '/calculate-shipping', address)
    }

    // 驗證購物車
    async validateCart() {
        return this.request('get', '/validate')
    }

    // 批量更新購物車
    async batchUpdate(updates) {
        if (!Array.isArray(updates) || !updates.length) {
            throw new Error('更新數據不能為空')
        }
        return this.request('post', '/batch-update', { updates })
    }

    // 保存購物車到後端
    async saveCart() {
        const cartItems = await store.dispatch('cart/getCartItems')
        return this.request('post', '/save', { items: cartItems })
    }

    // 同步本地購物車到後端
    async syncCart() {
        try {
            const localCart = await store.dispatch('cart/getCartItems')
            const serverCart = await this.getCartItems()

            const mergedItems = this.mergeCartItems(localCart, serverCart)
            await this.batchUpdate(mergedItems)

            return await this.getCartItems()
        } catch (error) {
            console.error('同步購物車失敗:', error)
            throw error
        }
    }

    // 合併本地和服務器購物車項目
    mergeCartItems(localItems, serverItems) {
        const mergedMap = new Map()

        // 處理服務器項目
        serverItems.forEach(item => {
            mergedMap.set(item.productId, item)
        })

        // 合併本地項目
        localItems.forEach(item => {
            if (mergedMap.has(item.productId)) {
                const serverItem = mergedMap.get(item.productId)
                mergedMap.set(item.productId, {
                    ...serverItem,
                    quantity: Math.max(serverItem.quantity, item.quantity)
                })
            } else {
                mergedMap.set(item.productId, item)
            }
        })

        return Array.from(mergedMap.values())
    }
}

export default new CartService()
