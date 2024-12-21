// src/store/modules/app.js

const state = {
    loading: false,
    error: null,
    success: null,
    notification: null,
    systemStatus: {
        isOnline: navigator.onLine,
        maintenance: false,
        version: import.meta.env.VITE_APP_VERSION || '1.0.0'
    }
}

const mutations = {
    SET_LOADING(state, status) {
        state.loading = status
    },
    SET_ERROR(state, error) {
        state.error = error ? {
            message: typeof error === 'string' ? error : error?.message || '發生錯誤',
            type: error?.type || 'error',
            timestamp: new Date().toISOString()
        } : null
    },
    SET_SUCCESS(state, message) {
        state.success = message ? {
            message,
            timestamp: new Date().toISOString()
        } : null
    },
    SET_NOTIFICATION(state, notification) {
        state.notification = notification ? {
            ...notification,
            timestamp: new Date().toISOString()
        } : null
    },
    UPDATE_SYSTEM_STATUS(state, { isOnline, maintenance }) {
        state.systemStatus = {
            ...state.systemStatus,
            isOnline: isOnline ?? state.systemStatus.isOnline,
            maintenance: maintenance ?? state.systemStatus.maintenance
        }
    }
}

const actions = {
    setLoading({ commit }, status) {
        commit('SET_LOADING', status)
    },

    setError({ commit, dispatch }, { message, type = 'error', duration = 3000 }) {
        commit('SET_ERROR', { message, type })
        if (duration > 0) {
            setTimeout(() => {
                dispatch('clearError')
            }, duration)
        }
    },

    setSuccess({ commit, dispatch }, { message, duration = 3000 }) {
        commit('SET_SUCCESS', message)
        if (duration > 0) {
            setTimeout(() => {
                dispatch('clearSuccess')
            }, duration)
        }
    },

    clearError({ commit }) {
        commit('SET_ERROR', null)
    },

    clearSuccess({ commit }) {
        commit('SET_SUCCESS', null)
    },

    showNotification({ commit, dispatch }, { message, type = 'info', duration = 3000 }) {
        commit('SET_NOTIFICATION', { message, type })
        if (duration > 0) {
            setTimeout(() => {
                dispatch('clearNotification')
            }, duration)
        }
    },

    clearNotification({ commit }) {
        commit('SET_NOTIFICATION', null)
    },

    updateOnlineStatus({ commit, dispatch }, isOnline) {
        commit('UPDATE_SYSTEM_STATUS', { isOnline })
        dispatch('showNotification', {
            message: isOnline ? '網路連接已恢復' : '網路連接已斷開',
            type: isOnline ? 'success' : 'warning'
        })
    },

    async initializeApp({ dispatch }) {
        window.addEventListener('online', () => dispatch('updateOnlineStatus', true))
        window.addEventListener('offline', () => dispatch('updateOnlineStatus', false))

        try {
            await dispatch('checkSystemStatus')
        } catch (error) {
            console.error('初始化失敗:', error)
        }
    },

    async checkSystemStatus({ commit, dispatch }) {
        try {
            const response = await fetch('/api/v1/system/status')
            const status = await response.json()

            commit('UPDATE_SYSTEM_STATUS', {
                maintenance: !status.healthy
            })

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
}

const getters = {
    isLoading: state => state.loading,
    error: state => state.error,
    success: state => state.success,
    notification: state => state.notification,
    systemStatus: state => state.systemStatus,
    isOnline: state => state.systemStatus.isOnline,
    isMaintenance: state => state.systemStatus.maintenance,
    systemVersion: state => state.systemStatus.version
}

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
}
