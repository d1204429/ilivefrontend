import axios from 'axios'
import router from '@/router'
import store from '@/store'

// API 基礎配置
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:1988/api/v1',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
})

// 請求攔截器
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }

        // 防止 GET 請求快取
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
        if (error.response?.status === 401) {
            // 嘗試刷新 Token
            try {
                const refreshToken = localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY)
                if (refreshToken) {
                    const response = await api.post('/users/refresh-token', { refreshToken })
                    if (response.data?.accessToken) {
                        localStorage.setItem(import.meta.env.VITE_JWT_TOKEN_KEY, response.data.accessToken)
                        localStorage.setItem(import.meta.env.VITE_JWT_REFRESH_KEY, response.data.refreshToken)

                        // 重試原始請求
                        error.config.headers['Authorization'] = `Bearer ${response.data.accessToken}`
                        return api(error.config)
                    }
                }
            } catch (refreshError) {
                store.dispatch('auth/logout')
                router.push('/login')
                return Promise.reject(refreshError)
            }
        }

        handleApiError(error)
        return Promise.reject(error)
    }
)

// 錯誤處理
const handleApiError = (error) => {
    let errorMessage = '發生未知錯誤'

    if (error.response) {
        const { status, data } = error.response

        switch (status) {
            case 400:
                errorMessage = data.message || '請求參數錯誤'
                break
            case 403:
                errorMessage = '無權限訪問'
                router.push('/403')
                break
            case 404:
                errorMessage = '請求的資源不存在'
                router.push('/404')
                break
            case 500:
                errorMessage = '伺服器錯誤'
                router.push('/500')
                break
            default:
                errorMessage = data.message || `錯誤代碼：${status}`
        }
    } else if (error.request) {
        errorMessage = '網路連接失敗，請檢查網路設定'
    }

    store.dispatch('app/setError', {
        message: errorMessage,
        type: 'error'
    })
}

// API 服務
export const authApi = {
    login: (data) => api.post('/users/login', data),
    register: (data) => api.post('/users/register', data),
    logout: () => api.post('/users/logout'),
    refreshToken: (refreshToken) => api.post('/users/refresh-token', { refreshToken }),
    verifyEmail: (token) => api.post('/users/verify-email', { token })
}

export const userApi = {
    getProfile: (userId) => api.get(`/users/${userId}`),
    updateProfile: (userId, data) => api.put(`/users/${userId}`, data),
    changePassword: (userId, data) => api.put(`/users/${userId}/password`, data),
    uploadAvatar: (userId, formData) => api.post(`/users/${userId}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
}

export const productApi = {
    getList: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    getCategories: () => api.get('/products/categories'),
    search: (params) => api.get('/products/search', { params }),
    getNewArrivals: () => api.get('/products/new-arrivals'),
    getRecommended: () => api.get('/products/recommended'),
    getReviews: (productId) => api.get(`/products/${productId}/reviews`)
}

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
