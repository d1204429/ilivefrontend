import { createStore } from 'vuex'
import auth from './modules/auth'
import cart from './modules/cart'
import product from './modules/product'
import user from './modules/user'
import order from './modules/order'

export default createStore({
    modules: {
        auth,
        cart,
        product,
        user,
        order
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
        }
    },

    actions: {
        setLoading({ commit }, status) {
            commit('SET_LOADING', status)
        },

        setError({ commit, dispatch }, { message, type = 'error', duration = 3000 }) {
            commit('SET_ERROR', { message, type })
            if (duration > 0) {
                setTimeout(() => {
                    commit('CLEAR_ERROR')
                }, duration)
            }
            // 記錄錯誤
            if (type === 'error') {
                console.error('Error:', message)
            }
        },

        setSuccess({ commit }, { message, duration = 3000 }) {
            commit('SET_SUCCESS', message)
            if (duration > 0) {
                setTimeout(() => {
                    commit('CLEAR_SUCCESS')
                }, duration)
            }
        },

        showNotification({ commit }, { message, type = 'info', duration = 3000 }) {
            commit('SET_NOTIFICATION', { message, type })
            if (duration > 0) {
                setTimeout(() => {
                    commit('CLEAR_NOTIFICATION')
                }, duration)
            }
        },

        async initializeApp({ commit, dispatch, state }) {
            commit('SET_LOADING', true)

            try {
                // 網路狀態監聽
                window.addEventListener('online', () => {
                    commit('SET_SYSTEM_STATUS', { isOnline: true })
                    dispatch('showNotification', {
                        message: '網路連接已恢復',
                        type: 'success'
                    })
                    dispatch('checkSystemStatus')
                })

                window.addEventListener('offline', () => {
                    commit('SET_SYSTEM_STATUS', { isOnline: false })
                    dispatch('showNotification', {
                        message: '網路連接已斷開',
                        type: 'warning'
                    })
                })

                // 主題初始化
                document.documentElement.setAttribute('data-theme', state.theme)
                document.documentElement.setAttribute('lang', state.language)

                // 認證檢查
                const token = localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)
                const refreshToken = localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY)

                if (token && refreshToken) {
                    try {
                        await dispatch('auth/checkAuth')
                        await Promise.all([
                            dispatch('cart/fetchCartItems'),
                            dispatch('user/fetchProfile')
                        ])
                    } catch (error) {
                        console.error('認證檢查失敗:', error)
                        await dispatch('auth/logout')
                    }
                }

                await dispatch('checkSystemStatus')

            } catch (error) {
                console.error('應用程式初始化失敗:', error)
                dispatch('setError', {
                    message: '系統初始化失敗，請重新整理頁面',
                    type: 'error',
                    duration: 0
                })
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
                    isOnline: true,
                    lastChecked: new Date().toISOString()
                })

                if (status.maintenance) {
                    dispatch('showNotification', {
                        message: '系統維護中，部分功能可能無法使用',
                        type: 'warning',
                        duration: 0
                    })
                }

                // 檢查服務狀態
                if (!status.services.api || !status.services.database) {
                    dispatch('setError', {
                        message: '系統服務異常，請稍後再試',
                        type: 'error',
                        duration: 0
                    })
                }
            } catch (error) {
                console.error('系統狀態檢查失敗:', error)
                commit('SET_SYSTEM_STATUS', {
                    healthy: false,
                    error: error.message,
                    lastChecked: new Date().toISOString()
                })
            }
        },

        setTheme({ commit }, theme) {
            commit('SET_THEME', theme)
        },

        setLanguage({ commit }, language) {
            commit('SET_LANGUAGE', language)
        }
    },

    getters: {
        isLoading: state => state.loading,
        error: state => state.error,
        success: state => state.success,
        notification: state => state.notification,
        isOnline: state => state.systemStatus.isOnline,
        isMaintenance: state => state.systemStatus.maintenance,
        systemVersion: state => state.systemStatus.version,
        hasError: state => !!state.error,
        hasSuccess: state => !!state.success,
        hasNotification: state => !!state.notification,
        systemStatus: state => state.systemStatus,
        lastChecked: state => state.systemStatus.lastChecked,
        currentTheme: state => state.theme,
        currentLanguage: state => state.language,
        isSystemHealthy: state => state.systemStatus.healthy &&
            state.systemStatus.services.api &&
            state.systemStatus.services.database
    }
})
