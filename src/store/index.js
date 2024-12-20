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
            state.error = typeof error === 'string' ? { message: error } : error
        },
        SET_SUCCESS(state, message) {
            state.success = { message, timestamp: new Date().toISOString() }
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
                ...status
            }
        }
    },

    actions: {
        setLoading({ commit }, status) {
            commit('SET_LOADING', status)
        },

        setError({ commit }, error) {
            commit('SET_ERROR', error)
            setTimeout(() => {
                commit('CLEAR_ERROR')
            }, 3000)
        },

        setSuccess({ commit }, message) {
            commit('SET_SUCCESS', message)
            setTimeout(() => {
                commit('CLEAR_SUCCESS')
            }, 3000)
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
            if (token) {
                try {
                    await dispatch('auth/checkAuth')
                    await dispatch('cart/fetchCartItems')
                } catch (error) {
                    dispatch('auth/logout')
                }
            }

            // 檢查系統狀態
            dispatch('checkSystemStatus')
        },

        async checkSystemStatus({ commit, dispatch }) {
            try {
                const response = await fetch('/api/v1/system/health')
                const status = await response.json()

                commit('SET_SYSTEM_STATUS', status)

                if (!status.healthy) {
                    dispatch('showNotification', {
                        message: '系統維護中，部分功能可能無法使用',
                        type: 'warning',
                        duration: 0
                    })
                }
            } catch (error) {
                console.error('系統狀態檢查失敗:', error)
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
        hasNotification: state => !!state.notification
    }
})
