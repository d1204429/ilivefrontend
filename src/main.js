import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import axios from './utils/axios'
import { BootstrapVue3 } from 'bootstrap-vue-3'

// 引入樣式
import './assets/base.css'
import './assets/main.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css'
import '@fortawesome/fontawesome-free/css/all.css'

// 創建Vue應用實例
const app = createApp(App)

// 使用插件
app.use(createPinia())
app.use(router)
app.use(BootstrapVue3)

// 配置Axios
app.config.globalProperties.$axios = axios
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1988/api/v1'
axios.defaults.timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '15000')
axios.defaults.withCredentials = false // 避免 CORS 預檢請求問題

// 全局錯誤處理
app.config.errorHandler = (err, vm, info) => {
    console.error('全局錯誤:', err)
    console.error('錯誤組件:', vm)
    console.error('錯誤信息:', info)

    if (import.meta.env.PROD) {
        // TODO: 添加生產環境錯誤日誌上報服務
    }
}

// 全局導航守衛
router.beforeEach(async (to, from, next) => {
    document.title = to.meta.title ? `${to.meta.title} - iLive商城` : 'iLive商城'

    const accessToken = localStorage.getItem('accessToken')
    const isAuthenticated = !!accessToken

    try {
        if (to.matched.some(record => record.meta.requiresAuth)) {
            if (!isAuthenticated) {
                next({
                    path: '/login',
                    query: { redirect: to.fullPath }
                })
                return
            }

            // TODO: 添加 token 驗證邏輯
            const user = JSON.parse(localStorage.getItem('user'))
            if (user && user.accessToken) {
                // 驗證 token
                try {
                    await axios.get('/users/verify-token')
                } catch (error) {
                    if (error.response?.status === 401) {
                        next('/login')
                        return
                    }
                }
            }
        }

        if (isAuthenticated && (to.name === 'Login' || to.name === 'Register')) {
            next({ name: 'Home' })
            return
        }

        next()
    } catch (error) {
        console.error('路由守衛錯誤:', error)
        next('/error')
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

// 全局組件註冊
import BaseButton from './components/common/BaseButton.vue'
import BaseInput from './components/common/BaseInput.vue'
app.component('BaseButton', BaseButton)
app.component('BaseInput', BaseInput)

// 全局指令註冊
app.directive('focus', {
    mounted: (el) => el.focus()
})

// 全局方法
app.config.globalProperties.$filters = {
    currency(value) {
        return `$${value.toFixed(2)}`
    },
    date(value) {
        return new Date(value).toLocaleDateString()
    }
}

// 初始化函數
const initializeApp = async () => {
    try {
        // 檢查並恢復用戶會話
        const accessToken = localStorage.getItem('accessToken')
        if (accessToken) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        }

        // 掛載應用
        app.mount('#app')
    } catch (error) {
        console.error('應用初始化失敗:', error)
    }
}

// 啟動應用
initializeApp()

// 導出實例（用於測試）
export { app, router }
