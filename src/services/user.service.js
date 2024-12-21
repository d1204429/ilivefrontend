import { createStore } from 'vuex'
import auth from './modules/auth'
import cart from './modules/cart'
import product from './modules/product'
import user from './modules/user'
import order from './modules/order'
import app from './modules/app'

// 自動註冊所有模組
const requireModule = require.context('./modules', false, /\.js$/)
const modules = {}

requireModule.keys().forEach(fileName => {
    if (fileName === './index.js') return
    const moduleName = fileName.replace(/(\.\/|\.js)/g, '')
    modules[moduleName] = {
        namespaced: true,
        ...requireModule(fileName).default
    }
})

const store = createStore({
    modules: {
        auth,
        cart,
        product,
        user,
        order,
        app
    },

    state: {
        loading: false,
        error: null,
        success: null,
        notification: null,
        systemStatus: {
            isOnline: navigator.onLine,
            maintenance: false,
            version: import.meta.env.VITE_APP_VERSION || '1.0.0',
            lastChecked: null,
            healthy: true,
            services: {
                api: true,
                database: true,
                cache: true
            }
        },
        theme: localStorage.getItem('theme') || 'light',
        language: localStorage.getItem('language') || 'zh-TW'
    },

    mutations: {
        SET_LOADING(state, status) {
            state.loading = status
        },
        SET_ERROR(state, error) {
            state.error = typeof error === 'string' ? {
                message: error,
                type: 'error',
                timestamp: new Date().toISOString()
            } : {
                ...error,
                timestamp: new Date().toISOString()
            }
        },
        SET_SUCCESS(state, message) {
            state.success = {
                message,
                type: 'success',
                timestamp: new Date().toISOString()
            }
        },
        CLEAR_ERROR(state) {
            state.error = null
        },
        CLEAR_SUCCESS(state) {
            state.success = null
        },
        SET_NOTIFICATION(state, notification) {
            state.notification = {
                ...notification,
                id: Date.now(),
                timestamp: new Date().toISOString()
            }
        },
        CLEAR_NOTIFICATION(state) {
            state.notification = null
        },
        SET_SYSTEM_STATUS(state, status) {
            state.systemStatus = {
                ...state.systemStatus,
                ...status,
                lastChecked: new Date().toISOString()
            }
        },
        SET_THEME(state, theme) {
            state.theme = theme
            localStorage.setItem('theme', theme)
            document.documentElement.setAttribute('data-theme', theme)
        },
        SET_LANGUAGE(state, language) {
            state.language = language
            localStorage.setItem('language', language)
            document.documentElement.setAttribute('lang', language)
        },
        RESET_STATE(state) {
            Object.assign(state, {
                loading: false,
                error: null,
                success: null,
                notification: null,
                systemStatus: {
                    isOnline: navigator.onLine,
                    maintenance: false,
                    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
                    lastChecked: null,
                    healthy: true,
                    services: {
                        api: true,
                        database: true,
                        cache: true
                    }
                }
            })
        }
    },

    actions: {
        async initializeApp({ commit, dispatch }) {
            commit('SET_LOADING', true)
            try {
                // 檢查系統狀態
                await dispatch('checkSystemStatus')

                // 檢查認證狀態
                const token = localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)
                if (token) {
                    await dispatch('auth/checkAuth')
                }

                // 設置網路狀態監聽
                window.addEventListener('online', () => dispatch('handleOnline'))
                window.addEventListener('offline', () => dispatch('handleOffline'))

                return true
            } catch (error) {
                console.error('系統初始化失敗:', error)
                dispatch('setError', {
                    message: '系統初始化失敗',
                    type: 'error'
                })
                return false
            } finally {
                commit('SET_LOADING', false)
            }
        },

        async checkSystemStatus({ commit, dispatch }) {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/system/health`)
                if (!response.ok) {
                    throw new Error('健康檢查失敗')
                }
                const status = await response.json()

                commit('SET_SYSTEM_STATUS', {
                    ...status,
                    isOnline: true,
                    healthy: true
                })

                if (status.maintenance) {
                    dispatch('showNotification', {
                        message: '系統維護中',
                        type: 'warning',
                        duration: 0
                    })
                }
            } catch (error) {
                commit('SET_SYSTEM_STATUS', {
                    healthy: false,
                    error: error.message
                })
                throw error
            }
        },

        handleOnline({ commit, dispatch }) {
            commit('SET_SYSTEM_STATUS', { isOnline: true })
            dispatch('showNotification', {
                message: '網路連接已恢復',
                type: 'success',
                duration: 3000
            })
            dispatch('checkSystemStatus')
        },

        handleOffline({ commit, dispatch }) {
            commit('SET_SYSTEM_STATUS', { isOnline: false })
            dispatch('showNotification', {
                message: '網路連接已斷開',
                type: 'warning',
                duration: 0
            })
        },

        setLoading({ commit }, status) {
            commit('SET_LOADING', status)
        },

        setError({ commit }, error) {
            commit('SET_ERROR', error)
        },

        setSuccess({ commit }, message) {
            commit('SET_SUCCESS', message)
        },

        showNotification({ commit }, notification) {
            commit('SET_NOTIFICATION', notification)
            if (notification.duration > 0) {
                setTimeout(() => {
                    commit('CLEAR_NOTIFICATION')
                }, notification.duration)
            }
        },

        clearError({ commit }) {
            commit('CLEAR_ERROR')
        },

        clearSuccess({ commit }) {
            commit('CLEAR_SUCCESS')
        },

        clearNotification({ commit }) {
            commit('CLEAR_NOTIFICATION')
        },

        setTheme({ commit }, theme) {
            commit('SET_THEME', theme)
        },

        setLanguage({ commit }, language) {
            commit('SET_LANGUAGE', language)
        },

        resetState({ commit }) {
            commit('RESET_STATE')
        }
    },

    getters: {
        isLoading: state => state.loading,
        error: state => state.error,
        success: state => state.success,
        notification: state => state.notification,
        systemStatus: state => state.systemStatus,
        isOnline: state => state.systemStatus.isOnline,
        isMaintenance: state => state.systemStatus.maintenance,
        isHealthy: state => state.systemStatus.healthy,
        currentTheme: state => state.theme,
        currentLanguage: state => state.language,
        appVersion: state => state.systemStatus.version,
        hasError: state => !!state.error,
        hasSuccess: state => !!state.success,
        hasNotification: state => !!state.notification
    }
})

export default store
