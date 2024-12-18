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

// Vuex store 必須最先使用
app.use(store)
app.use(createPinia())
app.use(router)
app.use(BootstrapVue3)

// Axios 配置
app.config.globalProperties.$axios = axios
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1988/api/v1'
axios.defaults.timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '15000')
axios.defaults.withCredentials = false

// 全局錯誤處理
app.config.errorHandler = (err, vm, info) => {
    console.error('全局錯誤:', err)
    store.commit('app/SET_ERROR', {
        message: err.message,
        stack: import.meta.env.DEV ? err.stack : null
    })
}

// 全局組件註冊
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
app.component('BaseButton', BaseButton)
app.component('BaseInput', BaseInput)

// 全局方法
app.config.globalProperties.$filters = {
    currency: (value) => `$${value.toFixed(2)}`,
    date: (value) => new Date(value).toLocaleDateString()
}

// 初始化應用
const initializeApp = async () => {
    try {
        const accessToken = localStorage.getItem('accessToken')
        if (accessToken) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
            await store.dispatch('auth/initializeAuth')
        }
        app.mount('#app')
    } catch (error) {
        console.error('應用初始化失敗:', error)
    }
}

initializeApp()

export { app, router, store }
