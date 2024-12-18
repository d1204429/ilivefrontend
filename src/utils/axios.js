import axios from 'axios'

// API基礎配置
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:1988/api/v1',
    timeout: import.meta.env.VITE_API_TIMEOUT || 10000,
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

        // 添加請求ID和時間戳
        config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        if (config.method === 'get') {
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
                const refreshToken = localStorage.getItem('refreshToken')
                if (!refreshToken) {
                    throw new Error('無可用的重整Token')
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
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                localStorage.removeItem('user')
                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }

        if (error.response) {
            const { status, data } = error.response
            switch (status) {
                case 403:
                    window.location.href = '/403'
                    break
                case 404:
                    window.location.href = '/404'
                    break
                case 500:
                    window.location.href = '/500'
                    break
                default:
                    console.error('API錯誤:', data)
            }
        }
        return Promise.reject(error)
    }
)[2]

// 用戶相關API
export const userApi = {
    login: data => api.post('/users/login', data),
    register: data => api.post('/users/register', data),
    getUserInfo: () => api.get('/users/profile'),
    updateUserInfo: data => api.put('/users/profile', data),
    changePassword: data => api.put('/users/password', data),
    refreshToken: refreshToken => api.post('/users/refresh-token', { refreshToken }),
    logout: () => api.post('/users/logout')
}[3]

// 商品相關API
export const productApi = {
    getProducts: params => api.get('/products', { params }),
    getProductById: id => api.get(`/products/${id}`),
    getCategories: () => api.get('/products/categories'),
    searchProducts: params => api.get('/products/search', { params }),
    getProductsByCategory: categoryId => api.get(`/products/category/${categoryId}`),
    getRecommended: () => api.get('/products/recommended'),
    getNewArrivals: () => api.get('/products/new-arrivals')
}[3]

// 購物車相關API
export const cartApi = {
    getCartItems: () => api.get('/cart/items'),
    addToCart: data => api.post('/cart/items/add', data),
    updateQuantity: (cartItemId, data) => api.put(`/cart/items/${cartItemId}`, data),
    removeItem: cartItemId => api.delete(`/cart/items/${cartItemId}`),
    clearCart: () => api.delete('/cart'),
    applyCoupon: code => api.post('/cart/coupon', { code }),
    removeCoupon: () => api.delete('/cart/coupon')
}[3]

// 訂單相關API
export const orderApi = {
    createOrder: data => api.post('/orders', data),
    getOrders: params => api.get('/orders', { params }),
    getOrderById: id => api.get(`/orders/${id}`),
    cancelOrder: id => api.put(`/orders/${id}/cancel`),
    processPayment: (orderId, data) => api.post(`/orders/${orderId}/payment`, data),
    getPaymentMethods: () => api.get('/orders/payment-methods'),
    confirmReceipt: id => api.put(`/orders/${id}/confirm-receipt`)
}[3]

export default api
