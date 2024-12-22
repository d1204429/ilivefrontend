// src/utils/api.js
import axios from 'axios'
import router from '@/router'
import store from '@/store'
import { handleError } from '@/utils/errorHandler'

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
        REVIEWS: '/reviews'
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
    CATEGORIES: '/categories'
}

// 創建 axios 實例
const api = axios.create(API_CONFIG)

// 請求重試配置
const retryConfig = {
    retries: 2,
    retryDelay: 1000,
    shouldRetry: (error) => {
        return (
            axios.isCancel(error) ||
            error.code === 'ECONNABORTED' ||
            error.response?.status === 408 ||
            error.response?.status === 429 ||
            error.response?.status >= 500
        )
    }
}

// 請求攔截器
api.interceptors.request.use(
    async config => {
        if (!config.hideLoading) {
            store.dispatch('app/setLoading', true)
        }

        const token = localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }

        if (config.method?.toLowerCase() === 'get' && !config.noCache) {
            config.params = {
                ...config.params,
                _t: Date.now()
            }
        }

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

        if (axios.isCancel(error)) {
            return Promise.reject(new Error('請求已取消'))
        }

        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            return handleTokenRefresh(error)
        }

        if (retryConfig.shouldRetry(error) && (!originalRequest._retryCount || originalRequest._retryCount < retryConfig.retries)) {
            originalRequest._retryCount = (originalRequest._retryCount || 0) + 1
            return new Promise(resolve => {
                setTimeout(() => resolve(api(originalRequest)), retryConfig.retryDelay * originalRequest._retryCount)
            })
        }

        handleError(error)
        return Promise.reject(error)
    }
)

async function handleTokenRefresh(error) {
    const originalRequest = error.config
    originalRequest._retry = true

    try {
        const refreshToken = localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY)
        if (!refreshToken) {
            throw new Error('無效的重新整理令牌')
        }

        const response = await api.post(API_PATHS.AUTH.REFRESH_TOKEN, { refreshToken })
        if (!response?.accessToken) {
            throw new Error('重新整理令牌響應無效')
        }

        localStorage.setItem(import.meta.env.VITE_JWT_TOKEN_KEY, response.accessToken)
        localStorage.setItem(import.meta.env.VITE_JWT_REFRESH_KEY, response.refreshToken)

        originalRequest.headers['Authorization'] = `Bearer ${response.accessToken}`
        return api(originalRequest)
    } catch (refreshError) {
        localStorage.removeItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        localStorage.removeItem(import.meta.env.VITE_JWT_REFRESH_KEY)
        await store.dispatch('auth/logout')
        router.push({
            path: '/login',
            query: {
                redirect: router.currentRoute.value.fullPath,
                error: 'session_expired'
            }
        })
        return Promise.reject(refreshError)
    }
}

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
