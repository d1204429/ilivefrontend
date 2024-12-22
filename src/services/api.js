import axios from 'axios'
import router from '@/router'
import store from '@/store'
import { handleError } from '@/utils/errorHandler'

// Token 配置
const TOKEN_CONFIG = {
    ACCESS_TOKEN_KEY: import.meta.env.VITE_JWT_TOKEN_KEY || 'access_token',
    REFRESH_TOKEN_KEY: import.meta.env.VITE_JWT_REFRESH_KEY || 'refresh_token',
    TOKEN_PREFIX: 'Bearer',
    REFRESH_INTERVAL: parseInt(import.meta.env.VITE_TOKEN_REFRESH_INTERVAL) || 900000,
    TOKEN_EXPIRED_CODE: 'TOKEN_EXPIRED'
}

// API 配置
const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:1988/api/v1',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
    withCredentials: true,
    validateStatus: status => status >= 200 && status < 300,
    retryTimes: parseInt(import.meta.env.VITE_API_RETRY_TIMES) || 3,
    retryDelay: parseInt(import.meta.env.VITE_API_RETRY_DELAY) || 1000
}

// API 路徑
export const API_PATHS = {
    AUTH: {
        BASE: '/auth',
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        REFRESH_TOKEN: '/auth/refresh-token',
        VERIFY_EMAIL: '/auth/verify-email',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
        CHECK_EMAIL: '/auth/check-email'
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
        CATEGORIES: '/products/categories',
        NEW_ARRIVALS: '/products/new-arrivals',
        RECOMMENDED: '/products/recommended',
        REVIEWS: '/products/reviews'
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
        PAYMENT: '/orders/payment',
        TRACKING: '/orders/tracking'
    }
}

// 創建 axios 實例
const api = axios.create(API_CONFIG)

// 請求隊列管理
const requestManager = {
    isRefreshing: false,
    refreshSubscribers: [],
    pendingRequests: new Map(),

    addPendingRequest(config) {
        const requestId = this.generateRequestId(config)
        const source = axios.CancelToken.source()
        this.pendingRequests.set(requestId, source)
        return source
    },

    removePendingRequest(config) {
        const requestId = this.generateRequestId(config)
        this.pendingRequests.delete(requestId)
    },

    generateRequestId(config) {
        return `${config.method}-${config.url}-${JSON.stringify(config.params || {})}-${JSON.stringify(config.data || {})}`
    },

    cancelPendingRequests() {
        this.pendingRequests.forEach(source => {
            source.cancel('Request cancelled due to new request')
        })
        this.pendingRequests.clear()
    }
}

// Token 管理
const tokenManager = {
    getAccessToken() {
        return localStorage.getItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY)
    },

    getRefreshToken() {
        return localStorage.getItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY)
    },

    setTokens(accessToken, refreshToken) {
        if (accessToken) {
            localStorage.setItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY, accessToken)
            api.defaults.headers.common.Authorization = `${TOKEN_CONFIG.TOKEN_PREFIX} ${accessToken}`
        }
        if (refreshToken) {
            localStorage.setItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY, refreshToken)
        }
    },

    removeTokens() {
        localStorage.removeItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY)
        localStorage.removeItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY)
        delete api.defaults.headers.common.Authorization
    },

    isTokenValid(token) {
        if (!token) return false
        try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            return payload.exp * 1000 > Date.now()
        } catch {
            return false
        }
    }
}
// 請求攔截器
api.interceptors.request.use(
    async config => {
        // 檢查是否有相同請求正在進行
        const source = requestManager.addPendingRequest(config)
        config.cancelToken = source.token

        // 設置 loading 狀態
        if (!config.hideLoading) {
            store.dispatch('app/setLoading', true)
        }

        // 添加認證 token
        const token = tokenManager.getAccessToken()
        if (token && !config.skipAuth) {
            if (!tokenManager.isTokenValid(token)) {
                await store.dispatch('auth/refreshToken')
                    .catch(() => store.dispatch('auth/logout'))
            }
            config.headers.Authorization = `${TOKEN_CONFIG.TOKEN_PREFIX} ${tokenManager.getAccessToken()}`
        }

        // GET 請求添加時間戳防止緩存
        if (config.method?.toLowerCase() === 'get' && !config.noCache) {
            config.params = {
                ...config.params,
                _t: Date.now()
            }
        }

        // 請求元數據
        config.metadata = {
            startTime: Date.now(),
            retryCount: 0
        }

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
        requestManager.removePendingRequest(response.config)

        if (!response.config.hideLoading) {
            store.dispatch('app/setLoading', false)
        }

        return response.data
    },
    async error => {
        if (axios.isCancel(error)) {
            return Promise.reject(error)
        }

        requestManager.removePendingRequest(error.config)

        if (!error.config?.hideLoading) {
            store.dispatch('app/setLoading', false)
        }

        const originalRequest = error.config

        // 處理 401 錯誤和 token 刷新
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (requestManager.isRefreshing) {
                try {
                    const token = await new Promise((resolve, reject) => {
                        requestManager.refreshSubscribers.push({ resolve, reject })
                    })
                    originalRequest.headers.Authorization = `${TOKEN_CONFIG.TOKEN_PREFIX} ${token}`
                    return api(originalRequest)
                } catch (err) {
                    return Promise.reject(err)
                }
            }

            originalRequest._retry = true
            requestManager.isRefreshing = true

            try {
                const refreshToken = tokenManager.getRefreshToken()
                if (!refreshToken) {
                    throw new Error('無效的刷新令牌')
                }

                const response = await api.post(API_PATHS.AUTH.REFRESH_TOKEN,
                    { refreshToken },
                    { skipAuth: true }
                )

                if (response?.accessToken && response?.refreshToken) {
                    tokenManager.setTokens(response.accessToken, response.refreshToken)
                    requestManager.refreshSubscribers.forEach(callback => callback.resolve(response.accessToken))
                    originalRequest.headers.Authorization = `${TOKEN_CONFIG.TOKEN_PREFIX} ${response.accessToken}`
                    return api(originalRequest)
                } else {
                    throw new Error('Token 更新失敗')
                }
            } catch (refreshError) {
                requestManager.refreshSubscribers.forEach(callback => callback.reject(refreshError))
                await handleAuthError()
                return Promise.reject(refreshError)
            } finally {
                requestManager.refreshSubscribers = []
                requestManager.isRefreshing = false
            }
        }

        // 請求重試
        if (originalRequest?.metadata?.retryCount < API_CONFIG.retryTimes &&
            error.response?.status >= 500) {
            originalRequest.metadata.retryCount++
            await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay))
            return api(originalRequest)
        }

        return Promise.reject(handleError(error))
    }
)

