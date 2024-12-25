import axios from '@/utils/axios'
import { productApi } from '@/services/api'
import { handleError } from '@/utils/errorHandler'

const state = {
    products: [],
    categories: [],
    currentProduct: null,
    loading: false,
    error: null,
    filters: {
        category: null,
        priceRange: null,
        sortBy: null,
        keyword: null
    },
    pagination: {
        currentPage: 1,
        totalPages: 1,
        pageSize: 12,
        total: 0
    },
    featuredProducts: [],
    newArrivals: [],
    recommendedProducts: [],
    promotions: [],
    productPromotions: []
}

const getters = {
    getAllProducts: state => state.products,
    getCategories: state => state.categories,
    getCurrentProduct: state => state.currentProduct,
    getLoading: state => state.loading,
    getError: state => state.error,
    getFilters: state => state.filters,
    getPagination: state => state.pagination,
    getFeaturedProducts: state => state.featuredProducts,
    getNewArrivals: state => state.newArrivals,
    getRecommendedProducts: state => state.recommendedProducts,
    getPromotions: state => state.promotions,
    getProductPromotions: state => state.productPromotions,

    getProductById: state => id => {
        return state.products.find(product => product.productId === id)
    },

    getProductsByCategory: state => categoryId => {
        return state.products.filter(product => product.categoryId === categoryId)
    },

    getFilteredProducts: state => {
        let filtered = [...state.products]
        const { category, priceRange, sortBy, keyword } = state.filters

        if (category) {
            filtered = filtered.filter(p => p.categoryId === category)
        }

        if (priceRange) {
            const [min, max] = priceRange
            filtered = filtered.filter(p => p.price >= min && p.price <= max)
        }

        if (keyword) {
            const search = keyword.toLowerCase()
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(search) ||
                p.description.toLowerCase().includes(search)
            )
        }

        if (sortBy) {
            switch (sortBy) {
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
                case 'newest':
                    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    break
            }
        }

        return filtered
    },

    // 獲取商品的促銷價格
    getPromotionalPrice: state => productId => {
        const promotion = state.productPromotions.find(p => p.productId === productId)
        return promotion ? promotion.promotionalPrice : null
    },

    // 獲取活躍的促銷活動
    getActivePromotions: state => {
        const now = new Date()
        return state.promotions.filter(promo =>
            promo.isActive &&
            new Date(promo.startDate) <= now &&
            new Date(promo.endDate) >= now
        )
    }
}
const actions = {
    async fetchProducts({ commit, state }) {
        try {
            commit('SET_LOADING', true)
            const { currentPage, pageSize } = state.pagination
            const { category, priceRange, sortBy, keyword } = state.filters
            const params = {
                page: currentPage,
                limit: pageSize,
                categoryId: category,
                minPrice: priceRange?.[0],
                maxPrice: priceRange?.[1],
                sortBy,
                keyword
            }
            const response = await productApi.getList(params)
            commit('SET_PRODUCTS', response.items)
            commit('SET_PAGINATION', {
                currentPage: response.currentPage,
                totalPages: response.totalPages,
                pageSize: response.pageSize,
                total: response.total
            })
        } catch (error) {
            commit('SET_ERROR', handleError(error))
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async fetchProductById({ commit }, id) {
        try {
            commit('SET_LOADING', true)
            const response = await productApi.getById(id)
            commit('SET_CURRENT_PRODUCT', response)
        } catch (error) {
            commit('SET_ERROR', handleError(error))
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async fetchCategories({ commit }) {
        try {
            const response = await productApi.getCategories()
            commit('SET_CATEGORIES', response)
        } catch (error) {
            commit('SET_ERROR', handleError(error))
        }
    },

    async fetchPromotions({ commit }) {
        try {
            const response = await productApi.getActivePromotions()
            commit('SET_PROMOTIONS', response)
        } catch (error) {
            commit('SET_ERROR', handleError(error))
        }
    },

    async fetchProductPromotions({ commit }) {
        try {
            const response = await productApi.getProductPromotions()
            commit('SET_PRODUCT_PROMOTIONS', response)
        } catch (error) {
            commit('SET_ERROR', handleError(error))
        }
    },

    async fetchFeaturedProducts({ commit }) {
        try {
            const response = await productApi.getFeaturedProducts()
            commit('SET_FEATURED_PRODUCTS', response)
        } catch (error) {
            commit('SET_ERROR', handleError(error))
        }
    },

    async fetchNewArrivals({ commit }) {
        try {
            const response = await productApi.getNewArrivals()
            commit('SET_NEW_ARRIVALS', response)
        } catch (error) {
            commit('SET_ERROR', handleError(error))
        }
    },

    async fetchRecommendedProducts({ commit }) {
        try {
            const response = await productApi.getRecommended()
            commit('SET_RECOMMENDED_PRODUCTS', response)
        } catch (error) {
            commit('SET_ERROR', handleError(error))
        }
    },

    async searchProducts({ commit }, keyword) {
        try {
            commit('SET_LOADING', true)
            const response = await productApi.search({ keyword })
            commit('SET_PRODUCTS', response.items)
            commit('SET_FILTERS', { keyword })
        } catch (error) {
            commit('SET_ERROR', handleError(error))
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

    SET_FEATURED_PRODUCTS(state, products) {
        state.featuredProducts = products
    },

    SET_NEW_ARRIVALS(state, products) {
        state.newArrivals = products
    },

    SET_RECOMMENDED_PRODUCTS(state, products) {
        state.recommendedProducts = products
    },

    SET_PROMOTIONS(state, promotions) {
        state.promotions = promotions
    },

    SET_PRODUCT_PROMOTIONS(state, promotions) {
        state.productPromotions = promotions
    },

    RESET_FILTERS(state) {
        state.filters = { category: null, priceRange: null, sortBy: null, keyword: null }
    }
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
