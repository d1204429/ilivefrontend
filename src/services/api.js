import axios from 'axios'
import router from '@/router'
import store from '@/store'
import { handleError } from '@/utils/errorHandler'

// API 基礎配置
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
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
            store.dispatch('auth/logout')
            router.push('/login')
        }
        handleError(error)
        return Promise.reject(error)
    }
)

// 用戶相關 API
export const userApi = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    changePassword: (data) => api.put('/users/password', data),
    getOrders: () => api.get('/users/orders'),
    getFavorites: () => api.get('/users/favorites'),
    addFavorite: (productId) => api.post(`/users/favorites/${productId}`),
    removeFavorite: (productId) => api.delete(`/users/favorites/${productId}`)
}

// 認證相關 API
export const authApi = {
    login: (credentials) => api.post('/users/login', credentials),
    register: (userData) => api.post('/users/register', userData),
    logout: () => api.post('/users/logout')
}

// 商品相關 API
export const productApi = {
    getList: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    getCategories: () => api.get('/products/categories'),
    search: (params) => api.get('/products/search', { params }),
    getByCategory: (categoryId) => api.get(`/products/category/${categoryId}`)
}

// 購物車相關 API
export const cartApi = {
    getItems: () => api.get('/cart'),
    addItem: (data) => api.post('/cart/items', data),
    updateItem: (id, data) => api.put(`/cart/items/${id}`, data),
    removeItem: (id) => api.delete(`/cart/items/${id}`),
    clear: () => api.delete('/cart')
}

// 訂單相關 API
export const orderApi = {
    create: (data) => api.post('/orders', data),
    getList: (params) => api.get('/orders', { params }),
    getDetail: (id) => api.get(`/orders/${id}`),
    cancel: (id) => api.put(`/orders/${id}/cancel`),
    pay: (id, data) => api.post(`/orders/${id}/payment`, data)
}

// 管理員 API
export const adminApi = {
    createProduct: (data) => api.post('/admin/products', data),
    updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
    deleteProduct: (id) => api.delete(`/admin/products/${id}`)
}

export default {
    auth: authApi,
    user: userApi,
    product: productApi,
    cart: cartApi,
    order: orderApi,
    admin: adminApi
}
