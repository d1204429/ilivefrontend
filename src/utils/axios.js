import axios from 'axios'
import router from '@/router'
import store from '@/store'

// 建立 axios 實例
const api = axios.create({
    baseURL: 'http://localhost:1988/api/v1',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: false // 修改為 false 以避免 CORS 預檢請求問題
})

// 請求攔截器
api.interceptors.request.use(
    config => {
        const accessToken = localStorage.getItem('accessToken')
        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`
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
    response => response.data,
    async error => {
        const originalRequest = error.config
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true
            try {
                const refreshToken = localStorage.getItem('refreshToken')
                if (!refreshToken) {
                    throw new Error('No refresh token available')
                }
                const response = await api.post('/users/refresh-token', { refreshToken })
                const { accessToken } = response.data
                localStorage.setItem('accessToken', accessToken)
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
                return api(originalRequest)
            } catch (refreshError) {
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                if (store && store.dispatch) {
                    await store.dispatch('user/logout')
                }
                router.push('/login')
                return Promise.reject(refreshError)
            }
        }
        handleApiError(error)
        return Promise.reject(error)
    }
)

// 全局錯誤處理函數
function handleApiError(error) {
    let errorMessage = '發生未知錯誤'

    if (error.response) {
        const status = error.response.status
        errorMessage = error.response.data?.message || '請求失敗'

        switch (status) {
            case 400:
                console.error('請求錯誤:', errorMessage)
                break
            case 403:
                errorMessage = '無權限訪問'
                router.push('/403')
                break
            case 404:
                errorMessage = '資源不存在'
                router.push('/404')
                break
            case 500:
                errorMessage = '伺服器錯誤'
                router.push('/500')
                break
            default:
                console.error(`HTTP Error ${status}:`, errorMessage)
        }
    } else if (error.request) {
        errorMessage = '無法連接到伺服器，請檢查網路連線'
        console.error('Network Error:', error.request)
    }

    if (store && store.commit) {
        store.commit('app/SET_ERROR', {
            show: true,
            message: errorMessage
        })
    }
}

// API 端點定義
export const userApi = {
    login: (data) => api.post('/users/login', data),
    register: (data) => api.post('/users/register', data),
    getUserInfo: () => api.get('/users/profile'),
    updateUserInfo: (data) => api.put('/users/profile', data),
    changePassword: (data) => api.put('/users/password', data),
    refreshToken: (refreshToken) => api.post('/users/refresh-token', { refreshToken }),
    verifyToken: () => api.get('/users/verify-token')
}

export const productApi = {
    getProducts: (params) => api.get('/products', { params }),
    getProductById: (id) => api.get(`/products/${id}`),
    getCategories: () => api.get('/products/categories'),
    searchProducts: (params) => api.get('/products/search', { params }),
    getProductsByCategory: (categoryId) => api.get(`/products/category/${categoryId}`)
}

export const cartApi = {
    getCartItems: () => api.get('/cart/items'),
    addToCart: (data) => api.post('/cart/items/add', data),
    updateQuantity: (cartItemId, data) => api.put(`/cart/items/${cartItemId}`, data),
    removeItem: (cartItemId) => api.delete(`/cart/items/${cartItemId}`),
    clearCart: () => api.delete('/cart')
}

export const orderApi = {
    createOrder: (data) => api.post('/orders', data),
    getOrders: () => api.get('/orders'),
    getOrderById: (id) => api.get(`/orders/${id}`),
    cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
    processPayment: (orderId, paymentData) => api.post(`/orders/${orderId}/payment`, paymentData)
}

// 健康檢查 API
export const healthApi = {
    check: () => api.get('/health')
}

export default api
