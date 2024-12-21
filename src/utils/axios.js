import axios from 'axios'
import router from '@/router'
import store from '@/store'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:1988/api/v1',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
})

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

                const response = await api.post('/api/v1/users/refresh-token', { refreshToken })
                if (!response.accessToken) {
                    throw new Error('Invalid refresh token response')
                }

                localStorage.setItem(import.meta.env.VITE_JWT_TOKEN_KEY, response.accessToken)
                localStorage.setItem(import.meta.env.VITE_JWT_REFRESH_KEY, response.refreshToken)

                originalRequest.headers['Authorization'] = `Bearer ${response.accessToken}`
                return api(originalRequest)
            } catch (refreshError) {
                store.dispatch('auth/logout')
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

const handleApiError = (error) => {
    let errorMessage = '發生未知錯誤'
    let errorType = 'error'

    if (error.response) {
        const { status, data } = error.response

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
    }

    store.dispatch('app/setError', {
        message: errorMessage,
        type: errorType,
        duration: 3000
    })
}

export const authApi = {
    login: (data) => api.post('/api/v1/users/login', data),
    register: (data) => api.post('/api/v1/users/register', data),
    logout: () => api.post('/api/v1/users/logout'),
    refreshToken: (refreshToken) => api.post('/api/v1/users/refresh-token', { refreshToken }),
    verifyEmail: (token) => api.post('/api/v1/users/verify-email', { token })
}

export const userApi = {
    getProfile: (userId) => api.get(`/api/v1/users/${userId}`),
    updateProfile: (userId, data) => api.put(`/api/v1/users/${userId}`, data),
    changePassword: (userId, data) => api.put(`/api/v1/users/${userId}/password`, data),
    uploadAvatar: (userId, formData) => api.post(`/api/v1/users/${userId}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
}

export const productApi = {
    getList: (params) => api.get('/api/v1/products', { params }),
    getById: (id) => api.get(`/api/v1/products/${id}`),
    getCategories: () => api.get('/api/v1/categories'),
    search: (params) => api.get('/api/v1/products/search', { params }),
    getNewArrivals: () => api.get('/api/v1/products/new-arrivals'),
    getRecommended: () => api.get('/api/v1/products/recommended'),
    getReviews: (productId) => api.get(`/api/v1/products/${productId}/reviews`)
}

export const cartApi = {
    getItems: () => api.get('/api/v1/cart/items'),
    addItem: (data) => api.post('/api/v1/cart/items', data),
    updateItem: (id, data) => api.put(`/api/v1/cart/items/${id}`, data),
    removeItem: (id) => api.delete(`/api/v1/cart/items/${id}`),
    clear: () => api.delete('/api/v1/cart'),
    applyCoupon: (code) => api.post('/api/v1/cart/coupon', { code }),
    removeCoupon: () => api.delete('/api/v1/cart/coupon'),
    getShippingMethods: () => api.get('/api/v1/cart/shipping-methods'),
    setShippingMethod: (methodId) => api.put('/api/v1/cart/shipping-method', { methodId })
}

export const orderApi = {
    create: (data) => api.post('/api/v1/orders', data),
    getList: (params) => api.get('/api/v1/orders', { params }),
    getById: (id) => api.get(`/api/v1/orders/${id}`),
    cancel: (id) => api.put(`/api/v1/orders/${id}/cancel`),
    pay: (id, data) => api.post(`/api/v1/orders/${id}/payment`, data),
    getPaymentMethods: () => api.get('/api/v1/orders/payment-methods'),
    confirmReceipt: (id) => api.put(`/api/v1/orders/${id}/confirm-receipt`)
}

export default api
