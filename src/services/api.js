import axios from 'axios'
import router from '@/router'
import store from '@/store'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: import.meta.env.VITE_API_TIMEOUT || 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
})

// 請求攔截器
api.interceptors.request.use(
    config => {
        const accessToken = localStorage.getItem('accessToken')
        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`
        }

        // 添加請求ID和時間戳
        config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // GET請求添加快取破壞參數
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
        const res = response.data

        // 處理成功響應
        if (res.success === false || (res.code && res.code !== 200)) {
            handleApiError({ response })
            return Promise.reject(new Error(res.message || '請求失敗'))
        }

        return res
    },
    async error => {
        const originalRequest = error.config

        // Token過期處理
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

                const { accessToken, refreshToken: newRefreshToken } = response.data

                localStorage.setItem('accessToken', accessToken)
                localStorage.setItem('refreshToken', newRefreshToken)
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`
                return api(originalRequest)
            } catch (refreshError) {
                await handleLogout()
                return Promise.reject(refreshError)
            }
        }

        handleApiError(error)
        return Promise.reject(error)
    }
)

async function handleLogout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    if (store?.dispatch) {
        await store.dispatch('auth/logout')
    }
    router.push('/login')
}

function handleApiError(error) {
    let errorMessage = '系統錯誤'
    let errorCode = ''

    if (error.response) {
        const { status, data } = error.response
        errorCode = status
        errorMessage = data?.message || getDefaultErrorMessage(status)

        if (status === 403) {
            router.push('/403')
        } else if (status === 404) {
            router.push('/404')
        } else if (status === 500) {
            router.push('/500')
        }
    } else if (error.request) {
        errorCode = 'NETWORK_ERROR'
        errorMessage = '網路連接失敗，請檢查網路設置'
    } else {
        errorCode = 'ERROR'
        errorMessage = error.message
    }

    if (store?.commit) {
        store.commit('app/SET_ERROR', {
            show: true,
            code: errorCode,
            message: errorMessage
        })
    }

    console.error('[API Error]', {
        code: errorCode,
        message: errorMessage,
        error
    })
}

function getDefaultErrorMessage(status) {
    const errorMessages = {
        400: '請求參數錯誤',
        401: '未授權，請重新登入',
        403: '無權限訪問',
        404: '請求的資源不存在',
        500: '伺服器錯誤',
        502: '網關錯誤',
        503: '服務暫時無法使用',
        504: '網關超時'
    }
    return errorMessages[status] || `請求失敗(${status})`
}

// API端點定義
export const authApi = {
    login: data => api.post('/users/login', data),
    register: data => api.post('/users/register', data),
    logout: () => api.post('/users/logout'),
    refreshToken: refreshToken => api.post('/users/refresh-token', { refreshToken }),
    verifyToken: () => api.get('/users/verify-token')
}

export const userApi = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: data => api.put('/users/profile', data),
    changePassword: data => api.put('/users/password', data),
    updateAvatar: formData => api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
}

export const productApi = {
    getProducts: params => api.get('/products', { params }),
    getCategories: () => api.get('/products/categories'),
    getProductById: id => api.get(`/products/${id}`),
    searchProducts: params => api.get('/products/search', { params }),
    getRecommended: () => api.get('/products/recommended'),
    getNewArrivals: () => api.get('/products/new-arrivals')
}

export const cartApi = {
    getItems: () => api.get('/cart'),
    addItem: data => api.post('/cart/items', data),
    updateItem: (id, data) => api.put(`/cart/items/${id}`, data),
    removeItem: id => api.delete(`/cart/items/${id}`),
    clear: () => api.delete('/cart'),
    applyCoupon: code => api.post('/cart/coupon', { code }),
    removeCoupon: () => api.delete('/cart/coupon')
}

export const orderApi = {
    create: data => api.post('/orders', data),
    getList: params => api.get('/orders', { params }),
    getDetail: id => api.get(`/orders/${id}`),
    cancel: id => api.put(`/orders/${id}/cancel`),
    pay: (id, data) => api.post(`/orders/${id}/payment`, data),
    getPaymentMethods: () => api.get('/orders/payment-methods'),
    confirmReceipt: id => api.put(`/orders/${id}/confirm-receipt`)
}

export const healthApi = {
    check: () => api.get('/health')
}

export default api
