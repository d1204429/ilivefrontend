// src/store/modules/app.js
import { defineStore } from 'pinia'

// 使用 export default 導出 store
export default defineStore('app', {
    state: () => ({
        loading: false,
        error: null,
        success: null,
        notification: null,
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

        setError(error) {
            this.error = {
                message: typeof error === 'string' ? error : error?.message || '發生錯誤',
                type: error?.type || 'error',
                timestamp: new Date().toISOString()
            }

            setTimeout(() => {
                this.clearError()
            }, 3000)
        },

        setSuccess(message) {
            this.success = {
                message,
                timestamp: new Date().toISOString()
            }

            setTimeout(() => {
                this.clearSuccess()
            }, 3000)
        },

        clearError() {
            this.error = null
        },

        clearSuccess() {
            this.success = null
        },

        showNotification(options) {
            const { message, type = 'info', duration = 3000 } = options

            this.notification = {
                message,
                type,
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
            window.addEventListener('online', () => this.updateOnlineStatus(true))
            window.addEventListener('offline', () => this.updateOnlineStatus(false))

            try {
                await this.checkSystemStatus()
            } catch (error) {
                console.error('初始化失敗:', error)
            }
        },

        async checkSystemStatus() {
            try {
                const response = await fetch('/api/v1/system/health')
                const status = await response.json()

                if (!status.healthy) {
                    this.systemStatus.maintenance = true
                    this.showNotification({
                        message: '系統維護中，部分功能可能無法使用',
                        type: 'warning'
                    })
                }
            } catch (error) {
                console.error('系統狀態檢查失敗:', error)
            }
        }
    },

    getters: {
        isLoading: (state) => state.loading,
        currentError: (state) => state.error,
        currentSuccess: (state) => state.success,
        currentNotification: (state) => state.notification,
        isOnline: (state) => state.systemStatus.isOnline,
        isMaintenance: (state) => state.systemStatus.maintenance,
        systemVersion: (state) => state.systemStatus.version,
        hasError: (state) => !!state.error,
        hasSuccess: (state) => !!state.success,
        hasNotification: (state) => !!state.notification,
        errorMessage: (state) => state.error?.message || '',
        successMessage: (state) => state.success?.message || '',
        notificationMessage: (state) => state.notification?.message || ''
    }
})
