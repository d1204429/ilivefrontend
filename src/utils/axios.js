import axios from 'axios'

// 建立 axios 實例
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
        // 從 localStorage 獲取 token
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
                    // 未授權,清除 token 並跳轉到登入頁
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
                case 500:
                    // 伺服器錯誤
                    window.location.href = '/500'
                    break
                default:
                    console.error('API錯誤:', error.response.data)
            }
        }
        return Promise.reject(error)
    }
)

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
