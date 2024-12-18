import axios from 'axios'
import router from '@/router'
import store from '@/store'
import { handleError } from '@/utils/errorHandler'

// API 基礎配置
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
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
        if (error.response?.status === 401) {
            // 清除認證信息
            store.dispatch('auth/logout')
            router.push('/login')
        }

        handleError(error)
        return Promise.reject(error)
    }
)

// 認證相關 API
export const authApi = {
    login: (credentials) => api.post('/users/login', credentials),
    register: (userData) => api.post('/users/register', userData),
    logout: () => api.post('/users/logout')
}

// 用戶相關 API
export const userApi = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    changePassword: (data) => api.put('/users/password', data)
}

// 商品相關 API
export const productApi = {
    getList: (params) => api.get('/products', { params }),
    getDetail: (id) => api.get(`/products/${id}`),
    search: (params) => api.get('/products/search', { params }),
    getCategories: () => api.get('/products/categories'),
    getNewArrivals: () => api.get('/products/new-arrivals'),
    getRecommended: () => api.get('/products/recommended')
}

// 購物車相關 API
export const cartApi = {
    getCart: () => api.get('/cart'),
    addItem: (data) => api.post('/cart/items', data),
    updateItem: (id, data) => api.put(`/cart/items/${id}`, data),
    removeItem: (id) => api.delete(`/cart/items/${id}`),
    clear: () => api.delete('/cart'),
    applyCoupon: (code) => api.post('/cart/coupon', { code }),
    removeCoupon: () => api.delete('/cart/coupon')
}

// 訂單相關 API
export const orderApi = {
    create: (data) => api.post('/orders', data),
    getList: (params) => api.get('/orders', { params }),
    getDetail: (id) => api.get(`/orders/${id}`),
    cancel: (id) => api.put(`/orders/${id}/cancel`),
    pay: (id, paymentData) => api.post(`/orders/${id}/payment`, paymentData),
    confirmReceipt: (id) => api.put(`/orders/${id}/confirm`)
}

// 地址相關 API
export const addressApi = {
    getList: () => api.get('/addresses'),
    create: (data) => api.post('/addresses', data),
    update: (id, data) => api.put(`/addresses/${id}`, data),
    delete: (id) => api.delete(`/addresses/${id}`),
    setDefault: (id) => api.put(`/addresses/${id}/default`)
}

// 收藏相關 API
export const favoriteApi = {
    getList: () => api.get('/favorites'),
    add: (productId) => api.post('/favorites', { productId }),
    remove: (productId) => api.delete(`/favorites/${productId}`)
}

// 評論相關 API
export const reviewApi = {
    getProductReviews: (productId, params) => api.get(`/products/${productId}/reviews`, { params }),
    create: (productId, data) => api.post(`/products/${productId}/reviews`, data),
    update: (reviewId, data) => api.put(`/reviews/${reviewId}`, data),
    delete: (reviewId) => api.delete(`/reviews/${reviewId}`)
}

export default {
    auth: authApi,
    user: userApi,
    product: productApi,
    cart: cartApi,
    order: orderApi,
    address: addressApi,
    favorite: favoriteApi,
    review: reviewApi
}
