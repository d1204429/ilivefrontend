import axios from 'axios'
import router from '@/router'
import { useStore } from 'vuex'

// API 基礎配置
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:1988/api/v1',
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
})

// 請求攔截器
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }

        // 添加請求標識
        config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).slice(2)}`

        // 防止GET請求緩存
        if (config.method?.toLowerCase() === 'get') {
            config.params = {
                ...config.params,
                _t: Date.now()
            }
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
        return response.data
    },
    async error => {
        const store = useStore()
        const originalRequest = error.config

        // 處理 401 錯誤和 Token 刷新
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const refreshToken = localStorage.getItem('refreshToken')
                if (!refreshToken) {
                    throw new Error('No refresh token available')
                }

                const response = await api.post('/users/refresh-token', {
                    refreshToken,
                    grantType: 'refresh_token'
                })

                const { accessToken } = response.data
                localStorage.setItem('accessToken', accessToken)
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

                return api(originalRequest)
            } catch (refreshError) {
                handleAuthError()
                return Promise.reject(refreshError)
            }
        }

        // 錯誤處理
        if (error.response) {
            const { status, data } = error.response

            switch (status) {
                case 400:
                    store.dispatch('app/setError', data.message || '請求參數錯誤')
                    break
                case 403:
                    store.dispatch('app/setError', '無權限訪問')
                    router.push('/403')
                    break
                case 404:
                    store.dispatch('app/setError', '資源不存在')
                    router.push('/404')
                    break
                case 500:
                    store.dispatch('app/setError', '服務器錯誤')
                    router.push('/500')
                    break
                default:
                    store.dispatch('app/setError', data.message || '未知錯誤')
            }
        } else if (error.request) {
            store.dispatch('app/setError', '網絡請求失敗')
        } else {
            store.dispatch('app/setError', error.message)
        }

        return Promise.reject(error)
    }
)

// 處理認證錯誤
const handleAuthError = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    router.push('/login')
}

// API 服務
export const userApi = {
    login: (data) => api.post('/users/login', data),
    register: (data) => api.post('/users/register', data),
    getUserInfo: () => api.get('/users/profile'),
    updateUserInfo: (data) => api.put('/users/profile', data),
    changePassword: (data) => api.put('/users/password', data),
    refreshToken: (refreshToken) => api.post('/users/refresh-token', { refreshToken }),
    logout: () => api.post('/users/logout')
}

export const productApi = {
    getProducts: (params) => api.get('/products', { params }),
    getProductById: (id) => api.get(`/products/${id}`),
    getCategories: () => api.get('/products/categories'),
    searchProducts: (params) => api.get('/products/search', { params }),
    getProductsByCategory: (categoryId) => api.get(`/products/category/${categoryId}`),
    getRecommended: () => api.get('/products/recommended'),
    getNewArrivals: () => api.get('/products/new-arrivals')
}

export const cartApi = {
    getCartItems: () => api.get('/cart/items'),
    addToCart: (data) => api.post('/cart/items/add', data),
    updateQuantity: (cartItemId, data) => api.put(`/cart/items/${cartItemId}`, data),
    removeItem: (cartItemId) => api.delete(`/cart/items/${cartItemId}`),
    clearCart: () => api.delete('/cart'),
    applyCoupon: (code) => api.post('/cart/coupon', { code }),
    removeCoupon: () => api.delete('/cart/coupon')
}

export const orderApi = {
    createOrder: (data) => api.post('/orders', data),
    getOrders: (params) => api.get('/orders', { params }),
    getOrderById: (id) => api.get(`/orders/${id}`),
    cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
    processPayment: (orderId, data) => api.post(`/orders/${orderId}/payment`, data),
    getPaymentMethods: () => api.get('/orders/payment-methods'),
    confirmReceipt: (id) => api.put(`/orders/${id}/confirm-receipt`)
}

export default api
