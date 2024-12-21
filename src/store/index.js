import { createStore } from 'vuex'
import auth from './modules/auth'
import cart from './modules/cart'
import product from './modules/product'
import user from './modules/user'
import order from './modules/order'
import app from './modules/app'

// Constants
const INITIAL_STATE = {
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
}

// Store Configuration
export default createStore({
    modules: {
        auth,
        cart,
        product,
        user,
        order,
        app
    },

    state: { ...INITIAL_STATE },

    mutations: {
        SET_LOADING(state, status) {
            state.loading = status
        },
        SET_ERROR(state, error) {
            state.error = error ? {
                message: typeof error === 'string' ? error : error.message || '發生錯誤',
                type: error.type || 'error',
                timestamp: new Date().toISOString(),
                code: error.code,
                details: error.details
            } : null
        },
        SET_SUCCESS(state, message) {
            state.success = message ? {
                message,
                type: 'success',
                timestamp: new Date().toISOString()
            } : null
        },
        SET_NOTIFICATION(state, notification) {
            state.notification = notification ? {
                ...notification,
                id: Date.now(),
                timestamp: new Date().toISOString()
            } : null
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
            Object.assign(state, { ...INITIAL_STATE })
        }
    },

    actions: {
        async initializeApp({ commit, dispatch }) {
            commit('SET_LOADING', true)

            try {
                await Promise.all([
                    dispatch('auth/checkAuth'),
                    dispatch('checkSystemStatus'),
                    dispatch('product/fetchCategories'),
                    dispatch('cart/fetchCartItems')
                ])

                window.addEventListener('online', () => dispatch('handleOnline'))
                window.addEventListener('offline', () => dispatch('handleOffline'))

                return true
            } catch (error) {
                dispatch('setError', {
                    message: '系統初始化失敗',
                    type: 'error',
                    details: error.message
                })
                return false
            } finally {
                commit('SET_LOADING', false)
            }
        },

        async checkSystemStatus({ commit, dispatch }) {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/system/health`)
                const status = await response.json()

                commit('SET_SYSTEM_STATUS', {
                    ...status,
                    isOnline: true
                })

                if (status.maintenance) {
                    dispatch('showNotification', {
                        message: '系統維護中，部分功能可能無法使用',
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
            if (error) {
                setTimeout(() => commit('SET_ERROR', null), 3000)
            }
        },

        setSuccess({ commit }, message) {
            commit('SET_SUCCESS', message)
            if (message) {
                setTimeout(() => commit('SET_SUCCESS', null), 3000)
            }
        },

        showNotification({ commit }, notification) {
            commit('SET_NOTIFICATION', notification)
            if (notification?.duration !== 0) {
                setTimeout(() => commit('SET_NOTIFICATION', null), notification?.duration || 3000)
            }
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
