import axios from 'axios'
import router from '@/router'
import store from '@/store'
import { handleError } from '@/utils/errorHandler'

// Token 相關常量
const TOKEN_CONSTANTS = {
    ACCESS_TOKEN_KEY: import.meta.env.VITE_JWT_TOKEN_KEY,
    REFRESH_TOKEN_KEY: import.meta.env.VITE_JWT_REFRESH_KEY,
    TOKEN_PREFIX: 'Bearer'
}

// API 配置常量
const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:1988/api/v1',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
    withCredentials: true,
    validateStatus: status => status >= 200 && status < 300
}

// API 路徑常量
export const API_PATHS = {
    AUTH: {
        BASE: '/users',
        LOGIN: '/users/login',
        REGISTER: '/users/register',
        LOGOUT: '/users/logout',
        REFRESH_TOKEN: '/users/refresh-token',
        VERIFY_EMAIL: '/users/verify-email',
        FORGOT_PASSWORD: '/users/forgot-password',
        RESET_PASSWORD: '/users/reset-password',
        CHECK_EMAIL: '/users/check-email'
    },
    USERS: {
        BASE: '/users',
        PROFILE: '/users/profile',
        PASSWORD: '/users/password',
        AVATAR: '/users/avatar',
        ADDRESSES: '/users/addresses',
        PREFERENCES: '/users/preferences'
    },
    PRODUCTS: {
        BASE: '/products',
        SEARCH: '/products/search',
        NEW_ARRIVALS: '/products/new-arrivals',
        RECOMMENDED: '/products/recommended',
        REVIEWS: '/reviews',
        PROMOTIONS: '/admin/promotions',
        PRODUCT_PROMOTIONS: '/admin/product-promotions'
    },
    CART: {
        BASE: '/cart',
        ITEMS: '/cart/items',
        COUPON: '/cart/coupon',
        SHIPPING: '/cart/shipping-methods',
        CHECKOUT: '/cart/checkout'
    },
    ORDERS: {
        BASE: '/orders',
        PAYMENT: '/payment',
        TRACKING: '/tracking'
    },
    CATEGORIES: '/categories',
    ADMIN: {
        PROMOTIONS: '/admin/promotions',
        PRODUCT_PROMOTIONS: '/admin/product-promotions/products'
    }
}

// 創建 axios 實例
const api = axios.create(API_CONFIG)

// 請求隊列和刷新標記
let isRefreshing = false
let failedQueue = []

// 請求重試配置
const retryConfig = {
    retries: 2,
    retryDelay: 1000,
    shouldRetry: (error) => {
        return (
            error.code === 'ECONNABORTED' ||
            error.response?.status === 408 ||
            error.response?.status === 429 ||
            error.response?.status >= 500
        )
    }
}
// Token 管理器
const tokenManager = {
    getAccessToken: () => localStorage.getItem(TOKEN_CONSTANTS.ACCESS_TOKEN_KEY),
    getRefreshToken: () => localStorage.getItem(TOKEN_CONSTANTS.REFRESH_TOKEN_KEY),
    setTokens: (accessToken, refreshToken) => {
        localStorage.setItem(TOKEN_CONSTANTS.ACCESS_TOKEN_KEY, accessToken)
        localStorage.setItem(TOKEN_CONSTANTS.REFRESH_TOKEN_KEY, refreshToken)
    },
    removeTokens: () => {
        localStorage.removeItem(TOKEN_CONSTANTS.ACCESS_TOKEN_KEY)
        localStorage.removeItem(TOKEN_CONSTANTS.REFRESH_TOKEN_KEY)
    }
}

// 處理請求隊列
const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })
    failedQueue = []
}

