import axios from '@/utils/axios'
import { handleError } from '@/utils/errorHandler'
import store from '@/store'

class ProductService {
    constructor() {
        this.cache = new Map()
        this.cacheTimeout = 5 * 60 * 1000 // 5分鐘快取
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

    // 獲取所有商品
    async getAllProducts(params = { page: 1, limit: 20, sort: 'createdAt' }) {
        try {
            const cacheKey = `products_${JSON.stringify(params)}`
            const cached = this.getCacheData(cacheKey)
            if (cached) return cached

            const response = await axios.get('/api/v1/products', { params })
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
            const params = { include: includeReviews ? 'reviews' : '' }
            const response = await axios.get(`/api/v1/products/${id}`, { params })
            await store.dispatch('product/setCurrentProduct', response.data)
            return response.data
        } catch (error) {
            throw handleError(error, '獲取商品詳情失敗')
        }
    }

    // 根據分類獲取商品
    async getProductsByCategory(categoryId, params = { page: 1, limit: 20 }) {
        try {
            const response = await axios.get(`/api/v1/products/category/${categoryId}`, { params })
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
            const response = await axios.get('/api/v1/products/search', {
                params: {
                    ...params,
                    page: params.page || 1,
                    limit: params.limit || 20
                }
            })
            await store.dispatch('product/setSearchResults', response.data)
            return response.data
        } catch (error) {
            throw handleError(error, '搜尋商品失敗')
        }
    }

    // 獲取精選商品
    async getFeaturedProducts(limit = 10) {
        try {
            const response = await axios.get('/api/v1/products/featured', { params: { limit } })
            await store.dispatch('product/setFeaturedProducts', response.data)
            return response.data
        } catch (error) {
            throw handleError(error, '獲取精選商品失敗')
        }
    }

    // 獲取最新商品
    async getNewProducts(limit = 10) {
        try {
            const response = await axios.get('/api/v1/products/new', { params: { limit } })
            await store.dispatch('product/setNewProducts', response.data)
            return response.data
        } catch (error) {
            throw handleError(error, '獲取最新商品失敗')
        }
    }

    // 獲取商品分類
    async getCategories(includeProducts = false) {
        try {
            const params = { includeProducts: includeProducts }
            const response = await axios.get('/api/v1/categories', { params })
            await store.dispatch('product/setCategories', response.data)
            return response.data
        } catch (error) {
            throw handleError(error, '獲取商品分類失敗')
        }
    }

    // 檢查商品庫存
    async checkStock(productId) {
        try {
            const response = await axios.get(`/api/v1/products/${productId}/stock`)
            return response.data
        } catch (error) {
            throw handleError(error, '檢查庫存失敗')
        }
    }

    // 批量檢查商品庫存
    async batchCheckStock(productIds) {
        try {
            const response = await axios.post('/api/v1/products/batch-stock', { productIds })
            return response.data
        } catch (error) {
            throw handleError(error, '批量檢查庫存失敗')
        }
    }

    // 獲取商品評價
    async getProductReviews(productId, params = { page: 1, limit: 10 }) {
        try {
            const response = await axios.get(`/api/v1/products/${productId}/reviews`, { params })
            return response.data
        } catch (error) {
            throw handleError(error, '獲取商品評價失敗')
        }
    }

    // 添加商品評價
    async addProductReview(productId, reviewData) {
        try {
            const response = await axios.post(`/api/v1/products/${productId}/reviews`, reviewData)
            return response.data
        } catch (error) {
            throw handleError(error, '添加評價失敗')
        }
    }

    // 更新商品評價
    async updateProductReview(productId, reviewId, reviewData) {
        try {
            const response = await axios.put(
                `/api/v1/products/${productId}/reviews/${reviewId}`,
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
            await axios.delete(`/api/v1/products/${productId}/reviews/${reviewId}`)
            return true
        } catch (error) {
            throw handleError(error, '刪除評價失敗')
        }
    }
}

export default new ProductService()
