import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import store from './store'
import { BootstrapVue3 } from 'bootstrap-vue-3'
import axios from './utils/axios'

// 樣式引入
import './assets/base.css'
import './assets/main.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css'
import '@fortawesome/fontawesome-free/css/all.css'

// 創建應用實例
const app = createApp(App)
const pinia = createPinia()

// 註冊核心插件
app.use(store)
app.use(pinia)
app.use(router)
app.use(BootstrapVue3)

// Axios 全局配置
app.config.globalProperties.$axios = axios
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL
axios.defaults.timeout = 5000
axios.defaults.withCredentials = true

// 註冊全局組件
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'

app.component('BaseButton', BaseButton)
app.component('BaseInput', BaseInput)
app.component('BaseModal', BaseModal)
app.component('BaseLoading', BaseLoading)
app.component('BaseAlert', BaseAlert)

// 全局過濾器
app.config.globalProperties.$filters = {
    currency: (value) => {
        if (!value) return '$0.00'
        return `$${parseFloat(value).toFixed(2)}`
    },
    date: (value) => {
        if (!value) return ''
        return new Date(value).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    },
    time: (value) => {
        if (!value) return ''
        return new Date(value).toLocaleTimeString('zh-TW')
    },
    datetime: (value) => {
        if (!value) return ''
        return new Date(value).toLocaleString('zh-TW')
    }
}

// 全局錯誤處理
app.config.errorHandler = (err, vm, info) => {
    console.error('全局錯誤:', err)
    store.dispatch('app/setError', {
        message: err.message,
        type: 'error',
        stack: import.meta.env.DEV ? err.stack : null,
        info: import.meta.env.DEV ? info : null
    })
}

// 全局性能監控
if (import.meta.env.DEV) {
    app.config.performance = true
}

// API 請求攔截器
axios.interceptors.request.use(
    config => {
        store.dispatch('app/setLoading', true)
        const token = localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
    },
    error => {
        store.dispatch('app/setLoading', false)
        return Promise.reject(error)
    }
)

// API 響應攔截器
axios.interceptors.response.use(
    response => {
        store.dispatch('app/setLoading', false)
        return response
    },
    error => {
        store.dispatch('app/setLoading', false)
        handleApiError(error)
        return Promise.reject(error)
    }
)

// API 錯誤處理
const handleApiError = (error) => {
    let message = '發生未知錯誤'
    let type = 'error'

    if (error.response) {
        const { status, data } = error.response
        switch (status) {
            case 401:
                message = '身份驗證已過期，請重新登入'
                store.dispatch('auth/logout')
                router.push('/login')
                break
            case 403:
                message = '無權限執行此操作'
                break
            case 404:
                message = '請求的資源不存在'
                break
            case 500:
                message = '伺服器錯誤，請稍後再試'
                break
            default:
                message = data.message || `錯誤代碼：${status}`
        }
    } else if (error.request) {
        message = '網路連接失敗，請檢查網路設定'
        type = 'warning'
    }

    store.dispatch('app/setError', { message, type })
}

// 初始化應用
const initializeApp = async () => {
    try {
        // 檢查認證狀態
        const token = localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        if (token) {
            await store.dispatch('auth/checkAuth')
        }

        // 初始化必要的數據
        await Promise.all([
            store.dispatch('app/initializeApp'),
            store.dispatch('product/fetchCategories')
        ])

        // 網路狀態監聽
        window.addEventListener('online', () => {
            store.dispatch('app/updateOnlineStatus', true)
            store.dispatch('app/setSuccess', {
                message: '網路連接已恢復',
                duration: 2000
            })
        })

        window.addEventListener('offline', () => {
            store.dispatch('app/updateOnlineStatus', false)
            store.dispatch('app/setError', {
                message: '網路連接已斷開',
                type: 'warning',
                duration: 0
            })
        })

        // 掛載應用
        app.mount('#app')

    } catch (error) {
        console.error('應用初始化失敗:', error)
        store.dispatch('app/setError', {
            message: '應用初始化失敗，請重新整理頁面',
            type: 'error',
            duration: 0
        })
    }
}

// 啟動應用
initializeApp()

// 開發環境日誌
if (import.meta.env.DEV) {
    console.log('應用配置:', {
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
        appVersion: import.meta.env.VITE_APP_VERSION,
        environment: import.meta.env.MODE
    })
}

export { app, router, store, pinia }
