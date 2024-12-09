import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import axios from './utils/axios'

// 引入樣式
import './assets/base.css'
import './assets/main.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@fortawesome/fontawesome-free/css/all.css'

// 創建Vue應用實例
const app = createApp(App)

// 使用Pinia狀態管理
const pinia = createPinia()
app.use(pinia)

// 使用Vue Router
app.use(router)

// 配置Axios
app.config.globalProperties.$axios = axios
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
axios.defaults.timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000')

// 全局錯誤處理
app.config.errorHandler = (err, vm, info) => {
    console.error('全局錯誤:', err)
    console.error('錯誤組件:', vm)
    console.error('錯誤信息:', info)

    // 可以添加錯誤上報邏輯
    if (import.meta.env.PROD) {
        // 生產環境錯誤處理
    }
}

// 全局導航守衛
router.beforeEach(async (to, from, next) => {
    // 設置頁面標題
    document.title = to.meta.title ? `${to.meta.title} - iLive商城` : 'iLive商城'

    const token = localStorage.getItem('token')
    const isAuthenticated = !!token

    try {
        if (to.matched.some(record => record.meta.requiresAuth)) {
            if (!isAuthenticated) {
                next({
                    path: '/login',
                    query: { redirect: to.fullPath }
                })
                return
            }
        }

        // 已登入用戶訪問登入/註冊頁面
        if (isAuthenticated && (to.name === 'Login' || to.name === 'Register')) {
            next({ name: 'Home' })
            return
        }

        next()
    } catch (error) {
        console.error('路由守衛錯誤:', error)
        next('/404')
    }
})

// 環境配置
if (import.meta.env.DEV) {
    app.config.devtools = true
    app.config.performance = true
    console.log('開發環境')
} else {
    app.config.devtools = false
    app.config.performance = false
    console.log('生產環境')
}

// 掛載應用
app.mount('#app')

// 導出app實例（用於測試）
export { app, router, pinia }
