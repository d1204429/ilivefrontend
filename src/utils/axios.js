import axios from 'axios'
import router from '@/router'
import store from '@/store'

// API 配置常量
const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:1988/api/v1',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
}

// API 路徑常量
const API_PATHS = {
    AUTH: '/users',
    USERS: '/users',
    PRODUCTS: '/products',
    CART: '/cart',
    ORDERS: '/orders',
    CATEGORIES: '/categories'
}

// 創建 axios 實例
const api = axios.create(API_CONFIG)

// 請求攔截器
api.interceptors.request.use(
    config => {
        // Token 處理
        const token = localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }

        // GET 請求添加時間戳防止緩存
        if (config.method?.toLowerCase() === 'get') {
            config.params = {
                ...config.params,
                _t: Date.now()
            }
        }

        // 請求開始時顯示 loading
        store.dispatch('app/setLoading', true)

        return config
    },
    error => {
        store.dispatch('app/setLoading', false)
        return Promise.reject(error)
    }
)

// 響應攔截器
api.interceptors.response.use(
    response => {
        store.dispatch('app/setLoading', false)
        return response.data
    },
    async error => {
        store.dispatch('app/setLoading', false)
        const originalRequest = error.config

        // Token 過期處理
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const refreshToken = localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY)
                if (!refreshToken) {
                    throw new Error('無效的重新整理令牌')
                }

                const response = await api.post(`${API_PATHS.AUTH}/refresh-token`, { refreshToken })
                if (!response.accessToken) {
                    throw new Error('重新整理令牌響應無效')
                }

                // 更新 token
                localStorage.setItem(import.meta.env.VITE_JWT_TOKEN_KEY, response.accessToken)
                localStorage.setItem(import.meta.env.VITE_JWT_REFRESH_KEY, response.refreshToken)

                // 重試原始請求
                originalRequest.headers['Authorization'] = `Bearer ${response.accessToken}`
                return api(originalRequest)
            } catch (refreshError) {
                await store.dispatch('auth/logout')
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

// API 錯誤處理
const handleApiError = (error) => {
    let errorMessage = '系統錯誤，請稍後再試'
    let errorType = 'error'
    let errorCode = null

    if (error.response) {
        const { status, data } = error.response
        errorCode = status

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
                errorMessage = '無權限執行此操作'
                errorType = 'error'
                break
            case 404:
                errorMessage = '請求的資源不存在'
                errorType = 'error'
                break
            case 422:
                errorMessage = data.message || '資料驗證失敗'
                errorType = 'warning'
                break
            case 429:
                errorMessage = '請求過於頻繁，請稍後再試'
                errorType = 'warning'
                break
            case 500:
                errorMessage = '伺服器錯誤，請稍後再試'
                errorType = 'error'
                break
            default:
                errorMessage = data.message || `未知錯誤 (${status})`
                errorType = 'error'
        }
    } else if (error.request) {
        errorMessage = '網路連接失敗，請檢查網路設定'
        errorType = 'warning'
    }

    store.dispatch('app/setError', {
        message: errorMessage,
        type: errorType,
        code: errorCode,
        duration: 3000
    })
}

// 認證相關 API
export const authApi = {
    login: (credentials) => api.post(`${API_PATHS.AUTH}/login`, credentials),
    register: (userData) => api.post(`${API_PATHS.AUTH}/register`, userData),
    logout: () => api.post(`${API_PATHS.AUTH}/logout`),
    refreshToken: (refreshToken) => api.post(`${API_PATHS.AUTH}/refresh-token`, { refreshToken }),
    verifyEmail: (token) => api.post(`${API_PATHS.AUTH}/verify-email`, { token }),
    forgotPassword: (email) => api.post(`${API_PATHS.AUTH}/forgot-password`, { email }),
    resetPassword: (token, password) => api.post(`${API_PATHS.AUTH}/reset-password`, { token, password }),
    getUserProfile: () => api.get(`${API_PATHS.USERS}/profile`),
    getProfile: () => api.get(`${API_PATHS.USERS}/profile`), // 添加別名
    updateUserProfile: (data) => api.put(`${API_PATHS.USERS}/profile`, data), // 添加別名
}

// 用戶相關 API
export const userApi = {
    getProfile: () => api.get(`${API_PATHS.USERS}/profile`),
    updateProfile: (data) => api.put(`${API_PATHS.USERS}/profile`, data),
    changePassword: (data) => api.put(`${API_PATHS.USERS}/password`, data),
    uploadAvatar: (formData) => api.post(`${API_PATHS.USERS}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    getUserProfile: () => api.get(`${API_PATHS.USERS}/profile`), // 添加別名
    updateUserProfile: (data) => api.put(`${API_PATHS.USERS}/profile`, data) // 添加別名
    }),
    getPreferences: () => api.get(`${API_PATHS.USERS}/preferences`),
    updatePreferences: (data) => api.put(`${API_PATHS.USERS}/preferences`, data)
}

// 商品相關 API
export const productApi = {
    getList: (params) => api.get(API_PATHS.PRODUCTS, { params }),
    getById: (id) => api.get(`${API_PATHS.PRODUCTS}/${id}`),
    getCategories: () => api.get(API_PATHS.CATEGORIES),
    search: (params) => api.get(`${API_PATHS.PRODUCTS}/search`, { params }),
    getNewArrivals: () => api.get(`${API_PATHS.PRODUCTS}/new-arrivals`),
    getRecommended: () => api.get(`${API_PATHS.PRODUCTS}/recommended`),
    getReviews: (productId) => api.get(`${API_PATHS.PRODUCTS}/${productId}/reviews`),
    addReview: (productId, data) => api.post(`${API_PATHS.PRODUCTS}/${productId}/reviews`, data)
}

// 購物車相關 API
export const cartApi = {
    getItems: () => api.get(`${API_PATHS.CART}/items`),
    addItem: (data) => api.post(`${API_PATHS.CART}/items`, data),
    updateItem: (id, data) => api.put(`${API_PATHS.CART}/items/${id}`, data),
    removeItem: (id) => api.delete(`${API_PATHS.CART}/items/${id}`),
    clear: () => api.delete(API_PATHS.CART),
    applyCoupon: (code) => api.post(`${API_PATHS.CART}/coupon`, { code }),
    removeCoupon: () => api.delete(`${API_PATHS.CART}/coupon`),
    getShippingMethods: () => api.get(`${API_PATHS.CART}/shipping-methods`),
    setShippingMethod: (methodId) => api.put(`${API_PATHS.CART}/shipping-method`, { methodId }),
    checkout: (data) => api.post(`${API_PATHS.CART}/checkout`, data)
}

// 訂單相關 API
export const orderApi = {
    create: (data) => api.post(API_PATHS.ORDERS, data),
    getList: (params) => api.get(API_PATHS.ORDERS, { params }),
    getById: (id) => api.get(`${API_PATHS.ORDERS}/${id}`),
    cancel: (id) => api.put(`${API_PATHS.ORDERS}/${id}/cancel`),
    pay: (id, data) => api.post(`${API_PATHS.ORDERS}/${id}/payment`, data),
    getPaymentMethods: () => api.get(`${API_PATHS.ORDERS}/payment-methods`),
    confirmReceipt: (id) => api.put(`${API_PATHS.ORDERS}/${id}/confirm-receipt`),
    getShipmentTracking: (id) => api.get(`${API_PATHS.ORDERS}/${id}/tracking`)
}

export default api
