import { createStore } from 'vuex'
import auth from './modules/auth'
import cart from './modules/cart'
import product from './modules/product'
import user from './modules/user'
import order from './modules/order'

export default createStore({
    state: {
        loading: false,
        error: null,
        notification: null,
        globalLoading: false,
        lastApiCall: null,
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
        SET_GLOBAL_LOADING(state, status) {
            state.globalLoading = status
        },
        SET_ERROR(state, error) {
            state.error = error
            state.lastApiCall = new Date().toISOString()
        },
        CLEAR_ERROR(state) {
            state.error = null
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
        },
        UPDATE_ONLINE_STATUS(state, isOnline) {
            state.systemStatus.isOnline = isOnline
        }
    },

    actions: {
        setLoading({ commit }, status) {
            commit('SET_LOADING', status)
        },
        setGlobalLoading({ commit }, status) {
            commit('SET_GLOBAL_LOADING', status)
        },
        setError({ commit, dispatch }, error) {
            commit('SET_ERROR', error)
            dispatch('showNotification', {
                message: error.message || '發生錯誤',
                type: 'error'
            })
            setTimeout(() => {
                commit('CLEAR_ERROR')
            }, 3000)
        },
        clearError({ commit }) {
            commit('CLEAR_ERROR')
        },
        showNotification({ commit }, { message, type = 'info', duration = 3000 }) {
            commit('SET_NOTIFICATION', { message, type })
            setTimeout(() => {
                commit('CLEAR_NOTIFICATION')
            }, duration)
        },
        initializeApp({ commit, dispatch }) {
            // 監聽網路狀態
            window.addEventListener('online', () => {
                commit('UPDATE_ONLINE_STATUS', true)
                dispatch('showNotification', {
                    message: '網路連接已恢復',
                    type: 'success'
                })
            })
            window.addEventListener('offline', () => {
                commit('UPDATE_ONLINE_STATUS', false)
                dispatch('showNotification', {
                    message: '網路連接已斷開',
                    type: 'warning'
                })
            })

            // 初始化各模組
            dispatch('auth/initializeAuth')
            dispatch('cart/initializeCart')
            dispatch('user/initializeUserData')
        },
        async checkSystemStatus({ commit }) {
            try {
                const response = await fetch('/api/v1/system/status')
                const status = await response.json()
                commit('SET_SYSTEM_STATUS', status)
            } catch (error) {
                console.error('系統狀態檢查失敗:', error)
            }
        }
    },

    modules: {
        auth,
        cart,
        product,
        user,
        order
    },

    getters: {
        isLoading: state => state.loading,
        isGlobalLoading: state => state.globalLoading,
        error: state => state.error,
        notification: state => state.notification,
        isOnline: state => state.systemStatus.isOnline,
        isMaintenance: state => state.systemStatus.maintenance,
        systemVersion: state => state.systemStatus.version,
        hasError: state => !!state.error,
        hasNotification: state => !!state.notification,
        lastApiCallTime: state => state.lastApiCall ? new Date(state.lastApiCall) : null
    }
})
