import axios from 'axios'

// 建立 axios 實例
const api = axios.create({
    baseURL: 'http://localhost:1988/api/v1', // 更新為實際的後端 API URL
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true // 允許跨域請求攜帶憑證
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
                console.error('Token refresh failed:', refreshError)
                store.dispatch('user/logout')
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
    if (error.response) {
        const status = error.response.status
        const errorMessage = error.response.data?.message || '發生錯誤，請稍後再試'

        switch (status) {
            case 400:
                console.error('Bad Request:', errorMessage)
                break
            case 403:
                router.push('/403')
                break
            case 404:
                router.push('/404')
                break
            case 500:
                router.push('/500')
                break
            default:
                console.error(`HTTP Error ${status}:`, errorMessage)
        }

        store.commit('app/SET_ERROR', { show: true, message: errorMessage })
    } else if (error.request) {
        console.error('Network Error:', error.request)
        store.commit('app/SET_ERROR', { show: true, message: '無法連接到伺服器，請檢查網路連線' })
    } else {
        console.error('Error:', error.message)
        store.commit('app/SET_ERROR', { show: true, message: '發生未知錯誤' })
    }
}

// 用戶相關 API
export const userApi = {
    // 登入
    login: (data) => api.post('/users/login', data),

    // 註冊
    register: (data) => api.post('/users/register', data),

    // 獲取用戶資料
    getUserInfo: () => api.get('/users/profile'),

    // 更新用戶資料
    updateUserInfo: (data) => api.put('/users/profile', data),

    // 修改密碼
    changePassword: (data) => api.put('/users/password', data)
}

// 商品相關 API
export const productApi = {
    // 獲取商品列表
    getProducts: () => api.get('/products'),

    // 獲取商品詳情
    getProductById: (id) => api.get(`/products/${id}`),

    // 獲取商品分類
    getCategories: () => api.get('/products/categories'),

    // 搜尋商品
    searchProducts: (params) => api.get('/products/search', { params }),

    // 根據分類獲取商品
    getProductsByCategory: (categoryId) => api.get(`/products/category/${categoryId}`)
}

// 購物車相關 API
export const cartApi = {
    // 獲取購物車內容
    getCartItems: () => api.get('/cart/items'),

    // 添加商品到購物車
    addToCart: (data) => api.post('/cart/items/add', data),

    // 更新購物車商品數量
    updateQuantity: (cartItemId, data) => api.put(`/cart/items/${cartItemId}`, data),

    // 移除購物車商品
    removeItem: (cartItemId) => api.delete(`/cart/items/${cartItemId}`),

    // 清空購物車
    clearCart: () => api.delete('/cart')
}

// 訂單相關 API
export const orderApi = {
    // 建立訂單
    createOrder: (data) => api.post('/orders', data),

    // 獲取訂單列表
    getOrders: () => api.get('/orders'),

    // 獲取訂單詳情
    getOrderById: (id) => api.get(`/orders/${id}`),

    // 取消訂單
    cancelOrder: (id) => api.put(`/orders/${id}/cancel`)
}

export default api
