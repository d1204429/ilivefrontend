import axios from 'axios'

// API基礎配置
const api = axios.create({
    baseURL: 'http://localhost:1988/api/v1', // 更新為後端API的實際URL
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true // 啟用跨域請求時發送cookies
})

// 請求攔截器
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// 響應攔截器
api.interceptors.response.use(
    response => {
        return response.data
    },
    async error => {
        const originalRequest = error.config
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true
            try {
                const refreshToken = localStorage.getItem('refreshToken')
                const response = await api.post('/users/refresh-token', { refreshToken })
                const { accessToken } = response.data
                localStorage.setItem('accessToken', accessToken)
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
                return api(originalRequest)
            } catch (refreshError) {
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }
        if (error.response) {
            switch (error.response.status) {
                case 403:
                    window.location.href = '/403'
                    break
                case 404:
                    window.location.href = '/404'
                    break
                default:
                    console.error('API錯誤:', error.response.data)
            }
        }
        return Promise.reject(error)
    }
)

// 用戶相關API
export const userApi = {
    login: (data) => api.post('/users/login', data),
    register: (data) => api.post('/users/register', data),
    getUserInfo: () => api.get('/users/profile'),
    updateUserInfo: (data) => api.put('/users/profile', data),
    changePassword: (data) => api.put('/users/password', data)
}

// 商品相關API
export const productApi = {
    getProducts: () => api.get('/products'),
    getProductById: (id) => api.get(`/products/${id}`),
    getCategories: () => api.get('/products/categories'),
    searchProducts: (params) => api.get('/products/search', { params }),
    getProductsByCategory: (categoryId) => api.get(`/products/category/${categoryId}`)
}

// 購物車相關API
export const cartApi = {
    getCartItems: () => api.get('/cart/items'),
    addToCart: (data) => api.post('/cart/items/add', data),
    updateQuantity: (cartItemId, data) => api.put(`/cart/items/${cartItemId}`, data),
    removeItem: (cartItemId) => api.delete(`/cart/items/${cartItemId}`),
    clearCart: () => api.delete('/cart')
}

// 訂單相關API
export const orderApi = {
    createOrder: (data) => api.post('/orders', data),
    getOrders: () => api.get('/orders'),
    getOrderById: (id) => api.get(`/orders/${id}`),
    cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
    processPayment: (orderId, data) => api.post(`/orders/${orderId}/payment`, data)
}

export default api
