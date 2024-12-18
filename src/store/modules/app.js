// src/store/modules/app.js

export default {
    namespaced: true,

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
            state.error = {
                show: true,
                message: error.message || '發生錯誤',
                type: error.type || 'error',
                timestamp: new Date().toISOString()
            }
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
        },
        SET_LAST_API_CALL(state) {
            state.lastApiCall = new Date().toISOString()
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
        clearNotification({ commit }) {
            commit('CLEAR_NOTIFICATION')
        },
        initializeApp({ commit, dispatch }) {
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
}
