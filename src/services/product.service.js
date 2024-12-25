import axios from '@/utils/axios'
import { handleError } from '@/utils/errorHandler'
import store from '@/store'

class ProductService {
    constructor() {
        this.cache = new Map()
        this.cacheTimeout = 5 * 60 * 1000 // 5分鐘快取
        this.baseURL = '/api/v1'
    }

    // 快取管理
    setCacheData(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        })
    }

    getCacheData(key) {
        const cached = this.cache.get(key)
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data
        }
        return null
    }

    clearCache() {
        this.cache.clear()
    }

    // 獲取所有商品
    async getAllProducts(params = { page: 1, limit: 20, sort: 'createdAt' }) {
        try {
            const cacheKey = `products_${JSON.stringify(params)}`
            const cached = this.getCacheData(cacheKey)
            if (cached) return cached

            const response = await axios.get(`${this.baseURL}/products`, { params })
            this.setCacheData(cacheKey, response.data)
            await store.dispatch('product/setProducts', response.data.items)
            return response.data
        } catch (error) {
            throw handleError(error, '獲取商品列表失敗')
        }
    }

    // 獲取單個商品詳情
    async getProductById(id, includeReviews = false) {
        try {
            const cacheKey = `product_${id}_${includeReviews}`
            const cached = this.getCacheData(cacheKey)
            if (cached) return cached

            const params = { include: includeReviews ? 'reviews' : '' }
            const response = await axios.get(`${this.baseURL}/products/${id}`, { params })
            this.setCacheData(cacheKey, response.data)
            await store.dispatch('product/setCurrentProduct', response.data)
            return response.data
        } catch (error) {
            throw handleError(error, '獲取商品詳情失敗')
        }
    }

    // 根據分類獲取商品
    async getProductsByCategory(categoryId, params = { page: 1, limit: 20 }) {
        try {
            const cacheKey = `category_${categoryId}_${JSON.stringify(params)}`
            const cached = this.getCacheData(cacheKey)
            if (cached) return cached

            const response = await axios.get(`${this.baseURL}/products/category/${categoryId}`, { params })
            this.setCacheData(cacheKey, response.data)
            await store.dispatch('product/setProductsByCategory', {
                categoryId,
                products: response.data.items
            })
            return response.data
        } catch (error) {
            throw handleError(error, '獲取分類商品失敗')
        }
    }

    // 搜尋商品
    async searchProducts(params = {}) {
        try {
            const searchParams = {
                ...params,
                page: params.page || 1,
                limit: params.limit || 20
            }
            const response = await axios.get(`${this.baseURL}/products/search`, { params: searchParams })
            await store.dispatch('product/setSearchResults', response.data)
            return response.data
        } catch (error) {
            throw handleError(error, '搜尋商品失敗')
        }
    }

    // 獲取精選商品
    async getFeaturedProducts(limit = 10) {
        try {
            const cacheKey = `featured_products_${limit}`
            const cached = this.getCacheData(cacheKey)
            if (cached) return cached

            const response = await axios.get(`${this.baseURL}/products/featured`, { params: { limit } })
            this.setCacheData(cacheKey, response.data)
            await store.dispatch('product/setFeaturedProducts', response.data)
            return response.data
        } catch (error) {
            throw handleError(error, '獲取精選商品失敗')
        }
    }
    // 獲取新商品
    async getNewProducts(limit = 10) {
        try {
            const cacheKey = `new_products_${limit}`
            const cached = this.getCacheData(cacheKey)
            if (cached) return cached

            const response = await axios.get(`${this.baseURL}/products/new`, { params: { limit } })
            this.setCacheData(cacheKey, response.data)
            await store.dispatch('product/setNewProducts', response.data)
            return response.data
        } catch (error) {
            throw handleError(error, '獲取最新商品失敗')
        }
    }

    // 獲取商品分類
    async getCategories(includeProducts = false) {
        try {
            const cacheKey = `categories_${includeProducts}`
            const cached = this.getCacheData(cacheKey)
            if (cached) return cached

            const params = { includeProducts }
            const response = await axios.get(`${this.baseURL}/categories`, { params })
            this.setCacheData(cacheKey, response.data)
            await store.dispatch('product/setCategories', response.data)
            return response.data
        } catch (error) {
            throw handleError(error, '獲取商品分類失敗')
        }
    }

    // 檢查商品庫存
    async checkStock(productId) {
        try {
            const response = await axios.get(`${this.baseURL}/products/${productId}/stock`)
            return response.data
        } catch (error) {
            throw handleError(error, '檢查庫存失敗')
        }
    }

    // 批量檢查商品庫存
    async batchCheckStock(productIds) {
        try {
            const response = await axios.post(`${this.baseURL}/products/batch-stock`, { productIds })
            return response.data
        } catch (error) {
            throw handleError(error, '批量檢查庫存失敗')
        }
    }

    // 獲取商品促銷資訊
    async getProductPromotions(productId) {
        try {
            const response = await axios.get(`${this.baseURL}/admin/product-promotions/product/${productId}`)
            return response.data
        } catch (error) {
            throw handleError(error, '獲取商品促銷資訊失敗')
        }
    }

    // 獲取所有促銷活動
    async getAllPromotions() {
        try {
            const response = await axios.get(`${this.baseURL}/admin/promotions`)
            return response.data
        } catch (error) {
            throw handleError(error, '獲取促銷活動失敗')
        }
    }

    // 獲取商品評價
    async getProductReviews(productId, params = { page: 1, limit: 10 }) {
        try {
            const response = await axios.get(`${this.baseURL}/products/${productId}/reviews`, { params })
            return response.data
        } catch (error) {
            throw handleError(error, '獲取商品評價失敗')
        }
    }

    // 添加商品評價
    async addProductReview(productId, reviewData) {
        try {
            const response = await axios.post(`${this.baseURL}/products/${productId}/reviews`, reviewData)
            return response.data
        } catch (error) {
            throw handleError(error, '添加評價失敗')
        }
    }

    // 更新商品評價
    async updateProductReview(productId, reviewId, reviewData) {
        try {
            const response = await axios.put(
                `${this.baseURL}/products/${productId}/reviews/${reviewId}`,
                reviewData
            )
            return response.data
        } catch (error) {
            throw handleError(error, '更新評價失敗')
        }
    }

    // 刪除商品評價
    async deleteProductReview(productId, reviewId) {
        try {
            await axios.delete(`${this.baseURL}/products/${productId}/reviews/${reviewId}`)
            return true
        } catch (error) {
            throw handleError(error, '刪除評價失敗')
        }
    }
}

export default new ProductService()
