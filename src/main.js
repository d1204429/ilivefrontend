import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import axios from './utils/axios'
import './assets/base.css'
import './assets/main.css'

// 引入 Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'

// 引入 Font Awesome
import '@fortawesome/fontawesome-free/css/all.css'

const app = createApp(App)

// 配置全局屬性
app.config.globalProperties.$axios = axios

// 使用插件
app.use(createPinia())
app.use(router)

// 全局錯誤處理
app.config.errorHandler = (err, vm, info) => {
    console.error('全局錯誤:', err)
    console.error('錯誤組件:', vm)
    console.error('錯誤信息:', info)
}

// 全局導航守衛
router.beforeEach((to, from, next) => {
    const isAuthenticated = localStorage.getItem('token')

    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!isAuthenticated) {
            next({
                path: '/login',
                query: { redirect: to.fullPath }
            })
        } else {
            next()
        }
    } else {
        next()
    }
})

// 掛載應用
app.mount('#app')

// 全局 API 配置
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL
axios.defaults.timeout = import.meta.env.VITE_API_TIMEOUT

// 開發環境配置
if (import.meta.env.DEV) {
    console.log('開發環境')
    app.config.devtools = true
}

// 生產環境配置
if (import.meta.env.PROD) {
    console.log('生產環境')
    app.config.devtools = false
}
