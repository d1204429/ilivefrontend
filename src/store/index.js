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
            version: import.meta.env.VITE_APP_VERSION || '1.0.0'
        }
    },

    mutations: {
        SET_LOADING(state, status) {
            state.loading = status
        },
        SET_ERROR(state, error) {
            state.error = typeof error === 'string' ? { message: error, type: 'error' } : error
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
                lastUpdated: new Date().toISOString()
            }
        }
    },

    actions: {
        setLoading({ commit }, status) {
            commit('SET_LOADING', status)
        },

        setError({ commit }, { message, type = 'error', duration = 3000 }) {
            commit('SET_ERROR', { message, type })
            if (duration > 0) {
                setTimeout(() => {
                    commit('CLEAR_ERROR')
                }, duration)
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

        async initializeApp({ commit, dispatch }) {
            commit('SET_LOADING', true)

            try {
                // 監聽網路狀態
                window.addEventListener('online', () => {
                    commit('SET_SYSTEM_STATUS', { isOnline: true })
                    dispatch('showNotification', {
                        message: '網路連接已恢復',
                        type: 'success'
                    })
                })

                window.addEventListener('offline', () => {
                    commit('SET_SYSTEM_STATUS', { isOnline: false })
                    dispatch('showNotification', {
                        message: '網路連接已斷開',
                        type: 'warning'
                    })
                })

                // 檢查認證狀態
                const token = localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)
                const refreshToken = localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY)

                if (token && refreshToken) {
                    try {
                        await dispatch('auth/checkAuth')
                        await dispatch('cart/fetchCartItems')
                    } catch (error) {
                        console.error('認證檢查失敗:', error)
                        await dispatch('auth/logout')
                    }
                }

                // 檢查系統狀態
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
                const response = await fetch('/api/v1/system/health')
                const status = await response.json()

                commit('SET_SYSTEM_STATUS', status)

                if (status.maintenance) {
                    dispatch('showNotification', {
                        message: '系統維護中，部分功能可能無法使用',
                        type: 'warning',
                        duration: 0
                    })
                }
            } catch (error) {
                console.error('系統狀態檢查失敗:', error)
                commit('SET_SYSTEM_STATUS', {
                    healthy: false,
                    error: error.message
                })
            }
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
        systemStatus: state => state.systemStatus
    }
})
