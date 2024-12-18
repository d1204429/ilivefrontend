import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
    state: () => ({
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
    }),

    actions: {
        setLoading(status) {
            this.loading = status
        },

        setGlobalLoading(status) {
            this.globalLoading = status
        },

        setError(error) {
            this.error = {
                show: true,
                code: error?.code || '',
                message: error?.message || '發生錯誤',
                type: error?.type || 'error',
                timestamp: new Date().toISOString()
            }

            // 自動清除錯誤
            setTimeout(() => {
                this.clearError()
            }, 5000)
        },

        clearError() {
            this.error = null
        },

        showNotification({ message, type = 'info', duration = 3000 }) {
            // 先清除現有通知
            this.clearNotification()

            this.notification = {
                message,
                type,
                duration,
                id: Date.now(),
                timestamp: new Date().toISOString()
            }

            if (duration > 0) {
                setTimeout(() => {
                    this.clearNotification()
                }, duration)
            }
        },

        clearNotification() {
            this.notification = null
        },

        updateOnlineStatus(isOnline) {
            this.systemStatus.isOnline = isOnline
            this.showNotification({
                message: isOnline ? '網路連接已恢復' : '網路連接已斷開',
                type: isOnline ? 'success' : 'warning'
            })
        },

        async initializeApp() {
            // 監聽網路狀態
            window.addEventListener('online', () => this.updateOnlineStatus(true))
            window.addEventListener('offline', () => this.updateOnlineStatus(false))

            // 檢查系統狀態
            await this.checkSystemStatus()
        },

        async checkSystemStatus() {
            try {
                const response = await fetch('/api/v1/system/status')
                const status = await response.json()
                this.systemStatus = {
                    ...this.systemStatus,
                    ...status
                }
            } catch (error) {
                console.error('系統狀態檢查失敗:', error)
                this.setError({
                    message: '系統狀態檢查失敗',
                    type: 'error'
                })
            }
        },

        setLastApiCall() {
            this.lastApiCall = new Date().toISOString()
        }
    },

    getters: {
        isLoading: (state) => state.loading,
        isGlobalLoading: (state) => state.globalLoading,
        currentError: (state) => state.error,
        currentNotification: (state) => state.notification,
        isOnline: (state) => state.systemStatus.isOnline,
        isMaintenance: (state) => state.systemStatus.maintenance,
        systemVersion: (state) => state.systemStatus.version,
        hasError: (state) => !!state.error,
        hasNotification: (state) => !!state.notification,
        lastApiCallTime: (state) => state.lastApiCall ? new Date(state.lastApiCall) : null,
        errorMessage: (state) => state.error?.message || '',
        notificationMessage: (state) => state.notification?.message || ''
    }
})
