// src/utils/axios.js
import axios from 'axios'
import router from '@/router'
import store from '@/store'
import { handleError, ErrorTypes } from '@/utils/errorHandler'

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
        PAYMENT: '/orders/payment-methods',
        TRACKING: '/orders/tracking'
    },
    CATEGORIES: '/categories'
}

// 創建 axios 實例
const api = axios.create(API_CONFIG)

// 請求重試配置
const retryConfig = {
    retries: 2,
    retryDelay: 1000,
    retryCondition: (error) => {
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
        // 請求開始時顯示 loading
        if (!config.hideLoading) {
            store.dispatch('app/setLoading', true)
        }

        // Token 處理
        const token = localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }

        // GET 請求添加時間戳防止緩存
        if (config.method?.toLowerCase() === 'get' && !config.noCache) {
            config.params = {
                ...config.params,
                _t: Date.now()
            }
        }

        // 請求超時處理
        const timeout = config.timeout || API_CONFIG.timeout
        if (timeout) {
            config.timeout = timeout
        }

        // 添加請求ID
        config.requestId = generateRequestId()

        // 添加取消令牌
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
        // 請求結束時隱藏 loading
        if (!response.config.hideLoading) {
            store.dispatch('app/setLoading', false)
        }

        // 處理成功響應
        return handleSuccessResponse(response)
    },
    async error => {
        // 請求結束時隱藏 loading
        if (!error.config?.hideLoading) {
            store.dispatch('app/setLoading', false)
        }

        // 處理錯誤響應
        return handleErrorResponse(error)
    }
)

// 處理成功響應
const handleSuccessResponse = (response) => {
    const { data, config } = response

    // 如果配置了直接返回響應，則返回整個響應對象
    if (config.fullResponse) {
        return response
    }

    // 否則只返回數據部分
    return data
}

// 處理錯誤響應
const handleErrorResponse = async (error) => {
    const originalRequest = error.config

    // 處理請求取消
    if (axios.isCancel(error)) {
        return Promise.reject(new Error('請求已取消'))
    }

    // 處理 Token 過期
    if (error.response?.status === 401 && !originalRequest._retry) {
        return handleTokenExpiration(error)
    }

    // 處理請求重試
    if (shouldRetryRequest(error)) {
        return handleRequestRetry(error)
    }

    // 使用錯誤處理器處理錯誤
    const errorInfo = await handleError(error)

    return Promise.reject(errorInfo)
}

// 處理 Token 過期
const handleTokenExpiration = async (error) => {
    const originalRequest = error.config
    originalRequest._retry = true

    try {
        const refreshToken = localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY)
        if (!refreshToken) {
            throw new Error('無效的重新整理令牌')
        }

        const response = await api.post(API_PATHS.AUTH.REFRESH_TOKEN, { refreshToken })

        if (response.accessToken && response.refreshToken) {
            // 更新 token
            localStorage.setItem(import.meta.env.VITE_JWT_TOKEN_KEY, response.accessToken)
            localStorage.setItem(import.meta.env.VITE_JWT_REFRESH_KEY, response.refreshToken)

            // 更新原始請求的 token
            originalRequest.headers['Authorization'] = `Bearer ${response.accessToken}`

            // 重試原始請求
            return api(originalRequest)
        } else {
            throw new Error('重新整理令牌響應無效')
        }
    } catch (refreshError) {
        // 登出用戶並重定向到登入頁面
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

// 判斷是否應該重試請求
const shouldRetryRequest = (error) => {
    const { retries = 0 } = error.config
    return retries < retryConfig.retries && retryConfig.retryCondition(error)
}

// 處理請求重試
const handleRequestRetry = (error) => {
    const config = error.config
    config.retries = (config.retries || 0) + 1

    // 計算重試延遲時間
    const delayTime = config.retries * retryConfig.retryDelay

    return new Promise(resolve => {
        setTimeout(() => {
            resolve(api(config))
        }, delayTime)
    })
}

// 生成請求ID
const generateRequestId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// API 服務
export const apiService = {
    // 認證相關
    auth: {
        login: (credentials) => api.post(API_PATHS.AUTH.LOGIN, credentials),
        register: (userData) => api.post(API_PATHS.AUTH.REGISTER, userData),
        logout: () => api.post(API_PATHS.AUTH.LOGOUT),
        refreshToken: (refreshToken) => api.post(API_PATHS.AUTH.REFRESH_TOKEN, { refreshToken }),
        verifyEmail: (token) => api.post(API_PATHS.AUTH.VERIFY_EMAIL, { token }),
        forgotPassword: (email) => api.post(API_PATHS.AUTH.FORGOT_PASSWORD, { email }),
        resetPassword: (token, password) => api.post(API_PATHS.AUTH.RESET_PASSWORD, { token, password })
    },

    // 用戶相關
    user: {
        getProfile: () => api.get(API_PATHS.USERS.PROFILE),
        updateProfile: (data) => api.put(API_PATHS.USERS.PROFILE, data),
        changePassword: (data) => api.put(API_PATHS.USERS.PASSWORD, data),
        uploadAvatar: (formData) => api.post(API_PATHS.USERS.AVATAR, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
        getPreferences: () => api.get(API_PATHS.USERS.PREFERENCES),
        updatePreferences: (data) => api.put(API_PATHS.USERS.PREFERENCES, data),
        getAddresses: () => api.get(API_PATHS.USERS.ADDRESSES),
        addAddress: (data) => api.post(API_PATHS.USERS.ADDRESSES, data),
        updateAddress: (id, data) => api.put(`${API_PATHS.USERS.ADDRESSES}/${id}`, data),
        deleteAddress: (id) => api.delete(`${API_PATHS.USERS.ADDRESSES}/${id}`)
    },

    // 商品相關
    product: {
        getList: (params) => api.get(API_PATHS.PRODUCTS.BASE, { params }),
        getById: (id) => api.get(`${API_PATHS.PRODUCTS.BASE}/${id}`),
        search: (params) => api.get(API_PATHS.PRODUCTS.SEARCH, { params }),
        getNewArrivals: () => api.get(API_PATHS.PRODUCTS.NEW_ARRIVALS),
        getRecommended: () => api.get(API_PATHS.PRODUCTS.RECOMMENDED),
        getReviews: (productId) => api.get(`${API_PATHS.PRODUCTS.BASE}/${productId}/reviews`),
        addReview: (productId, data) => api.post(`${API_PATHS.PRODUCTS.BASE}/${productId}/reviews`, data),
        getCategories: () => api.get(API_PATHS.CATEGORIES)
    },

    // 購物車相關
    cart: {
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
    },

    // 訂單相關
    order: {
        create: (data) => api.post(API_PATHS.ORDERS.BASE, data),
        getList: (params) => api.get(API_PATHS.ORDERS.BASE, { params }),
        getById: (id) => api.get(`${API_PATHS.ORDERS.BASE}/${id}`),
        cancel: (id) => api.put(`${API_PATHS.ORDERS.BASE}/${id}/cancel`),
        pay: (id, data) => api.post(`${API_PATHS.ORDERS.BASE}/${id}/payment`, data),
        getPaymentMethods: () => api.get(API_PATHS.ORDERS.PAYMENT),
        confirmReceipt: (id) => api.put(`${API_PATHS.ORDERS.BASE}/${id}/confirm-receipt`),
        getShipmentTracking: (id) => api.get(`${API_PATHS.ORDERS.BASE}/${id}/tracking`)
    }
}

export default api
