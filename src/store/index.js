import { createStore } from 'vuex'
import auth from './modules/auth'
import cart from './modules/cart'
import product from './modules/product'
import user from './modules/user'
import order from './modules/order'
import app from './modules/app'
import { handleError } from '@/utils/errorHandler'

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
            cache: true,
            payment: true,
            shipping: true
        },
        performance: {
            apiLatency: 0,
            loadTime: 0,
            resourceUsage: {}
        }
    },
    theme: localStorage.getItem('theme') || 'light',
    language: localStorage.getItem('language') || 'zh-TW',
    deviceInfo: {
        type: 'desktop',
        browser: navigator.userAgent,
        screenSize: {
            width: window.innerWidth,
            height: window.innerHeight
        }
    },
    cache: {
        products: new Map(),
        categories: new Map(),
        lastUpdated: null
    }
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
    state: {
        ...INITIAL_STATE
    },
    mutations: {
        SET_LOADING(state, status) {
            state.loading = status
        },
        SET_ERROR(state, error) {
            state.error = error
                ? {
                    message: typeof error === 'string' ? error : error.message || '發生錯誤',
                    type: error.type || 'error',
                    timestamp: new Date().toISOString(),
                    code: error.code,
                    details: error.details,
                    stack: import.meta.env.DEV ? error.stack : undefined
                }
                : null
        },
        SET_SUCCESS(state, message) {
            state.success = message
                ? { message, type: 'success', timestamp: new Date().toISOString() }
                : null
        },
        SET_NOTIFICATION(state, notification) {
            state.notification = notification
                ? { ...notification, id: Date.now(), timestamp: new Date().toISOString(), read: false }
                : null
        },
        SET_SYSTEM_STATUS(state, status) {
            state.systemStatus = { ...state.systemStatus, ...status, lastChecked: new Date().toISOString() }
        },
        UPDATE_SERVICE_STATUS(state, { service, status, details }) {
            state.systemStatus.services[service] = status
            if (details) {
                state.systemStatus.performance[service] = details
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
        UPDATE_DEVICE_INFO(state) {
            const width = window.innerWidth
            state.deviceInfo = {
                type: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop',
                browser: navigator.userAgent,
                screenSize: { width, height: window.innerHeight }
            }
        },
        SET_CACHE(state, { key, data }) {
            state.cache[key] = data
            state.cache.lastUpdated = new Date().toISOString()
        },
        CLEAR_CACHE(state, key) {
            if (key) {
                state.cache[key].clear()
            } else {
                Object.keys(state.cache).forEach(k => {
                    if (state.cache[k] instanceof Map) {
                        state.cache[k].clear()
                    }
                })
            }
        },
        RESET_STATE(state) {
            Object.assign(state, { ...INITIAL_STATE })
        }
    },

    actions: {
        async initializeApp({ commit, dispatch }) {
            commit('SET_LOADING', true)
            commit('UPDATE_DEVICE_INFO')
            try {
                const startTime = performance.now()
                await Promise.all([
                    dispatch('auth/checkAuth'),
                    dispatch('checkSystemStatus'),
                    dispatch('product/fetchCategories'),
                    dispatch('cart/fetchCartItems')
                ])
                const loadTime = performance.now() - startTime
                commit('UPDATE_SERVICE_STATUS', { service: 'performance', details: { loadTime } })

                // 事件監聽器
                window.addEventListener('online', () => dispatch('handleOnline'))
                window.addEventListener('offline', () => dispatch('handleOffline'))
                window.addEventListener('resize', () => commit('UPDATE_DEVICE_INFO'))

                return true
            } catch (error) {
                dispatch('setError', handleError(error))
                return false
            } finally {
                commit('SET_LOADING', false)
            }
        },

        async checkSystemStatus({ commit, dispatch }) {
            try {
                const startTime = performance.now()
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/system/health`)
                const status = await response.json()
                const apiLatency = performance.now() - startTime

                commit('SET_SYSTEM_STATUS', { ...status, isOnline: true, performance: { ...status.performance, apiLatency } })

                // 檢查各項服務狀態
                Object.entries(status.services || {}).forEach(([service, status]) => {
                    commit('UPDATE_SERVICE_STATUS', { service, status })
                })

                if (status.maintenance) {
                    dispatch('showNotification', { message: '系統維護中，部分功能可能無法使用', type: 'warning', duration: 0 })
                }
            } catch (error) {
                commit('SET_SYSTEM_STATUS', { healthy: false, error: error.message })
                throw error
            }
        },

        handleOnline({ commit, dispatch }) {
            commit('SET_SYSTEM_STATUS', { isOnline: true })
            dispatch('showNotification', { message: '網路連接已恢復', type: 'success', duration: 3000 })
            dispatch('checkSystemStatus')
        },

        handleOffline({ commit, dispatch }) {
            commit('SET_SYSTEM_STATUS', { isOnline: false })
            dispatch('showNotification', { message: '網路連接已斷開', type: 'warning', duration: 0 })
        },

        setLoading({ commit }, status) {
            commit('SET_LOADING', status)
        },

        setError({ commit }, error) {
            commit('SET_ERROR', error)
            if (error && !error.persistent) {
                setTimeout(() => commit('SET_ERROR', null), error.duration || 3000)
            }
        },

        setSuccess({ commit }, message) {
            commit('SET_SUCCESS', message)
            if (message) {
                setTimeout(() => commit('SET_SUCCESS', null), 3000)
            }
        },

        showNotification({ commit, state }, notification) {
            // 避免重複通知
            if (state.notification?.message === notification.message) return

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

        updateCache({ commit }, { key, data }) {
            commit('SET_CACHE', { key, data })
        },

        clearCache({ commit }, key) {
            commit('CLEAR_CACHE', key)
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

        serviceStatus: state => service => state.systemStatus.services[service],

        performance: state => state.systemStatus.performance,

        currentTheme: state => state.theme,

        currentLanguage: state => state.language,

        deviceInfo: state => state.deviceInfo,

        isMobile: state => state.deviceInfo.type === 'mobile',

        isTablet: state => state.deviceInfo.type === 'tablet',

        isDesktop: state => state.deviceInfo.type === 'desktop',

        appVersion: state => state.systemStatus.version,

        hasError: state => !!state.error,

        hasSuccess: state => !!state.success,

        hasNotification: state => !!state.notification,

        getCached: (state) => (key) => state.cache[key],

        cacheLastUpdated: (state) => state.cache.lastUpdated
    }
})
