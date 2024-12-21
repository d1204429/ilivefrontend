import axios from 'axios'
import router from '@/router'
import store from '@/store'
import { handleError } from '@/utils/errorHandler'

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

                const response = await api.post('/users/refresh-token', { refreshToken })
                if (!response.accessToken) {
                    throw new Error('Invalid refresh token response')
                }

                localStorage.setItem(import.meta.env.VITE_JWT_TOKEN_KEY, response.accessToken)
                localStorage.setItem(import.meta.env.VITE_JWT_REFRESH_KEY, response.refreshToken)

                originalRequest.headers['Authorization'] = `Bearer ${response.accessToken}`
                return api(originalRequest)
            } catch (refreshError) {
                await store.dispatch('auth/logout')
                router.push({
                    path: '/login',
                    query: { redirect: router.currentRoute.value.fullPath }
                })
                return Promise.reject(refreshError)
            }
        }

        handleError(error)
        return Promise.reject(error)
    }
)

// 認證相關 API
export const authApi = {
    login: (credentials) => api.post('/users/login', credentials),
    register: (userData) => api.post('/users/register', userData),
    logout: () => api.post('/users/logout'),
    refreshToken: (refreshToken) => api.post('/users/refresh-token', { refreshToken }),
    verifyEmail: (token) => api.post('/users/verify-email', { token }),
    forgotPassword: (email) => api.post('/users/forgot-password', { email }),
    resetPassword: (token, password) => api.post('/users/reset-password', { token, password }),
    checkEmailExists: (email) => api.post('/users/check-email', { email }),
    resendVerification: (email) => api.post('/users/resend-verification', { email })
}

// 用戶相關 API
export const userApi = {
    getProfile: (userId) => api.get(`/users/${userId}`),
    updateProfile: (userId, data) => api.put(`/users/${userId}`, data),
    changePassword: (userId, data) => api.put(`/users/${userId}/password`, data),
    uploadAvatar: (userId, formData) => api.post(`/users/${userId}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getOrders: (userId, params) => api.get(`/users/${userId}/orders`, { params }),
    getFavorites: (userId, params) => api.get(`/users/${userId}/favorites`, { params }),
    addFavorite: (userId, productId) => api.post(`/users/${userId}/favorites`, { productId }),
    removeFavorite: (userId, productId) => api.delete(`/users/${userId}/favorites/${productId}`),
    getAddresses: (userId) => api.get(`/users/${userId}/addresses`),
    addAddress: (userId, address) => api.post(`/users/${userId}/addresses`, address),
    updateAddress: (userId, addressId, address) => api.put(`/users/${userId}/addresses/${addressId}`, address),
    deleteAddress: (userId, addressId) => api.delete(`/users/${userId}/addresses/${addressId}`),
    getNotifications: (userId, params) => api.get(`/users/${userId}/notifications`, { params }),
    markNotificationRead: (userId, notificationId) => api.put(`/users/${userId}/notifications/${notificationId}/read`),
    updateNotificationPreferences: (userId, preferences) => api.put(`/users/${userId}/notification-preferences`, preferences)
}

// 商品相關 API
export const productApi = {
    getList: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    getCategories: () => api.get('/categories'),
    search: (params) => api.get('/products/search', { params }),
    getNewArrivals: (params) => api.get('/products/new-arrivals', { params }),
    getRecommended: (params) => api.get('/products/recommended', { params }),
    getReviews: (productId, params) => api.get(`/products/${productId}/reviews`, { params }),
    addReview: (productId, data) => api.post(`/products/${productId}/reviews`, data),
    updateReview: (productId, reviewId, data) => api.put(`/products/${productId}/reviews/${reviewId}`, data),
    deleteReview: (productId, reviewId) => api.delete(`/products/${productId}/reviews/${reviewId}`),
    getRelated: (productId, params) => api.get(`/products/${productId}/related`, { params }),
    reportReview: (productId, reviewId, reason) => api.post(`/products/${productId}/reviews/${reviewId}/report`, { reason })
}

// 購物車相關 API
export const cartApi = {
    getItems: () => api.get('/cart/items'),
    addItem: (data) => api.post('/cart/items', data),
    updateItem: (id, data) => api.put(`/cart/items/${id}`, data),
    removeItem: (id) => api.delete(`/cart/items/${id}`),
    clear: () => api.delete('/cart'),
    applyCoupon: (code) => api.post('/cart/coupon', { code }),
    removeCoupon: () => api.delete('/cart/coupon'),
    getShippingMethods: () => api.get('/cart/shipping-methods'),
    setShippingMethod: (methodId) => api.put('/cart/shipping-method', { methodId }),
    validateItems: () => api.post('/cart/validate'),
    saveForLater: (itemId) => api.post(`/cart/items/${itemId}/save-for-later`),
    moveToCart: (itemId) => api.post(`/cart/saved-items/${itemId}/move-to-cart`),
    getSavedItems: () => api.get('/cart/saved-items')
}

// 訂單相關 API
export const orderApi = {
    create: (data) => api.post('/orders', data),
    getList: (params) => api.get('/orders', { params }),
    getById: (id) => api.get(`/orders/${id}`),
    cancel: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
    pay: (id, data) => api.post(`/orders/${id}/payment`, data),
    getPaymentMethods: () => api.get('/orders/payment-methods'),
    confirmReceipt: (id) => api.put(`/orders/${id}/confirm-receipt`),
    getShipmentTracking: (id) => api.get(`/orders/${id}/tracking`),
    requestRefund: (id, data) => api.post(`/orders/${id}/refund`, data),
    getRefundStatus: (id) => api.get(`/orders/${id}/refund`),
    updateShippingAddress: (id, address) => api.put(`/orders/${id}/shipping-address`, address),
    getInvoice: (id) => api.get(`/orders/${id}/invoice`),
    resendOrderConfirmation: (id) => api.post(`/orders/${id}/resend-confirmation`),
    submitFeedback: (id, data) => api.post(`/orders/${id}/feedback`, data)
}

export default api
