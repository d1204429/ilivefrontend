import axios from 'axios'
import router from '@/router'
import store from '@/store'

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

        // 添加時間戳防止快取
        if (config.method === 'get') {
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
        const originalRequest = error.config

        // 處理 401 未授權錯誤
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                // 清除本地存儲並跳轉到登入頁
                store.dispatch('auth/logout')
                router.push('/login')
                return Promise.reject(error)
            } catch (refreshError) {
                return Promise.reject(refreshError)
            }
        }

        // 錯誤處理
        handleApiError(error)
        return Promise.reject(error)
    }
)

// 錯誤處理函數
const handleApiError = (error) => {
    let errorMessage = '發生未知錯誤'

    if (error.response) {
        const { status, data } = error.response

        switch (status) {
            case 400:
                errorMessage = data.message || '請求參數錯誤'
                break
            case 401:
                errorMessage = '未授權，請重新登入'
                break
            case 403:
                errorMessage = '無權限訪問該資源'
                router.push('/403')
                break
            case 404:
                errorMessage = '請求的資源不存在'
                router.push('/404')
                break
            case 500:
                errorMessage = '伺服器錯誤'
                break
            default:
                errorMessage = data.message || `錯誤代碼：${status}`
        }
    } else if (error.request) {
        errorMessage = '網路連接失敗，請檢查網路設定'
    }

    store.dispatch('app/setError', errorMessage)
}

// API 服務
export const authApi = {
    login: (data) => api.post('/users/login', data),
    register: (data) => api.post('/users/register', data),
    logout: () => api.post('/users/logout')
}

export const userApi = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    changePassword: (data) => api.put('/users/password', data)
}

export const productApi = {
    getProducts: (params) => api.get('/products', { params }),
    getProductById: (id) => api.get(`/products/${id}`),
    searchProducts: (params) => api.get('/products/search', { params })
}

export const cartApi = {
    getCart: () => api.get('/cart'),
    addToCart: (data) => api.post('/cart/add', data),
    updateCartItem: (id, data) => api.put(`/cart/${id}`, data),
    removeFromCart: (id) => api.delete(`/cart/${id}`),
    clearCart: () => api.delete('/cart')
}

export const orderApi = {
    createOrder: (data) => api.post('/orders', data),
    getOrders: () => api.get('/orders'),
    getOrderById: (id) => api.get(`/orders/${id}`)
}

export default api
