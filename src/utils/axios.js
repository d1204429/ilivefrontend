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
        const res = response.data
        if (res.code && res.code !== 200) {
            handleApiError({ response })
            return Promise.reject(new Error(res.message || '錯誤'))
        }
        return res
    },
    async error => {
        const originalRequest = error.config

        // Token 過期處理
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true
            try {
                const refreshToken = localStorage.getItem('refreshToken')
                if (!refreshToken) {
                    throw new Error('No refresh token available')
                }

                // 刷新 Token
                const response = await api.post('/auth/refresh-token', {
                    refreshToken,
                    grantType: 'refresh_token'
                })

                const { accessToken, refreshToken: newRefreshToken } = response.data

                // 更新 Token
                localStorage.setItem('accessToken', accessToken)
                localStorage.setItem('refreshToken', newRefreshToken)
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

                // 重試原始請求
                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`
                return api(originalRequest)
            } catch (refreshError) {
                // Token 刷新失敗,清除用戶信息並跳轉登入頁
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                localStorage.removeItem('user')
                if (store?.dispatch) {
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

// 錯誤處理
function handleApiError(error) {
    let errorMessage = '系統錯誤'
    let errorCode = ''

    if (error.response) {
        const { status, data } = error.response
        errorCode = status
        errorMessage = data?.message || '請求失敗'

        switch (status) {
            case 400:
                errorMessage = data?.message || '請求參數錯誤'
                break
            case 401:
                errorMessage = '未授權,請重新登入'
                break
            case 403:
                errorMessage = '無權限訪問'
                router.push('/403')
                break
            case 404:
                errorMessage = '請求的資源不存在'
                router.push('/404')
                break
            case 500:
                errorMessage = '伺服器錯誤'
                router.push('/500')
                break
            default:
                errorMessage = `請求失敗(${status})`
        }
    } else if (error.request) {
        errorCode = 'NETWORK_ERROR'
        errorMessage = '網路連接失敗,請檢查網路設置'
    } else {
        errorCode = 'ERROR'
        errorMessage = error.message
    }

    // 提交錯誤到 store
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
// API 端點定義
// API 定義
export const authApi = {
    login: data => api.post('/auth/login', data),
    register: data => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    refreshToken: refreshToken => api.post('/auth/refresh-token', { refreshToken }),
    verifyToken: () => api.get('/auth/verify')
}

export const userApi = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: data => api.put('/users/profile', data),
    changePassword: data => api.put('/users/password', data),
    uploadAvatar: formData => api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
}

export const productApi = {
    getList: params => api.get('/products', { params }),
    getDetail: id => api.get(`/products/${id}`),
    getCategories: () => api.get('/products/categories'),
    search: params => api.get('/products/search', { params })
}

export const cartApi = {
    getItems: () => api.get('/cart'),
    addItem: data => api.post('/cart/items', data),
    updateItem: (id, data) => api.put(`/cart/items/${id}`, data),
    removeItem: id => api.delete(`/cart/items/${id}`),
    clear: () => api.delete('/cart')
}

export const orderApi = {
    create: data => api.post('/orders', data),
    getList: params => api.get('/orders', { params }),
    getDetail: id => api.get(`/orders/${id}`),
    cancel: id => api.put(`/orders/${id}/cancel`),
    pay: (id, data) => api.post(`/orders/${id}/payment`, data)
}


// 健康檢查 API
export const healthApi = {
    check: () => api.get('/health')
}

export default api
