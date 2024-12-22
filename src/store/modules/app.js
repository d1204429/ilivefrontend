// src/store/modules/app.js
import { handleError } from '@/utils/errorHandler'

const NOTIFICATION_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
}

const DEFAULT_DURATIONS = {
    ERROR: 5000,
    SUCCESS: 3000,
    WARNING: 4000,
    INFO: 3000
}

const state = {
    loading: {
        status: false,
        count: 0
    },
    error: null,
    success: null,
    notification: null,
    systemStatus: {
        isOnline: navigator.onLine,
        maintenance: false,
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        lastChecked: null,
        features: {}
    }
}

const mutations = {
    SET_LOADING(state, status) {
        if (status) {
            state.loading.count++
        } else if (state.loading.count > 0) {
            state.loading.count--
        }
        state.loading.status = state.loading.count > 0
    },

    RESET_LOADING(state) {
        state.loading.count = 0
        state.loading.status = false
    },

    SET_ERROR(state, error) {
        state.error = error ? {
            message: typeof error === 'string' ? error : error?.message || '系統發生錯誤',
            type: error?.type || NOTIFICATION_TYPES.ERROR,
            code: error?.code,
            timestamp: new Date().toISOString(),
            details: error?.details || null
        } : null
    },

    SET_SUCCESS(state, data) {
        state.success = data ? {
            message: typeof data === 'string' ? data : data.message,
            type: NOTIFICATION_TYPES.SUCCESS,
            timestamp: new Date().toISOString(),
            details: data?.details || null
        } : null
    },

    SET_NOTIFICATION(state, notification) {
        state.notification = notification ? {
            ...notification,
            id: `notification-${Date.now()}`,
            timestamp: new Date().toISOString()
        } : null
    },

    UPDATE_SYSTEM_STATUS(state, payload) {
        state.systemStatus = {
            ...state.systemStatus,
            ...payload,
            lastChecked: new Date().toISOString()
        }
    }
}

const actions = {
    setLoading({ commit }, status) {
        commit('SET_LOADING', status)
    },

    resetLoading({ commit }) {
        commit('RESET_LOADING')
    },

    setError({ commit, dispatch }, payload) {
        const { message, type = NOTIFICATION_TYPES.ERROR, duration = DEFAULT_DURATIONS.ERROR, ...rest } = payload
        commit('SET_ERROR', { message, type, ...rest })

        if (duration > 0) {
            setTimeout(() => {
                dispatch('clearError')
            }, duration)
        }
    },

    setSuccess({ commit, dispatch }, payload) {
        const { message, duration = DEFAULT_DURATIONS.SUCCESS, ...rest } = payload
        commit('SET_SUCCESS', { message, ...rest })

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

    showNotification({ commit, dispatch }, payload) {
        const { message, type = NOTIFICATION_TYPES.INFO, duration = DEFAULT_DURATIONS[type.toUpperCase()] } = payload

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
            type: isOnline ? NOTIFICATION_TYPES.SUCCESS : NOTIFICATION_TYPES.WARNING,
            duration: DEFAULT_DURATIONS[isOnline ? 'SUCCESS' : 'WARNING']
        })
    },

    async initializeApp({ dispatch }) {
        window.addEventListener('online', () => dispatch('updateOnlineStatus', true))
        window.addEventListener('offline', () => dispatch('updateOnlineStatus', false))

        try {
            await dispatch('checkSystemStatus')
            await dispatch('checkFeatureFlags')
        } catch (error) {
            console.error('應用程式初始化失敗:', error)
            handleError(error)
        }
    },

    async checkSystemStatus({ commit, dispatch }) {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/system/status`)
            const status = await response.json()

            commit('UPDATE_SYSTEM_STATUS', {
                maintenance: !status.healthy,
                features: status.features || {}
            })

            if (!status.healthy) {
                dispatch('showNotification', {
                    message: '系統維護中，部分功能可能無法使用',
                    type: NOTIFICATION_TYPES.WARNING,
                    duration: 0
                })
            }
        } catch (error) {
            console.error('系統狀態檢查失敗:', error)
            commit('UPDATE_SYSTEM_STATUS', {
                maintenance: true
            })
            handleError(error)
        }
    },

    async checkFeatureFlags({ commit }) {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/features`)
            const features = await response.json()
            commit('UPDATE_SYSTEM_STATUS', { features })
        } catch (error) {
            console.error('功能標記檢查失敗:', error)
        }
    }
}

const getters = {
    isLoading: state => state.loading.status,
    loadingCount: state => state.loading.count,
    error: state => state.error,
    success: state => state.success,
    notification: state => state.notification,
    systemStatus: state => state.systemStatus,
    isOnline: state => state.systemStatus.isOnline,
    isMaintenance: state => state.systemStatus.maintenance,
    systemVersion: state => state.systemStatus.version,
    lastStatusCheck: state => state.systemStatus.lastChecked,
    getFeatureFlag: state => (featureKey) => state.systemStatus.features[featureKey] || false
}

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
}
