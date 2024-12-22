import axios from 'axios'
import router from '@/router'
import store from '@/store'
import { handleError } from '@/utils/errorHandler'

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
            axios.isCancel(error) ||
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
let isRefreshing = false
const refreshSubscribers = []
const pendingRequests = new Map()

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
        }
        if (refreshToken) {
            localStorage.setItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY, refreshToken)
        }
    },
    clearTokens() {
        localStorage.removeItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY)
        localStorage.removeItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY)
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

// 請求隊列處理
const handleQueue = (error, token = null) => {
    refreshSubscribers.forEach(callback => {
        if (error) {
            callback.reject(error)
        } else {
            callback.resolve(token)
        }
    })
    refreshSubscribers.length = 0
}

// 請求攔截器
api.interceptors.request.use(
    async config => {
        // 請求開始時設置 loading
        if (!config.hideLoading) {
            store.dispatch('app/setLoading', true)
        }

        // 設置請求標識
        const requestId = `${config.method}-${config.url}-${JSON.stringify(config.params || {})}-${JSON.stringify(config.data || {})}`
        config.requestId = requestId

        // 取消重複請求
        if (pendingRequests.has(requestId)) {
            pendingRequests.get(requestId).cancel('重複請求已取消')
        }

        // 創建取消令牌
        const source = axios.CancelToken.source()
        config.cancelToken = source.token
        pendingRequests.set(requestId, source)

        // 添加 token
        if (!config.skipAuth) {
            const token = tokenManager.getAccessToken()
            if (token && tokenManager.isTokenValid(token)) {
                config.headers.Authorization = `${TOKEN_CONFIG.TOKEN_PREFIX} ${token}`
            }
        }

        // GET 請求添加時間戳防止緩存
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
        // 移除請求標識
        pendingRequests.delete(response.config.requestId)

        // 關閉 loading
        if (!response.config.hideLoading) {
            store.dispatch('app/setLoading', false)
        }

        return response.data
    },
    async error => {
        // 移除請求標識
        if (error.config) {
            pendingRequests.delete(error.config.requestId)
        }

        // 關閉 loading
        if (!error.config?.hideLoading) {
            store.dispatch('app/setLoading', false)
        }

        // 處理取消的請求
        if (axios.isCancel(error)) {
            return Promise.reject(error)
        }

        const originalRequest = error.config

        // 處理 401 錯誤
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                try {
                    const token = await new Promise((resolve, reject) => {
                        refreshSubscribers.push({ resolve, reject })
                    })
                    originalRequest.headers.Authorization = `${TOKEN_CONFIG.TOKEN_PREFIX} ${token}`
                    return api(originalRequest)
                } catch (err) {
                    return Promise.reject(err)
                }
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                const refreshToken = tokenManager.getRefreshToken()
                if (!refreshToken) {
                    throw new Error('No refresh token available')
                }

                const response = await api.post('/auth/refresh-token',
                    { refreshToken },
                    { skipAuth: true }
                )

                if (response?.accessToken) {
                    tokenManager.setTokens(response.accessToken, response.refreshToken)
                    api.defaults.headers.common.Authorization = `${TOKEN_CONFIG.TOKEN_PREFIX} ${response.accessToken}`

                    handleQueue(null, response.accessToken)
                    originalRequest.headers.Authorization = `${TOKEN_CONFIG.TOKEN_PREFIX} ${response.accessToken}`
                    return api(originalRequest)
                } else {
                    throw new Error('Invalid token refresh response')
                }
            } catch (refreshError) {
                handleQueue(refreshError)
                await handleAuthError()
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        // 處理請求重試
        if (RETRY_CONFIG.shouldRetry(error) && (!originalRequest._retryCount || originalRequest._retryCount < RETRY_CONFIG.maxRetries)) {
            originalRequest._retryCount = (originalRequest._retryCount || 0) + 1
            const delay = originalRequest._retryCount * RETRY_CONFIG.retryDelay

            return new Promise(resolve => {
                setTimeout(() => resolve(api(originalRequest)), delay)
            })
        }

        // 處理其他錯誤
        handleError(error)
        return Promise.reject(error)
    }
)

// 處理認證錯誤
const handleAuthError = async () => {
    tokenManager.clearTokens()
    await store.dispatch('auth/logout')
    router.push({
        path: '/login',
        query: {
            redirect: router.currentRoute.value.fullPath,
            error: 'session_expired'
        }
    })
}

export default api
