import axios from '@/utils/axios'

const state = {
    products: [],
    categories: [],
    currentProduct: null,
    loading: false,
    error: null,
    filters: {
        category: null,
        priceRange: null,
        sortBy: null
    },
    pagination: {
        currentPage: 1,
        totalPages: 1,
        pageSize: 12
    }
}

const getters = {
    getAllProducts: (state) => state.products,
    getCategories: (state) => state.categories,
    getCurrentProduct: (state) => state.currentProduct,
    getLoading: (state) => state.loading,
    getError: (state) => state.error,
    getFilters: (state) => state.filters,
    getPagination: (state) => state.pagination,

    getProductById: (state) => (id) => {
        return state.products.find(product => product.id === id)
    },

    getProductsByCategory: (state) => (categoryId) => {
        return state.products.filter(product => product.categoryId === categoryId)
    },

    getFeaturedProducts: (state) => {
        return state.products.filter(product => product.isFeatured)
    },

    getNewArrivals: (state) => {
        return [...state.products]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 8)
    },

    getFilteredProducts: (state) => {
        let filtered = [...state.products]

        if (state.filters.category) {
            filtered = filtered.filter(p => p.categoryId === state.filters.category)
        }

        if (state.filters.priceRange) {
            const [min, max] = state.filters.priceRange
            filtered = filtered.filter(p => p.price >= min && p.price <= max)
        }

        if (state.filters.sortBy) {
            switch(state.filters.sortBy) {
                case 'price-asc':
                    filtered.sort((a, b) => a.price - b.price)
                    break
                case 'price-desc':
                    filtered.sort((a, b) => b.price - a.price)
                    break
                case 'name-asc':
                    filtered.sort((a, b) => a.name.localeCompare(b.name))
                    break
                case 'name-desc':
                    filtered.sort((a, b) => b.name.localeCompare(a.name))
                    break
            }
        }

        return filtered
    }
}

const actions = {
    async fetchProducts({ commit, state }) {
        try {
            commit('SET_LOADING', true)
            const { currentPage, pageSize } = state.pagination
            const response = await axios.get('/api/products', {
                params: {
                    page: currentPage,
                    size: pageSize,
                    ...state.filters
                }
            })
            commit('SET_PRODUCTS', response.data.content)
            commit('SET_PAGINATION', {
                currentPage: response.data.number + 1,
                totalPages: response.data.totalPages,
                pageSize: response.data.size
            })
        } catch (error) {
            commit('SET_ERROR', error.message)
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async fetchProductById({ commit }, id) {
        try {
            commit('SET_LOADING', true)
            const response = await axios.get(`/api/products/${id}`)
            commit('SET_CURRENT_PRODUCT', response.data)
        } catch (error) {
            commit('SET_ERROR', error.message)
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async fetchCategories({ commit }) {
        try {
            const response = await axios.get('/api/categories')
            commit('SET_CATEGORIES', response.data)
        } catch (error) {
            commit('SET_ERROR', error.message)
        }
    },

    async searchProducts({ commit }, searchTerm) {
        try {
            commit('SET_LOADING', true)
            const response = await axios.get('/api/products/search', {
                params: { query: searchTerm }
            })
            commit('SET_PRODUCTS', response.data)
        } catch (error) {
            commit('SET_ERROR', error.message)
        } finally {
            commit('SET_LOADING', false)
        }
    },

    setFilters({ commit, dispatch }, filters) {
        commit('SET_FILTERS', filters)
        commit('SET_PAGINATION', { currentPage: 1 })
        dispatch('fetchProducts')
    },

    setPage({ commit, dispatch }, page) {
        commit('SET_PAGINATION', { currentPage: page })
        dispatch('fetchProducts')
    },

    clearCurrentProduct({ commit }) {
        commit('SET_CURRENT_PRODUCT', null)
    },

    clearError({ commit }) {
        commit('SET_ERROR', null)
    },

    resetFilters({ commit, dispatch }) {
        commit('RESET_FILTERS')
        dispatch('fetchProducts')
    }
}

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
    },

    SET_FILTERS(state, filters) {
        state.filters = { ...state.filters, ...filters }
    },

    SET_PAGINATION(state, pagination) {
        state.pagination = { ...state.pagination, ...pagination }
    },

    RESET_FILTERS(state) {
        state.filters = {
            category: null,
            priceRange: null,
            sortBy: null
        }
    }
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
