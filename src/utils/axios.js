import axios from 'axios'
import router from '@/router'
import store from '@/store'
import { handleError } from '@/utils/errorHandler'

// Token相關常量
const TOKEN_CONFIG = {
    ACCESS_TOKEN_KEY: import.meta.env.VITE_JWT_TOKEN_KEY,
    REFRESH_TOKEN_KEY: import.meta.env.VITE_JWT_REFRESH_KEY,
    TOKEN_PREFIX: 'Bearer',
    REFRESH_INTERVAL: parseInt(import.meta.env.VITE_TOKEN_REFRESH_INTERVAL) || 900000
}

// API配置常量
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

// 請求重試配置
const RETRY_CONFIG = {
    maxRetries: parseInt(import.meta.env.VITE_REQUEST_RETRY_COUNT) || 3,
    retryDelay: parseInt(import.meta.env.VITE_REQUEST_RETRY_DELAY) || 1000,
    retryCondition: (error) => {
        return (
            error.code === 'ECONNABORTED' ||
            error.response?.status === 408 ||
            error.response?.status === 429 ||
            error.response?.status >= 500
        )
    }
}

// 創建axios實例
const api = axios.create(API_CONFIG)

// 請求隊列和刷新標記
let isRefreshing = false
let refreshSubscribers = []

// Token管理器
const tokenManager = {
    getAccessToken: () => localStorage.getItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY),
    getRefreshToken: () => localStorage.getItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY),
    setTokens: (accessToken, refreshToken) => {
        localStorage.setItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY, accessToken)
        localStorage.setItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY, refreshToken)
    },
    removeTokens: () => {
        localStorage.removeItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY)
        localStorage.removeItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY)
    }
}

// 處理請求隊列
const processQueue = (error, token = null) => {
    refreshSubscribers.forEach(callback => {
        if (error) {
            callback.reject(error)
        } else {
            callback.resolve(token)
        }
    })
    refreshSubscribers = []
}

// 請求攔截器
api.interceptors.request.use(
    async config => {
        if (!config.hideLoading) {
            store.dispatch('app/setLoading', true)
        }

        const token = tokenManager.getAccessToken()
        if (token && !config.skipAuth) {
            config.headers.Authorization = `${TOKEN_CONFIG.TOKEN_PREFIX} ${token}`
        }

        if (config.method?.toLowerCase() === 'get' && !config.noCache) {
            config.params = { ...config.params, _t: Date.now() }
        }

        config.metadata = { startTime: Date.now() }
        config.requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`

        const source = axios.CancelToken.source()
        config.cancelToken = source.token
        config._cancelSource = source

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
        if (!response.config.hideLoading) {
            store.dispatch('app/setLoading', false)
        }
        return response.data
    },
    async error => {
        if (!error.config?.hideLoading) {
            store.dispatch('app/setLoading', false)
        }

        const originalRequest = error.config

        // 處理401錯誤和token刷新
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
                if (!refreshToken) throw new Error('No refresh token available')

                const response = await api.post('/users/refresh-token',
                    { refreshToken },
                    { skipAuth: true }
                )

                if (response?.accessToken && response?.refreshToken) {
                    tokenManager.setTokens(response.accessToken, response.refreshToken)
                    api.defaults.headers.common.Authorization =
                        `${TOKEN_CONFIG.TOKEN_PREFIX} ${response.accessToken}`

                    processQueue(null, response.accessToken)
                    originalRequest.headers.Authorization =
                        `${TOKEN_CONFIG.TOKEN_PREFIX} ${response.accessToken}`
                    return api(originalRequest)
                } else {
                    throw new Error('Invalid token refresh response')
                }
            } catch (refreshError) {
                processQueue(refreshError, null)
                await handleAuthError()
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        // 處理請求重試
        if (shouldRetryRequest(error)) {
            return handleRequestRetry(error)
        }

        return Promise.reject(error)
    }
)

// 處理認證錯誤
const handleAuthError = async () => {
    tokenManager.removeTokens()
    await store.dispatch('auth/logout')
    router.push({
        path: '/login',
        query: {
            redirect: router.currentRoute.value.fullPath,
            error: 'session_expired'
        }
    })
}

// 判斷是否應該重試請求
const shouldRetryRequest = (error) => {
    const retryCount = error.config._retryCount || 0
    return retryCount < RETRY_CONFIG.maxRetries && RETRY_CONFIG.retryCondition(error)
}

// 處理請求重試
const handleRequestRetry = (error) => {
    const config = error.config
    config._retryCount = (config._retryCount || 0) + 1

    const delayTime = config._retryCount * RETRY_CONFIG.retryDelay

    return new Promise(resolve => {
        setTimeout(() => resolve(api(config)), delayTime)
    })
}

export default api
