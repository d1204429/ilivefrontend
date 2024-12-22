import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import store from './store'
import { BootstrapVue3 } from 'bootstrap-vue-3'
import axios from './utils/axios'
import { handleError } from '@/utils/errorHandler'

// 樣式引入
import './assets/base.css'
import './assets/main.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css'
import '@fortawesome/fontawesome-free/css/all.css'

// 基礎組件
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'

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
axios.defaults.timeout = parseInt(import.meta.env.VITE_REQUEST_TIMEOUT) || 15000
axios.defaults.withCredentials = true
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'

// 註冊全局組件
const baseComponents = {
    BaseButton,
    BaseInput,
    BaseModal,
    BaseLoading,
    BaseAlert
}

Object.entries(baseComponents).forEach(([name, component]) => {
    app.component(name, component)
})

// 全局過濾器
const filters = {
    currency: (value, currency = 'TWD') => {
        if (!value) return 'NT$0'
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency
        }).format(value)
    },
    date: (value, format = 'long') => {
        if (!value) return ''
        const options = {
            year: 'numeric',
            month: format === 'short' ? 'short' : 'long',
            day: 'numeric'
        }
        return new Date(value).toLocaleDateString('zh-TW', options)
    },
    time: (value, format = '24') => {
        if (!value) return ''
        const options = {
            hour: 'numeric',
            minute: 'numeric',
            hour12: format === '12'
        }
        return new Date(value).toLocaleTimeString('zh-TW', options)
    },
    datetime: (value, format = 'long') => {
        if (!value) return ''
        return `${filters.date(value, format)} ${filters.time(value)}`
    }
}

app.config.globalProperties.$filters = filters

// 全局錯誤處理
app.config.errorHandler = (err, vm, info) => {
    console.error('全局錯誤:', err)
    handleError(err, {
        component: vm?.$options?.name || 'Unknown',
        info,
        isDev: import.meta.env.DEV
    })
}

// 全局性能監控
if (import.meta.env.DEV) {
    app.config.performance = true
    const { performance } = window

    router.beforeEach((to, from, next) => {
        performance.mark(`${to.name}-start`)
        next()
    })

    router.afterEach((to) => {
        performance.mark(`${to.name}-end`)
        performance.measure(
            `路由 ${to.name}`,
            `${to.name}-start`,
            `${to.name}-end`
        )
    })
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
            store.dispatch('product/fetchCategories'),
            store.dispatch('cart/initializeCart')
        ])

        // 網路狀態監聽
        const handleOnlineStatus = (online) => {
            store.dispatch('app/updateOnlineStatus', online)
            const message = online ? '網路連接已恢復' : '網路連接已斷開'
            const type = online ? 'success' : 'warning'
            store.dispatch('app/setNotification', {
                message,
                type,
                duration: online ? 2000 : 0
            })
        }

        window.addEventListener('online', () => handleOnlineStatus(true))
        window.addEventListener('offline', () => handleOnlineStatus(false))

        // 會話活動監控
        let activityTimeout
        const resetActivityTimer = () => {
            clearTimeout(activityTimeout)
            activityTimeout = setTimeout(() => {
                store.dispatch('auth/logout', { reason: 'inactivity' })
            }, parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 3600000)
        }

        ['mousemove', 'keypress', 'click', 'touchstart'].forEach(event => {
            window.addEventListener(event, resetActivityTimer)
        })

        // 掛載應用
        app.mount('#app')

        // 開發環境日誌
        if (import.meta.env.DEV) {
            console.log('應用配置:', {
                apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
                appVersion: import.meta.env.VITE_APP_VERSION,
                environment: import.meta.env.MODE,
                timeout: axios.defaults.timeout,
                sessionTimeout: import.meta.env.VITE_SESSION_TIMEOUT
            })
        }

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

export { app, router, store, pinia }
