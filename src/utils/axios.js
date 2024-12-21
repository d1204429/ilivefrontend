import axios from 'axios'
import router from '@/router'
import store from '@/store'

// API 配置常量
const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:1988/api/v1',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
}

// 創建 axios 實例
const api = axios.create(API_CONFIG)

// 請求攔截器
api.interceptors.request.use(
    config => {
        // 添加 token
        const token = localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }

        // GET 請求添加時間戳防止緩存
        if (config.method?.toLowerCase() === 'get') {
            config.params = {
                ...config.params,
                _t: Date.now()
            }
        }

        // 開發環境日誌
        if (import.meta.env.DEV) {
            console.log('API Request:', {
                url: config.url,
                method: config.method,
                data: config.data,
                params: config.params
            })
        }

        return config
    },
    error => {
        console.error('Request Error:', error)
        return Promise.reject(error)
    }
)

// 響應攔截器
api.interceptors.response.use(
    response => {
        // 開發環境日誌
        if (import.meta.env.DEV) {
            console.log('API Response:', response.data)
        }
        return response.data
    },
    async error => {
        const originalRequest = error.config

        // 處理 401 錯誤和 token 刷新
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const refreshToken = localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY)
                if (!refreshToken) {
                    throw new Error('No refresh token')
                }

                const response = await api.post('/api/v1/users/refresh-token', { refreshToken })
                if (!response.accessToken) {
                    throw new Error('Invalid refresh token response')
                }

                // 更新 token
                localStorage.setItem(import.meta.env.VITE_JWT_TOKEN_KEY, response.accessToken)
                localStorage.setItem(import.meta.env.VITE_JWT_REFRESH_KEY, response.refreshToken)

                // 重試原始請求
                originalRequest.headers['Authorization'] = `Bearer ${response.accessToken}`
                return api(originalRequest)
            } catch (refreshError) {
                // 刷新 token 失敗，登出用戶
                await store.dispatch('auth/logout')
                router.push({
                    path: '/login',
                    query: { redirect: router.currentRoute.value.fullPath }
                })
                return Promise.reject(refreshError)
            }
        }

        handleApiError(error)
        return Promise.reject(error)
    }
)

// API 錯誤處理
const handleApiError = (error) => {
    let errorMessage = '發生未知錯誤'
    let errorType = 'error'
    let errorCode = null

    if (error.response) {
        const { status, data } = error.response
        errorCode = status

        switch (status) {
            case 400:
                errorMessage = data.message || '請求參數錯誤'
                errorType = 'warning'
                break
            case 401:
                errorMessage = '身份驗證已過期，請重新登入'
                errorType = 'warning'
                break
            case 403:
                errorMessage = '無權限訪問此資源'
                errorType = 'error'
                break
            case 404:
                errorMessage = '請求的資源不存在'
                errorType = 'error'
                break
            case 429:
                errorMessage = '請求過於頻繁，請稍後再試'
                errorType = 'warning'
                break
            case 500:
                errorMessage = '伺服器錯誤，請稍後再試'
                errorType = 'error'
                break
            default:
                errorMessage = data.message || `錯誤代碼：${status}`
                errorType = 'error'
        }
    } else if (error.request) {
        errorMessage = '網路連接失敗，請檢查網路設定'
        errorType = 'warning'
        errorCode = 'NETWORK_ERROR'
    } else {
        errorCode = 'UNKNOWN_ERROR'
    }

    store.dispatch('app/setError', {
        message: errorMessage,
        type: errorType,
        code: errorCode,
        duration: 3000
    })

    if (import.meta.env.DEV) {
        console.error('API Error:', {
            message: errorMessage,
            type: errorType,
            code: errorCode,
            error
        })
    }
}

