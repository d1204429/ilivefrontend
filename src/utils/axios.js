import axios from 'axios'
import router from '@/router'
import store from '@/store'
import { handleError } from '@/utils/errorHandler'

// Token 相關常量
const TOKEN_CONSTANTS = {
    ACCESS_TOKEN_KEY: import.meta.env.VITE_JWT_TOKEN_KEY,
    REFRESH_TOKEN_KEY: import.meta.env.VITE_JWT_REFRESH_KEY,
    TOKEN_PREFIX: 'Bearer',
    TOKEN_EXPIRY_MARGIN: 5 * 60 * 1000, // 5分鐘提前更新
    REFRESH_INTERVAL: parseInt(import.meta.env.VITE_TOKEN_REFRESH_INTERVAL) || 15 * 60 * 1000,
    REFRESH_RETRY_DELAY: 1000, // 1秒重試延遲
    MAX_REFRESH_RETRIES: 3 // 最大重試次數
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
let refreshRetryCount = 0

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
        refreshRetryCount = 0
    },
    removeTokens: () => {
        localStorage.removeItem(TOKEN_CONSTANTS.ACCESS_TOKEN_KEY)
        localStorage.removeItem(TOKEN_CONSTANTS.REFRESH_TOKEN_KEY)
        delete api.defaults.headers.common.Authorization
        lastTokenRefresh = 0
        refreshRetryCount = 0
    },
    shouldRefreshToken: () => {
        const tokenAge = Date.now() - lastTokenRefresh
        return tokenAge >= (TOKEN_CONSTANTS.REFRESH_INTERVAL - TOKEN_CONSTANTS.TOKEN_EXPIRY_MARGIN)
    },
    canRetryRefresh: () => {
        return refreshRetryCount < TOKEN_CONSTANTS.MAX_REFRESH_RETRIES
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
const refreshToken = async (forceRefresh = false) => {
    try {
        if (!forceRefresh && !tokenManager.shouldRefreshToken()) {
            return { success: true, token: tokenManager.getAccessToken() }
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject })
            })
        }

        isRefreshing = true
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
            processQueue(null, response.data.accessToken)
            return { success: true, token: response.data.accessToken }
        }

        throw new Error('Invalid token refresh response')
    } catch (error) {
        processQueue(error, null)
        throw error
    } finally {
        isRefreshing = false
    }
}
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
                    if (err.response?.status === 401) {
                        await handleLogout()
                    }
                    return Promise.reject(err)
                }
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                const refreshToken = tokenManager.getRefreshToken()
                if (!refreshToken) {
                    throw new Error('No refresh token available')
                }

                const { data } = await api.post(API_PATHS.AUTH.REFRESH_TOKEN,
                    { refreshToken },
                    {
                        skipAuth: true,
                        _retry: true
                    }
                )

                if (data.accessToken && data.refreshToken) {
                    tokenManager.setTokens(data.accessToken, data.refreshToken)
                    api.defaults.headers.common.Authorization =
                        `${TOKEN_CONSTANTS.TOKEN_PREFIX} ${data.accessToken}`

                    processQueue(null, data.accessToken)
                    return api(originalRequest)
                }

                throw new Error('Invalid token refresh response')
            } catch (refreshError) {
                processQueue(refreshError, null)
                if (refreshError.response?.status === 401) {
                    await handleLogout()
                }
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
        if (tokenManager.getAccessToken()) {
            await api.post(API_PATHS.AUTH.LOGOUT, null, { skipAuth: true })
        }
    } catch (error) {
        console.error('Logout request failed:', error)
    } finally {
        tokenManager.removeTokens()
        await store.dispatch('auth/logout', null, { root: true })
    }
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
