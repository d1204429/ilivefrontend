import store from '@/store'
import router from '@/router'

export const ErrorTypes = {
    VALIDATION: 'VALIDATION_ERROR',
    AUTH: 'AUTH_ERROR',
    NETWORK: 'NETWORK_ERROR',
    SERVER: 'SERVER_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR',
    BUSINESS: 'BUSINESS_ERROR',
    TIMEOUT: 'TIMEOUT_ERROR',
    PERMISSION: 'PERMISSION_ERROR',
    RATE_LIMIT: 'RATE_LIMIT_ERROR',
    DATABASE: 'DATABASE_ERROR',
    API: 'API_ERROR',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',
    REQUEST_CANCELLED: 'REQUEST_CANCELLED',
    LOGIN_FAILED: 'LOGIN_FAILED'
}

const ERROR_STATUS_MAP = {
    400: {
        type: ErrorTypes.VALIDATION,
        message: '請求參數錯誤，請檢查輸入內容'
    },
    401: {
        type: ErrorTypes.AUTH,
        message: '登入已過期，請重新登入',
        retryable: true,
        redirect: '/login'
    },
    403: {
        type: ErrorTypes.PERMISSION,
        message: '您沒有權限執行此操作',
        redirect: '/403'
    },
    404: {
        type: ErrorTypes.API,
        message: '請求的資源不存在',
        redirect: '/404'
    },
    422: {
        type: ErrorTypes.VALIDATION,
        message: '輸入資料驗證失敗'
    },
    429: {
        type: ErrorTypes.RATE_LIMIT,
        message: '請求過於頻繁，請稍後再試',
        retryable: true
    },
    500: {
        type: ErrorTypes.SERVER,
        message: '系統發生錯誤，請稍後再試',
        redirect: '/500',
        retryable: true
    },
    502: {
        type: ErrorTypes.NETWORK,
        message: '網路連線異常，請稍後再試',
        redirect: '/500',
        retryable: true
    },
    503: {
        type: ErrorTypes.SERVER,
        message: '系統維護中，請稍後再試',
        redirect: '/500',
        retryable: true
    },
    504: {
        type: ErrorTypes.TIMEOUT,
        message: '請求超時，請稍後再試',
        retryable: true
    }
}

export const handleError = async (error) => {
    let errorInfo = {
        type: ErrorTypes.UNKNOWN,
        message: '系統發生未知錯誤',
        statusCode: null,
        details: null,
        shouldRedirect: false,
        redirectPath: '',
        retryable: false,
        timestamp: new Date().toISOString(),
        requestId: error.config?.requestId || generateErrorId()
    }

    try {
        if (error.response) {
            errorInfo = handleResponseError(error)
        } else if (error.request) {
            errorInfo = handleNetworkError(error)
        } else if (error instanceof AppError) {
            errorInfo = handleAppError(error)
        } else {
            errorInfo = handleUnknownError(error)
        }

        if (errorInfo.type === ErrorTypes.AUTH) {
            const handled = await handleAuthError(error)
            if (handled) return null
        }

        if (!error.config?.skipErrorLog) {
            const errorLog = await logError({
                ...errorInfo,
                error,
                url: window.location.href,
                user: store.getters['auth/currentUser']
            })
            errorInfo.logId = errorLog.id
        }

        showErrorMessage(errorInfo.message, errorInfo.type)

        if (errorInfo.shouldRedirect) {
            await handleRedirect(errorInfo.redirectPath)
        }

        return errorInfo
    } catch (handlingError) {
        console.error('Error handling failed:', handlingError)
        return {
            type: ErrorTypes.UNKNOWN,
            message: '錯誤處理失敗',
            originalError: error,
            handlingError
        }
    }
}

const handleResponseError = (error) => {
    const { status, data } = error.response
    const errorConfig = ERROR_STATUS_MAP[status] || {
        type: ErrorTypes.UNKNOWN,
        message: `系統錯誤 (${status})`
    }

    const message = data?.message || errorConfig.message
    const details = typeof data === 'string' ? { message: data } : data

    return {
        type: errorConfig.type,
        message,
        statusCode: status,
        details,
        shouldRedirect: !!errorConfig.redirect,
        redirectPath: errorConfig.redirect,
        retryable: errorConfig.retryable || status >= 500 || status === 429,
        requestId: error.config?.requestId || generateErrorId()
    }
}

