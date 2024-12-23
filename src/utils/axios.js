import axios from 'axios'
import router from '@/router'
import store from '@/store'
import { handleError } from '@/utils/errorHandler'

// Token 相關常量
const TOKEN_CONSTANTS = {
    ACCESS_TOKEN_KEY: import.meta.env.VITE_JWT_TOKEN_KEY,
    REFRESH_TOKEN_KEY: import.meta.env.VITE_JWT_REFRESH_KEY,
    TOKEN_PREFIX: 'Bearer',
    TOKEN_EXPIRY_MARGIN: 60000, // 1分鐘提前更新
    REFRESH_INTERVAL: parseInt(import.meta.env.VITE_TOKEN_REFRESH_INTERVAL) || 840000
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
        LOGIN: '/users/login',
        REGISTER: '/users/register',
        LOGOUT: '/users/logout',
        REFRESH_TOKEN: '/users/refresh-token',
        VERIFY_EMAIL: '/users/verify-email',
        FORGOT_PASSWORD: '/users/forgot-password',
        RESET_PASSWORD: '/users/reset-password'
    },
    USERS: {
        PROFILE: '/users/profile',
        PASSWORD: '/users/password',
        AVATAR: '/users/avatar',
        PREFERENCES: '/users/preferences',
        ADDRESSES: '/users/addresses'
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
        PAYMENT: '/orders/payment-methods',
        TRACKING: '/orders/tracking'
    },
    CATEGORIES: '/categories'
}

// 創建 axios 實例
const api = axios.create(API_CONFIG)

// 請求隊列和刷新標記
let isRefreshing = false
let failedQueue = []
let lastTokenRefresh = Date.now()

// 請求重試配置
const retryConfig = {
    retries: 3,
    retryDelay: 1000,
    retryCondition: (error) => {
        return (
            error.code === 'ECONNABORTED' ||
            error.response?.status === 408 ||
            error.response?.status === 429 ||
            error.response?.status >= 500
        )
    }
}