// 請求攔截器
api.interceptors.request.use(
    async config => {
        if (!config.hideLoading) {
            store.dispatch('app/setLoading', true)
        }

        const token = tokenManager.getAccessToken()
        if (token && !config.skipAuth) {
            config.headers.Authorization = `${TOKEN_CONSTANTS.TOKEN_PREFIX} ${token}`
        }

        if (config.method?.toLowerCase() === 'get' && !config.noCache) {
            config.params = { ...config.params, _t: Date.now() }
        }

        config.metadata = { startTime: Date.now() }
        config.requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`

        const source = axios.CancelToken.source()
        config.cancelToken = source.token
        config._cancelSource = source

        return config
    },
    error => {
        store.dispatch('app/setLoading', false)
        return Promise.reject(error)
    }
)

// 響應攔截器
api.interceptors.response.use(
    response => {
        if (!response.config.hideLoading) {
            store.dispatch('app/setLoading', false)
        }
        return response.config.fullResponse ? response : response.data
    },
    async error => {
        if (!error.config?.hideLoading) {
            store.dispatch('app/setLoading', false)
        }

        const originalRequest = error.config

        // 處理 401 錯誤和 token 刷新
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                try {
                    const token = await new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject })
                    })
                    originalRequest.headers.Authorization = `${TOKEN_CONSTANTS.TOKEN_PREFIX} ${token}`
                    return api(originalRequest)
                } catch (err) {
                    return Promise.reject(err)
                }
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                const refreshToken = tokenManager.getRefreshToken()
                if (!refreshToken) throw new Error('No refresh token available')

                const response = await api.post(API_PATHS.AUTH.REFRESH_TOKEN,
                    { refreshToken },
                    { skipAuth: true }
                )

                if (response?.accessToken && response?.refreshToken) {
                    tokenManager.setTokens(response.accessToken, response.refreshToken)
                    api.defaults.headers.common.Authorization =
                        `${TOKEN_CONSTANTS.TOKEN_PREFIX} ${response.accessToken}`

                    processQueue(null, response.accessToken)
                    originalRequest.headers.Authorization =
                        `${TOKEN_CONSTANTS.TOKEN_PREFIX} ${response.accessToken}`
                    return api(originalRequest)
                } else {
                    throw new Error('Invalid token refresh response')
                }
            } catch (refreshError) {
                processQueue(refreshError, null)
                await handleLogout()
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        // 處理請求重試
        if (shouldRetryRequest(error)) {
            return handleRequestRetry(error)
        }

        // 處理其他錯誤
        const errorInfo = await handleError(error)
        return Promise.reject(errorInfo)
    }
)
// API 服務
export const authApi = {
    login: (credentials) => api.post(API_PATHS.AUTH.LOGIN, credentials),
    register: (userData) => api.post(API_PATHS.AUTH.REGISTER, userData),
    logout: () => api.post(API_PATHS.AUTH.LOGOUT),
    refreshToken: (refreshToken) => api.post(API_PATHS.AUTH.REFRESH_TOKEN, { refreshToken }),
    verifyEmail: (token) => api.post(API_PATHS.AUTH.VERIFY_EMAIL, { token }),
    forgotPassword: (email) => api.post(API_PATHS.AUTH.FORGOT_PASSWORD, { email }),
    resetPassword: (token, password) => api.post(API_PATHS.AUTH.RESET_PASSWORD, { token, password }),
    checkEmailExists: (email) => api.post(API_PATHS.AUTH.CHECK_EMAIL, { email }),
    getProfile: () => api.get(API_PATHS.USERS.PROFILE),
    updateProfile: (data) => api.put(API_PATHS.USERS.PROFILE, data)
}

export const userApi = {
    getProfile: () => authApi.getProfile(),
    updateProfile: (data) => authApi.updateProfile(data),
    changePassword: (data) => api.put(API_PATHS.USERS.PASSWORD, data),
    uploadAvatar: (formData) => api.post(API_PATHS.USERS.AVATAR, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getAddresses: () => api.get(API_PATHS.USERS.ADDRESSES),
    addAddress: (address) => api.post(API_PATHS.USERS.ADDRESSES, address),
    updateAddress: (addressId, address) => api.put(`${API_PATHS.USERS.ADDRESSES}/${addressId}`, address),
    deleteAddress: (addressId) => api.delete(`${API_PATHS.USERS.ADDRESSES}/${addressId}`),
    getPreferences: () => api.get(API_PATHS.USERS.PREFERENCES),
    updatePreferences: (data) => api.put(API_PATHS.USERS.PREFERENCES, data)
}

export const productApi = {
    getList: (params) => api.get(API_PATHS.PRODUCTS.BASE, { params }),
    getById: (id) => api.get(`${API_PATHS.PRODUCTS.BASE}/${id}`),
    getCategories: () => api.get(API_PATHS.CATEGORIES),
    search: (params) => api.get(API_PATHS.PRODUCTS.SEARCH, { params }),
    getNewArrivals: () => api.get(API_PATHS.PRODUCTS.NEW_ARRIVALS),
    getRecommended: () => api.get(API_PATHS.PRODUCTS.RECOMMENDED),
    getReviews: (productId) => api.get(`${API_PATHS.PRODUCTS.BASE}/${productId}${API_PATHS.PRODUCTS.REVIEWS}`),
    addReview: (productId, data) => api.post(`${API_PATHS.PRODUCTS.BASE}/${productId}${API_PATHS.PRODUCTS.REVIEWS}`, data)
}

export const promotionApi = {
    getActivePromotions: () => api.get(API_PATHS.ADMIN.PROMOTIONS),
    getProductPromotions: () => api.get(API_PATHS.ADMIN.PRODUCT_PROMOTIONS),
    getPromotionDetails: (promotionId) => api.get(`${API_PATHS.ADMIN.PROMOTIONS}/${promotionId}`)
}

export const cartApi = {
    getItems: () => api.get(API_PATHS.CART.ITEMS),
    addItem: (data) => api.post(API_PATHS.CART.ITEMS, data),
    updateItem: (id, data) => api.put(`${API_PATHS.CART.ITEMS}/${id}`, data),
    removeItem: (id) => api.delete(`${API_PATHS.CART.ITEMS}/${id}`),
    clear: () => api.delete(API_PATHS.CART.BASE),
    applyCoupon: (code) => api.post(API_PATHS.CART.COUPON, { code }),
    removeCoupon: () => api.delete(API_PATHS.CART.COUPON),
    getShippingMethods: () => api.get(API_PATHS.CART.SHIPPING),
    setShippingMethod: (methodId) => api.put(API_PATHS.CART.SHIPPING, { methodId }),
    checkout: (data) => api.post(API_PATHS.CART.CHECKOUT, data)
}

export const orderApi = {
    create: (data) => api.post(API_PATHS.ORDERS.BASE, data),
    getList: (params) => api.get(API_PATHS.ORDERS.BASE, { params }),
    getById: (id) => api.get(`${API_PATHS.ORDERS.BASE}/${id}`),
    cancel: (id) => api.put(`${API_PATHS.ORDERS.BASE}/${id}/cancel`),
    pay: (id, data) => api.post(`${API_PATHS.ORDERS.BASE}/${id}${API_PATHS.ORDERS.PAYMENT}`, data),
    getPaymentMethods: () => api.get(`${API_PATHS.ORDERS.BASE}${API_PATHS.ORDERS.PAYMENT}`),
    confirmReceipt: (id) => api.put(`${API_PATHS.ORDERS.BASE}/${id}/confirm-receipt`),
    getShipmentTracking: (id) => api.get(`${API_PATHS.ORDERS.BASE}/${id}${API_PATHS.ORDERS.TRACKING}`)
}

export default api
