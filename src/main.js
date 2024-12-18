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

const app = createApp(App)
const pinia = createPinia()

// 註冊 Store
app.use(store)
app.use(pinia)
app.use(router)
app.use(BootstrapVue3)

// Axios 配置
app.config.globalProperties.$axios = axios
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL
axios.defaults.timeout = 5000
axios.defaults.withCredentials = true

// 全局錯誤處理
app.config.errorHandler = (err, vm, info) => {
    console.error('全局錯誤:', err)
    const appStore = pinia.state.value.app
    if (appStore) {
        appStore.setError({
            message: err.message,
            type: 'error',
            stack: import.meta.env.DEV ? err.stack : null
        })
    }
}

// 註冊全局組件
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
app.component('BaseButton', BaseButton)
app.component('BaseInput', BaseInput)

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
    }
}

// 初始化應用
const initializeApp = async () => {
    try {
        const token = localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

            // 初始化認證狀態
            await store.dispatch('auth/checkAuth')

            // 初始化應用狀態
            const appStore = pinia.state.value.app
            if (appStore) {
                await appStore.initializeApp()
            }
        }

        // 監聽網路狀態
        window.addEventListener('online', () => {
            const appStore = pinia.state.value.app
            if (appStore) {
                appStore.updateOnlineStatus(true)
            }
        })

        window.addEventListener('offline', () => {
            const appStore = pinia.state.value.app
            if (appStore) {
                appStore.updateOnlineStatus(false)
            }
        })

        app.mount('#app')
    } catch (error) {
        console.error('應用初始化失敗:', error)
        const appStore = pinia.state.value.app
        if (appStore) {
            appStore.setError({
                message: '應用初始化失敗',
                type: 'error'
            })
        }
    }
}

initializeApp()

export { app, router, store, pinia }
