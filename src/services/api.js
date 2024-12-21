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
        const token = localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }

        if (config.method?.toLowerCase() === 'get') {
            config.params = {
                ...config.params,
                _t: Date.now()
            }
        }

        return config
    },
    error => Promise.reject(error)
)

// 響應攔截器
api.interceptors.response.use(
    response => response.data,
    async error => {
        const originalRequest = error.config

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
    checkEmailExists: (email) => api.post('/users/check-email', { email })
}

// 用戶相關 API
export const userApi = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    changePassword: (data) => api.put('/users/password', data),
    uploadAvatar: (formData) => api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getAddresses: () => api.get('/users/addresses'),
    addAddress: (address) => api.post('/users/addresses', address),
    updateAddress: (addressId, address) => api.put(`/users/addresses/${addressId}`, address),
    deleteAddress: (addressId) => api.delete(`/users/addresses/${addressId}`)
}

// 商品相關 API
export const productApi = {
    getList: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    getCategories: () => api.get('/categories'),
    search: (params) => api.get('/products/search', { params }),
    getNewArrivals: () => api.get('/products/new-arrivals'),
    getRecommended: () => api.get('/products/recommended'),
    getReviews: (productId) => api.get(`/products/${productId}/reviews`)
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
    setShippingMethod: (methodId) => api.put('/cart/shipping-method', { methodId })
}

// 訂單相關 API
export const orderApi = {
    create: (data) => api.post('/orders', data),
    getList: (params) => api.get('/orders', { params }),
    getById: (id) => api.get(`/orders/${id}`),
    cancel: (id) => api.put(`/orders/${id}/cancel`),
    pay: (id, data) => api.post(`/orders/${id}/payment`, data),
    getPaymentMethods: () => api.get('/orders/payment-methods'),
    confirmReceipt: (id) => api.put(`/orders/${id}/confirm-receipt`)
}

export default api
