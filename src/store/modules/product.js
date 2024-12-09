import { defineStore } from 'pinia'
import axios from 'axios'

export const useProductStore = defineStore('product', {
    state: () => ({
        products: [],
        categories: [],
        currentProduct: null,
        loading: false,
        error: null
    }),

    getters: {
        getProductById: (state) => (id) => {
            return state.products.find(product => product.productId === id)
        },

        getProductsByCategory: (state) => (categoryId) => {
            return state.products.filter(product => product.categoryId === categoryId)
        },

        getFeaturedProducts: (state) => {
            return state.products.filter(product => product.isFeatured)
        },

        getNewProducts: (state) => {
            return state.products.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            ).slice(0, 8)
        }
    },

    actions: {
        // 獲取所有商品
        async fetchProducts() {
            try {
                this.loading = true
                const response = await axios.get('/api/v1/products')
                this.products = response.data
            } catch (error) {
                this.error = error.message
            } finally {
                this.loading = false
            }
        },

        // 獲取單個商品詳情
        async fetchProductById(id) {
            try {
                this.loading = true
                const response = await axios.get(`/api/v1/products/${id}`)
                this.currentProduct = response.data
            } catch (error) {
                this.error = error.message
            } finally {
                this.loading = false
            }
        },

        // 獲取商品分類
        async fetchCategories() {
            try {
                const response = await axios.get('/api/v1/products/categories')
                this.categories = response.data
            } catch (error) {
                this.error = error.message
            }
        },

        // 搜尋商品
        async searchProducts(params) {
            try {
                this.loading = true
                const response = await axios.get('/api/v1/products/search', { params })
                this.products = response.data
            } catch (error) {
                this.error = error.message
            } finally {
                this.loading = false
            }
        },

        // 根據分類獲取商品
        async fetchProductsByCategory(categoryId) {
            try {
                this.loading = true
                const response = await axios.get(`/api/v1/products/category/${categoryId}`)
                this.products = response.data
            } catch (error) {
                this.error = error.message
            } finally {
                this.loading = false
            }
        },

        // 清除當前商品
        clearCurrentProduct() {
            this.currentProduct = null
        },

        // 清除錯誤信息
        clearError() {
            this.error = null
        }
    }
})
