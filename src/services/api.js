import axios from 'axios'

// API基礎配置
const api = axios.create({
    baseURL: '/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// 請求攔截器
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token')
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
    error => {
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // 未授權，清除token並跳轉到登入頁
                    localStorage.removeItem('token')
                    window.location.href = '/login'
                    break
                case 403:
                    // 無權限
                    window.location.href = '/403'
                    break
                case 404:
                    // 找不到資源
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
    cancelOrder: (id) => api.put(`/orders/${id}/cancel`)
}

export default api
