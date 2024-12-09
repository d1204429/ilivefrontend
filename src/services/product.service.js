import axios from 'axios'

class ProductService {
    // 獲取所有商品
    async getAllProducts() {
        try {
            const response = await axios.get('/api/v1/products')
            return response.data
        } catch (error) {
            throw new Error('獲取商品列表失敗')
        }
    }

    // 獲取單個商品詳情
    async getProductById(id) {
        try {
            const response = await axios.get(`/api/v1/products/${id}`)
            return response.data
        } catch (error) {
            throw new Error('獲取商品詳情失敗')
        }
    }

    // 根據分類獲取商品
    async getProductsByCategory(categoryId) {
        try {
            const response = await axios.get(`/api/v1/products/category/${categoryId}`)
            return response.data
        } catch (error) {
            throw new Error('獲取分類商品失敗')
        }
    }

    // 搜尋商品
    async searchProducts(params) {
        try {
            const response = await axios.get('/api/v1/products/search', { params })
            return response.data
        } catch (error) {
            throw new Error('搜尋商品失敗')
        }
    }

    // 獲取精選商品
    async getFeaturedProducts() {
        try {
            const response = await axios.get('/api/v1/products/featured')
            return response.data
        } catch (error) {
            throw new Error('獲取精選商品失敗')
        }
    }

    // 獲取最新商品
    async getNewProducts() {
        try {
            const response = await axios.get('/api/v1/products/new')
            return response.data
        } catch (error) {
            throw new Error('獲取最新商品失敗')
        }
    }

    // 獲取商品分類
    async getCategories() {
        try {
            const response = await axios.get('/api/v1/products/categories')
            return response.data
        } catch (error) {
            throw new Error('獲取商品分類失敗')
        }
    }

    // 檢查商品庫存
    async checkStock(productId) {
        try {
            const response = await axios.get(`/api/v1/products/${productId}/stock`)
            return response.data
        } catch (error) {
            throw new Error('檢查庫存失敗')
        }
    }

    // 獲取商品評價
    async getProductReviews(productId) {
        try {
            const response = await axios.get(`/api/v1/products/${productId}/reviews`)
            return response.data
        } catch (error) {
            throw new Error('獲取商品評價失敗')
        }
    }

    // 添加商品評價
    async addProductReview(productId, reviewData) {
        try {
            const response = await axios.post(`/api/v1/products/${productId}/reviews`, reviewData)
            return response.data
        } catch (error) {
            throw new Error('添加評價失敗')
        }
    }
}

export default new ProductService()