const handleNetworkError = (error) => {
    if (error.code === 'ECONNABORTED') {
        return {
            type: ErrorTypes.TIMEOUT,
            message: '網路連線逾時，請檢查網路狀態後重試',
            retryable: true,
            requestId: error.config?.requestId || generateErrorId()
        }
    }

    return {
        type: ErrorTypes.NETWORK,
        message: '網路連線失敗，請檢查網路設定',
        retryable: true,
        requestId: error.config?.requestId || generateErrorId()
    }
}

const handleAppError = (error) => {
    return {
        type: error.type,
        message: error.message,
        details: error.data,
        retryable: false,
        timestamp: error.timestamp,
        requestId: error.requestId || generateErrorId()
    }
}

const handleUnknownError = (error) => {
    return {
        type: ErrorTypes.UNKNOWN,
        message: error.message || '發生未知錯誤',
        retryable: false,
        requestId: generateErrorId()
    }
}

const handleAuthError = async (error) => {
    const currentPath = router.currentRoute.value.path
    if (currentPath === '/login') return false

    const refreshToken = localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY)
    if (!refreshToken) {
        await handleTokenRefreshFailure()
        return false
    }

    if (!error.config?._retry) {
        try {
            error.config._retry = true
            await store.dispatch('auth/refreshToken', refreshToken)
            return true
        } catch (refreshError) {
            console.error('Token refresh failed:', refreshError)
            await handleTokenRefreshFailure()
        }
    }

    return false
}

const handleTokenRefreshFailure = async () => {
    await store.dispatch('auth/logout')
    await handleRedirect('/login')
}

const handleRedirect = async (path) => {
    if (!path || router.currentRoute.value.path === path) return

    const query = path === '/login' ? {
        redirect: encodeURIComponent(router.currentRoute.value.fullPath),
        timestamp: Date.now()
    } : undefined

    try {
        await router.push({ path, query })
    } catch (navigationError) {
        console.error('Navigation failed:', navigationError)
    }
}

const showErrorMessage = (message, type) => {
    const duration = getDurationByErrorType(type)
    store.dispatch('app/setError', {
        message,
        type,
        duration
    }).catch(console.error)
}

const getDurationByErrorType = (type) => {
    const durations = {
        [ErrorTypes.VALIDATION]: 5000,
        [ErrorTypes.AUTH]: 3000,
        [ErrorTypes.NETWORK]: 4000,
        [ErrorTypes.SERVER]: 3000,
        [ErrorTypes.RATE_LIMIT]: 4000,
        default: parseInt(import.meta.env.VITE_ERROR_SHOW_DURATION) || 3000
    }
    return durations[type] || durations.default
}

export const logError = async (errorInfo) => {
    const logData = {
        id: generateErrorId(),
        timestamp: new Date().toISOString(),
        ...errorInfo,
        userAgent: navigator.userAgent,
        stack: errorInfo.error?.stack,
        response: errorInfo.error?.response?.data,
        request: {
            url: errorInfo.error?.config?.url,
            method: errorInfo.error?.config?.method,
            params: errorInfo.error?.config?.params,
            data: errorInfo.error?.config?.data
        },
        user: store.getters['auth/currentUser']
    }

    if (import.meta.env.DEV) {
        console.group('Error Details')
        console.error('Error Type:', errorInfo.type)
        console.error('Error Message:', errorInfo.message)
        console.error('Status Code:', errorInfo.statusCode)
        console.error('Full Error:', logData)
        console.groupEnd()
    }

    if (import.meta.env.PROD) {
        try {
            await reportErrorToServer(logData)
        } catch (reportError) {
            console.error('Error reporting failed:', reportError)
        }
    }

    return logData
}

const generateErrorId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const reportErrorToServer = async (errorData) => {
    const apiUrl = import.meta.env.VITE_ERROR_REPORT_URL
    if (!apiUrl) return null

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${store.getters['auth/accessToken']}`
            },
            body: JSON.stringify(errorData)
        })
        return response.json()
    } catch (error) {
        console.error('Error reporting failed:', error)
        return null
    }
}

export class AppError extends Error {
    constructor(message, type = ErrorTypes.UNKNOWN, data = null) {
        super(message)
        this.name = 'AppError'
        this.type = type
        this.data = data
        this.timestamp = new Date().toISOString()
        this.requestId = generateErrorId()

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError)
        }
    }

    setRequestId(requestId) {
        this.requestId = requestId
        return this
    }
}

export default {
    handleError,
    logError,
    ErrorTypes,
    AppError
}