// API 服務
export const authApi = {
    login: credentials => api.post(API_PATHS.AUTH.LOGIN, credentials),
    register: userData => api.post(API_PATHS.AUTH.REGISTER, userData),
    logout: () => api.post(API_PATHS.AUTH.LOGOUT),
    refreshToken: refreshToken => api.post(API_PATHS.AUTH.REFRESH_TOKEN, { refreshToken }),
    verifyEmail: token => api.post(API_PATHS.AUTH.VERIFY_EMAIL, { token }),
    forgotPassword: email => api.post(API_PATHS.AUTH.FORGOT_PASSWORD, { email }),
    resetPassword: (token, password) => api.post(API_PATHS.AUTH.RESET_PASSWORD, { token, password }),
    checkEmailExists: email => api.post(API_PATHS.AUTH.CHECK_EMAIL, { email }),
    getProfile: () => api.get(API_PATHS.USERS.PROFILE),
    updateProfile: data => api.put(API_PATHS.USERS.PROFILE, data)
}

export const userApi = {
    getProfile: () => authApi.getProfile(),
    updateProfile: data => authApi.updateProfile(data),
    changePassword: data => api.put(API_PATHS.USERS.PASSWORD, data),
    uploadAvatar: formData => api.post(API_PATHS.USERS.AVATAR, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getAddresses: () => api.get(API_PATHS.USERS.ADDRESSES),
    addAddress: address => api.post(API_PATHS.USERS.ADDRESSES, address),
    updateAddress: (id, data) => api.put(`${API_PATHS.USERS.ADDRESSES}/${id}`, data),
    deleteAddress: id => api.delete(`${API_PATHS.USERS.ADDRESSES}/${id}`),
    getPreferences: () => api.get(API_PATHS.USERS.PREFERENCES),
    updatePreferences: data => api.put(API_PATHS.USERS.PREFERENCES, data)
}

export const productApi = {
    getList: params => api.get(API_PATHS.PRODUCTS.BASE, { params }),
    getById: id => api.get(`${API_PATHS.PRODUCTS.BASE}/${id}`),
    search: params => api.get(API_PATHS.PRODUCTS.SEARCH, { params }),
    getCategories: () => api.get(API_PATHS.PRODUCTS.CATEGORIES),
    getNewArrivals: () => api.get(API_PATHS.PRODUCTS.NEW_ARRIVALS),
    getRecommended: () => api.get(API_PATHS.PRODUCTS.RECOMMENDED),
    getReviews: productId => api.get(`${API_PATHS.PRODUCTS.BASE}/${productId}/reviews`),
    addReview: (productId, data) => api.post(`${API_PATHS.PRODUCTS.BASE}/${productId}/reviews`, data)
}

export const cartApi = {
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
}

export const orderApi = {
    create: data => api.post(API_PATHS.ORDERS.BASE, data),
    getList: params => api.get(API_PATHS.ORDERS.BASE, { params }),
    getById: id => api.get(`${API_PATHS.ORDERS.BASE}/${id}`),
    cancel: id => api.put(`${API_PATHS.ORDERS.BASE}/${id}/cancel`),
    pay: (id, data) => api.post(`${API_PATHS.ORDERS.BASE}/${id}/payment`, data),
    getPaymentMethods: () => api.get(`${API_PATHS.ORDERS.BASE}/payment-methods`),
    confirmReceipt: id => api.put(`${API_PATHS.ORDERS.BASE}/${id}/confirm-receipt`),
    getShipmentTracking: id => api.get(`${API_PATHS.ORDERS.BASE}/${id}/tracking`)
}

export default api