// 用戶認證相關 API
export const authApi = {
    login: (data) => api.post('/api/v1/users/login', data),
    register: (data) => api.post('/api/v1/users/register', data),
    logout: () => api.post('/api/v1/users/logout'),
    refreshToken: (refreshToken) => api.post('/api/v1/users/refresh-token', { refreshToken }),
    verifyEmail: (token) => api.post('/api/v1/users/verify-email', { token }),
    forgotPassword: (email) => api.post('/api/v1/users/forgot-password', { email }),
    resetPassword: (token, password) => api.post('/api/v1/users/reset-password', { token, password })
}

// 用戶相關 API
export const userApi = {
    getProfile: (userId) => api.get(`/api/v1/users/${userId}`),
    updateProfile: (userId, data) => api.put(`/api/v1/users/${userId}`, data),
    changePassword: (userId, data) => api.put(`/api/v1/users/${userId}/password`, data),
    uploadAvatar: (userId, formData) => api.post(`/api/v1/users/${userId}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getAddresses: (userId) => api.get(`/api/v1/users/${userId}/addresses`),
    addAddress: (userId, data) => api.post(`/api/v1/users/${userId}/addresses`, data),
    updateAddress: (userId, addressId, data) => api.put(`/api/v1/users/${userId}/addresses/${addressId}`, data),
    deleteAddress: (userId, addressId) => api.delete(`/api/v1/users/${userId}/addresses/${addressId}`)
}

// 商品相關 API
export const productApi = {
    getList: (params) => api.get('/api/v1/products', { params }),
    getById: (id) => api.get(`/api/v1/products/${id}`),
    getCategories: () => api.get('/api/v1/categories'),
    search: (params) => api.get('/api/v1/products/search', { params }),
    getNewArrivals: () => api.get('/api/v1/products/new-arrivals'),
    getRecommended: () => api.get('/api/v1/products/recommended'),
    getReviews: (productId, params) => api.get(`/api/v1/products/${productId}/reviews`, { params }),
    addReview: (productId, data) => api.post(`/api/v1/products/${productId}/reviews`, data),
    getFavorites: () => api.get('/api/v1/products/favorites'),
    addToFavorites: (productId) => api.post(`/api/v1/products/favorites/${productId}`),
    removeFromFavorites: (productId) => api.delete(`/api/v1/products/favorites/${productId}`)
}

// 購物車相關 API
export const cartApi = {
    getItems: () => api.get('/api/v1/cart/items'),
    addItem: (data) => api.post('/api/v1/cart/items', data),
    updateItem: (id, data) => api.put(`/api/v1/cart/items/${id}`, data),
    removeItem: (id) => api.delete(`/api/v1/cart/items/${id}`),
    clear: () => api.delete('/api/v1/cart'),
    applyCoupon: (code) => api.post('/api/v1/cart/coupon', { code }),
    removeCoupon: () => api.delete('/api/v1/cart/coupon'),
    getShippingMethods: () => api.get('/api/v1/cart/shipping-methods'),
    setShippingMethod: (methodId) => api.put('/api/v1/cart/shipping-method', { methodId }),
    checkout: (data) => api.post('/api/v1/cart/checkout', data)
}

// 訂單相關 API
export const orderApi = {
    create: (data) => api.post('/api/v1/orders', data),
    getList: (params) => api.get('/api/v1/orders', { params }),
    getById: (id) => api.get(`/api/v1/orders/${id}`),
    cancel: (id, reason) => api.put(`/api/v1/orders/${id}/cancel`, { reason }),
    pay: (id, data) => api.post(`/api/v1/orders/${id}/payment`, data),
    getPaymentMethods: () => api.get('/api/v1/orders/payment-methods'),
    confirmReceipt: (id) => api.put(`/api/v1/orders/${id}/confirm-receipt`),
    getShipmentTracking: (id) => api.get(`/api/v1/orders/${id}/tracking`),
    requestRefund: (id, data) => api.post(`/api/v1/orders/${id}/refund`, data),
    getRefundStatus: (id) => api.get(`/api/v1/orders/${id}/refund`)
}

export default api
