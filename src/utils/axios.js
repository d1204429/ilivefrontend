import axios from 'axios'
import router from '@/router'
import store from '@/store'
import { handleError, AppError, ErrorTypes } from '@/utils/errorHandler'

// Token 配置
const TOKEN_CONFIG = {
    ACCESS_TOKEN_KEY: import.meta.env.VITE_JWT_TOKEN_KEY || 'access_token',
    REFRESH_TOKEN_KEY: import.meta.env.VITE_JWT_REFRESH_KEY || 'refresh_token',
    TOKEN_PREFIX: 'Bearer',
    REFRESH_INTERVAL: parseInt(import.meta.env.VITE_TOKEN_REFRESH_INTERVAL) || 900000,
    TOKEN_EXPIRED_CODE: 'TOKEN_EXPIRED'
}

// API 基礎配置
const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:1988/api/v1',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
    withCredentials: true,
    validateStatus: status => status >= 200 && status < 300
}

// 重試配置
const RETRY_CONFIG = {
    maxRetries: parseInt(import.meta.env.VITE_REQUEST_RETRY_COUNT) || 3,
    retryDelay: parseInt(import.meta.env.VITE_REQUEST_RETRY_DELAY) || 1000,
    shouldRetry: (error) => {
        return (
            error.code === 'ECONNABORTED' ||
            error.response?.status === 408 ||
            error.response?.status === 429 ||
            error.response?.status >= 500
        )
    }
}

// 創建 axios 實例
const api = axios.create(API_CONFIG)

// 請求隊列管理
const requestManager = {
    isRefreshing: false,
    refreshSubscribers: [],
    pendingRequests: new Map(),

    addPendingRequest(config) {
        const requestId = this.generateRequestId(config)
        const source = axios.CancelToken.source()
        this.pendingRequests.set(requestId, source)
        return { requestId, source }
    },

    removePendingRequest(requestId) {
        this.pendingRequests.delete(requestId)
    },

    generateRequestId(config) {
        return `${config.method}-${config.url}-${JSON.stringify(config.params || {})}-${JSON.stringify(config.data || {})}`
    },

    cancelPendingRequests() {
        this.pendingRequests.forEach(source => {
            source.cancel('Request cancelled due to new request')
        })
        this.pendingRequests.clear()
    },

    addRefreshSubscriber(callback) {
        this.refreshSubscribers.push(callback)
    },

    clearRefreshSubscribers(error = null) {
        this.refreshSubscribers.forEach(callback => {
            if (error) {
                callback.reject(error)
            } else {
                callback.resolve()
            }
        })
        this.refreshSubscribers = []
    }
}

// Token 管理
const tokenManager = {
    getAccessToken() {
        return localStorage.getItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY)
    },

    getRefreshToken() {
        return localStorage.getItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY)
    },

    setTokens(accessToken, refreshToken) {
        if (accessToken) {
            localStorage.setItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY, accessToken)
            api.defaults.headers.common.Authorization = `${TOKEN_CONFIG.TOKEN_PREFIX} ${accessToken}`
        }
        if (refreshToken) {
            localStorage.setItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY, refreshToken)
        }
    },

    clearTokens() {
        localStorage.removeItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY)
        localStorage.removeItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY)
        delete api.defaults.headers.common.Authorization
    },

    isTokenValid(token) {
        if (!token) return false
        try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            return payload.exp * 1000 > Date.now()
        } catch {
            return false
        }
    }
}

// 請求攔截器
api.interceptors.request.use(
    async config => {
        if (!config.hideLoading) {
            store.dispatch('app/setLoading', true)
        }

        const { requestId, source } = requestManager.addPendingRequest(config)
        config.requestId = requestId
        config.cancelToken = source.token

        if (!config.skipAuth) {
            const token = tokenManager.getAccessToken()
            if (token) {
                if (!tokenManager.isTokenValid(token)) {
                    try {
                        await store.dispatch('auth/refreshToken')
                    } catch (error) {
                        throw new AppError('登入已過期，請重新登入', ErrorTypes.AUTH)
                    }
                }
                config.headers.Authorization = `${TOKEN_CONFIG.TOKEN_PREFIX} ${tokenManager.getAccessToken()}`
            }
        }

        if (config.method?.toLowerCase() === 'get' && !config.noCache) {
            config.params = { ...config.params, _t: Date.now() }
        }

        return config
    },
    error => {
        store.dispatch('app/setLoading', false)
        return Promise.reject(error)
    }
)

// 響應攔截器
api.interceptors.response.use(
    response => {
        requestManager.removePendingRequest(response.config.requestId)

        if (!response.config.hideLoading) {
            store.dispatch('app/setLoading', false)
        }

        return response.data
    },
    async error => {
        if (error.config) {
            requestManager.removePendingRequest(error.config.requestId)
        }

        if (!error.config?.hideLoading) {
            store.dispatch('app/setLoading', false)
        }

        if (axios.isCancel(error)) {
            return Promise.reject(new AppError('請求已取消', ErrorTypes.REQUEST_CANCELLED))
        }

        const originalRequest = error.config

        // 處理 401 錯誤和 token 刷新
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (requestManager.isRefreshing) {
                return new Promise((resolve, reject) => {
                    requestManager.addRefreshSubscriber({ resolve, reject })
                }).then(() => api(originalRequest))
            }

            originalRequest._retry = true
            requestManager.isRefreshing = true

            try {
                const refreshToken = tokenManager.getRefreshToken()
                if (!refreshToken) {
                    throw new AppError('無效的刷新令牌', ErrorTypes.AUTH)
                }

                const response = await api.post('/auth/refresh-token',
                    { refreshToken },
                    { skipAuth: true }
                )

                if (response?.accessToken) {
                    tokenManager.setTokens(response.accessToken, response.refreshToken)
                    requestManager.clearRefreshSubscribers()
                    return api(originalRequest)
                }

                throw new AppError('Token 更新失敗', ErrorTypes.AUTH)
            } catch (error) {
                requestManager.clearRefreshSubscribers(error)
                await handleAuthError()
                throw error
            } finally {
                requestManager.isRefreshing = false
            }
        }

        // 處理請求重試
        if (RETRY_CONFIG.shouldRetry(error) &&
            (!originalRequest._retryCount || originalRequest._retryCount < RETRY_CONFIG.maxRetries)) {
            originalRequest._retryCount = (originalRequest._retryCount || 0) + 1

            return new Promise(resolve => {
                setTimeout(() => {
                    resolve(api(originalRequest))
                }, originalRequest._retryCount * RETRY_CONFIG.retryDelay)
            })
        }

        throw handleError(error)
    }
)

// 處理認證錯誤
const handleAuthError = async () => {
    tokenManager.clearTokens()
    await store.dispatch('auth/logout')

    const currentRoute = router.currentRoute.value
    if (currentRoute.path !== '/login') {
        router.push({
            path: '/login',
            query: {
                redirect: currentRoute.fullPath,
                error: 'session_expired'
            }
        })
    }
}

export default api
