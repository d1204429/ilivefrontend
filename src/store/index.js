import { createStore } from 'vuex'
import auth from './modules/auth'
import cart from './modules/cart'
import product from './modules/product'
import user from './modules/user'
import order from './modules/order'
import app from './modules/app'

export default createStore({
    modules: {
        app,
        auth,
        cart,
        product,
        user,
        order
    },

    state: {
        loading: false,
        error: null,
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
            state.error = error
        },
        CLEAR_ERROR(state) {
            state.error = null
        },
        SET_NOTIFICATION(state, notification) {
            state.notification = {
                ...notification,
                id: Date.now()
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
        showNotification({ commit }, { message, type = 'info', duration = 3000 }) {
            commit('SET_NOTIFICATION', { message, type })
            setTimeout(() => {
                commit('CLEAR_NOTIFICATION')
            }, duration)
        },
        initializeApp({ commit, dispatch }) {
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

            // 初始化認證狀態
            if (localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)) {
                dispatch('auth/checkAuth')
            }

            // 初始化購物車
            dispatch('cart/fetchCartItems')
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

    getters: {
        isLoading: state => state.loading,
        error: state => state.error,
        notification: state => state.notification,
        isOnline: state => state.systemStatus.isOnline,
        isMaintenance: state => state.systemStatus.maintenance,
        systemVersion: state => state.systemStatus.version
    }
})