// Token 管理
const tokenManager = {
    getAccessToken: () => localStorage.getItem(TOKEN_CONSTANTS.ACCESS_TOKEN_KEY),
    getRefreshToken: () => localStorage.getItem(TOKEN_CONSTANTS.REFRESH_TOKEN_KEY),
    setTokens: (accessToken, refreshToken) => {
        if (accessToken) {
            localStorage.setItem(TOKEN_CONSTANTS.ACCESS_TOKEN_KEY, accessToken)
            api.defaults.headers.common.Authorization = `${TOKEN_CONSTANTS.TOKEN_PREFIX} ${accessToken}`
        }
        if (refreshToken) {
            localStorage.setItem(TOKEN_CONSTANTS.REFRESH_TOKEN_KEY, refreshToken)
        }
        lastTokenRefresh = Date.now()
    },
    removeTokens: () => {
        localStorage.removeItem(TOKEN_CONSTANTS.ACCESS_TOKEN_KEY)
        localStorage.removeItem(TOKEN_CONSTANTS.REFRESH_TOKEN_KEY)
        delete api.defaults.headers.common.Authorization
        lastTokenRefresh = 0
    },
    shouldRefreshToken: () => {
        return Date.now() - lastTokenRefresh >= TOKEN_CONSTANTS.REFRESH_INTERVAL
    },
    isTokenValid: () => {
        const token = localStorage.getItem(TOKEN_CONSTANTS.ACCESS_TOKEN_KEY)
        return !!token && !tokenManager.shouldRefreshToken()
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

// 刷新 Token
const refreshToken = async () => {
    try {
        const refreshToken = tokenManager.getRefreshToken()
        if (!refreshToken) {
            throw new Error('No refresh token available')
        }

        const response = await api.post(API_PATHS.AUTH.REFRESH_TOKEN,
            { refreshToken },
            { skipAuth: true }
        )

        if (response?.data?.accessToken) {
            tokenManager.setTokens(response.data.accessToken, response.data.refreshToken)
            return response.data.accessToken
        }
        throw new Error('Invalid token refresh response')
    } catch (error) {
        throw error
    }
}

// 請求攔截器
api.interceptors.request.use(
    async config => {
        if (!config.hideLoading) {
            store.dispatch('app/setLoading', true)
        }

        if (!config.skipAuth && !config.url?.includes(API_PATHS.AUTH.REFRESH_TOKEN)) {
            const token = tokenManager.getAccessToken()
            if (token) {
                if (tokenManager.shouldRefreshToken()) {
                    try {
                        const newToken = await refreshToken()
                        config.headers.Authorization = `${TOKEN_CONSTANTS.TOKEN_PREFIX} ${newToken}`
                    } catch (error) {
                        console.error('Token refresh failed:', error)
                        await handleLogout()
                        return Promise.reject(error)
                    }
                } else {
                    config.headers.Authorization = `${TOKEN_CONSTANTS.TOKEN_PREFIX} ${token}`
                }
            }
        }

        if (config.method?.toLowerCase() === 'get' && !config.noCache) {
            config.params = { ...config.params, _t: Date.now() }
        }

        config.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        config.metadata = { startTime: Date.now() }

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

        // 處理 401 錯誤
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
                const newToken = await refreshToken()
                processQueue(null, newToken)
                originalRequest.headers.Authorization = `${TOKEN_CONSTANTS.TOKEN_PREFIX} ${newToken}`
                return api(originalRequest)
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

        return Promise.reject(error)
    }
)

// 處理登出
const handleLogout = async () => {
    try {
        const token = tokenManager.getAccessToken()
        if (token) {
            try {
                await api.post(API_PATHS.AUTH.LOGOUT, null, { skipAuth: true })
            } catch (error) {
                console.error('Logout request failed:', error)
            }
        }
    } finally {
        tokenManager.removeTokens()
        await store.dispatch('auth/logout', null, { root: true })
    }
}

// 判斷是否應該重試請求
const shouldRetryRequest = (error) => {
    const { retries = 0 } = error.config
    return retries < retryConfig.retries &&
        retryConfig.retryCondition(error) &&
        !error.config._retry
}

// 處理請求重試
const handleRequestRetry = (error) => {
    const config = error.config
    config.retries = (config.retries || 0) + 1
    const delayTime = config.retries * retryConfig.retryDelay

    return new Promise(resolve => {
        setTimeout(() => resolve(api(config)), delayTime)
    })
}

// API 服務
const apiService = {
    auth: {
        login: credentials => api.post(API_PATHS.AUTH.LOGIN, credentials),
        register: userData => api.post(API_PATHS.AUTH.REGISTER, userData),
        logout: () => api.post(API_PATHS.AUTH.LOGOUT),
        refreshToken: refreshToken => api.post(API_PATHS.AUTH.REFRESH_TOKEN, { refreshToken }),
        verifyEmail: token => api.post(API_PATHS.AUTH.VERIFY_EMAIL, { token }),
        forgotPassword: email => api.post(API_PATHS.AUTH.FORGOT_PASSWORD, { email }),
        resetPassword: (token, password) => api.post(API_PATHS.AUTH.RESET_PASSWORD, { token, password })
    },
    user: {
        getProfile: () => api.get(API_PATHS.USERS.PROFILE),
        updateProfile: data => api.put(API_PATHS.USERS.PROFILE, data),
        changePassword: data => api.put(API_PATHS.USERS.PASSWORD, data),
        uploadAvatar: formData => api.post(API_PATHS.USERS.AVATAR, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
        getPreferences: () => api.get(API_PATHS.USERS.PREFERENCES),
        updatePreferences: data => api.put(API_PATHS.USERS.PREFERENCES, data),
        getAddresses: () => api.get(API_PATHS.USERS.ADDRESSES),
        addAddress: data => api.post(API_PATHS.USERS.ADDRESSES, data),
        updateAddress: (id, data) => api.put(`${API_PATHS.USERS.ADDRESSES}/${id}`, data),
        deleteAddress: id => api.delete(`${API_PATHS.USERS.ADDRESSES}/${id}`)
    },
    product: {
        getList: params => api.get(API_PATHS.PRODUCTS.BASE, { params }),
        getById: id => api.get(`${API_PATHS.PRODUCTS.BASE}/${id}`),
        search: params => api.get(API_PATHS.PRODUCTS.SEARCH, { params }),
        getNewArrivals: () => api.get(API_PATHS.PRODUCTS.NEW_ARRIVALS),
        getRecommended: () => api.get(API_PATHS.PRODUCTS.RECOMMENDED),
        getReviews: productId => api.get(`${API_PATHS.PRODUCTS.BASE}/${productId}/reviews`),
        addReview: (productId, data) => api.post(`${API_PATHS.PRODUCTS.BASE}/${productId}/reviews`, data),
        getCategories: () => api.get(API_PATHS.CATEGORIES)
    },
    cart: {
        getItems: () => api.get(API_PATHS.CART.ITEMS),
        addItem: data => api.post(API_PATHS.CART.ITEMS, data),
        updateItem: (id, data) => api.put(`${API_PATHS.CART.ITEMS}/${id}`, data),
        removeItem: id => api.delete(`${API_PATHS.CART.ITEMS}/${id}`),
        clear: () => api.delete(API_PATHS.CART.BASE),
        applyCoupon: code => api.post(API_PATHS.CART.COUPON, { code }),
        removeCoupon: () => api.delete(API_PATHS.CART.COUPON),
        getShippingMethods: () => api.get(API_PATHS.CART.SHIPPING),
        setShippingMethod: methodId => api.put(API_PATHS.CART.SHIPPING, { methodId }),
        checkout: data => api.post(API_PATHS.CART.CHECKOUT, data)
    },
    order: {
        create: data => api.post(API_PATHS.ORDERS.BASE, data),
        getList: params => api.get(API_PATHS.ORDERS.BASE, { params }),
        getById: id => api.get(`${API_PATHS.ORDERS.BASE}/${id}`),
        cancel: id => api.put(`${API_PATHS.ORDERS.BASE}/${id}/cancel`),
        pay: (id, data) => api.post(`${API_PATHS.ORDERS.BASE}/${id}/payment`, data),
        getPaymentMethods: () => api.get(API_PATHS.ORDERS.PAYMENT),
        confirmReceipt: id => api.put(`${API_PATHS.ORDERS.BASE}/${id}/confirm-receipt`),
        getShipmentTracking: id => api.get(`${API_PATHS.ORDERS.BASE}/${id}/tracking`)
    }
}

export { api as default, apiService }
