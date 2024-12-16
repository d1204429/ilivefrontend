import axios from 'axios'

// Initial state
const state = {
    products: [],
    categories: [],
    currentProduct: null,
    loading: false,
    error: null
}

// Getters
const getters = {
    getAllProducts: (state) => state.products,
    getCurrentProduct: (state) => state.currentProduct,
    getLoading: (state) => state.loading,
    getError: (state) => state.error,
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
}

// Actions
const actions = {
    async fetchProducts({ commit }) {
        try {
            commit('SET_LOADING', true)
            const response = await axios.get('/api/v1/products')
            commit('SET_PRODUCTS', response.data)
            commit('SET_LOADING', false)
        } catch (error) {
            commit('SET_ERROR', error.message)
            commit('SET_LOADING', false)
        }
    },
    async fetchProductById({ commit }, id) {
        try {
            commit('SET_LOADING', true)
            const response = await axios.get(`/api/v1/products/${id}`)
            commit('SET_CURRENT_PRODUCT', response.data)
            commit('SET_LOADING', false)
        } catch (error) {
            commit('SET_ERROR', error.message)
            commit('SET_LOADING', false)
        }
    },
    async fetchCategories({ commit }) {
        try {
            const response = await axios.get('/api/v1/products/categories')
            commit('SET_CATEGORIES', response.data)
        } catch (error) {
            commit('SET_ERROR', error.message)
        }
    },
    async searchProducts({ commit }, params) {
        try {
            commit('SET_LOADING', true)
            const response = await axios.get('/api/v1/products/search', { params })
            commit('SET_PRODUCTS', response.data)
            commit('SET_LOADING', false)
        } catch (error) {
            commit('SET_ERROR', error.message)
            commit('SET_LOADING', false)
        }
    },
    async fetchProductsByCategory({ commit }, categoryId) {
        try {
            commit('SET_LOADING', true)
            const response = await axios.get(`/api/v1/products/category/${categoryId}`)
            commit('SET_PRODUCTS', response.data)
            commit('SET_LOADING', false)
        } catch (error) {
            commit('SET_ERROR', error.message)
            commit('SET_LOADING', false)
        }
    },
    clearCurrentProduct({ commit }) {
        commit('SET_CURRENT_PRODUCT', null)
    },
    clearError({ commit }) {
        commit('SET_ERROR', null)
    }
}

// Mutations
const mutations = {
    SET_PRODUCTS(state, products) {
        state.products = products
    },
    SET_CATEGORIES(state, categories) {
        state.categories = categories
    },
    SET_CURRENT_PRODUCT(state, product) {
        state.currentProduct = product
    },
    SET_LOADING(state, status) {
        state.loading = status
    },
    SET_ERROR(state, error) {
        state.error = error
    }
}

// Export the store module
export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
