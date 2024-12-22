// src/utils/errorHandler.js
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
    API: 'API_ERROR'
}

export const handleError = async (error) => {
    let errorMessage = ''
    let errorType = ErrorTypes.UNKNOWN
    let shouldRedirect = false
    let redirectPath = ''
    let statusCode = null
    let errorDetails = null

    try {
        if (error.response) {
            const { status, data } = error.response
            statusCode = status
            errorDetails = data

            switch (status) {
                case 400:
                    errorType = ErrorTypes.VALIDATION
                    errorMessage = data.message || '請求參數錯誤，請檢查輸入內容'
                    break

                case 401:
                    errorType = ErrorTypes.AUTH
                    errorMessage = data.message || '身份驗證已過期，請重新登入'
                    if (!error.config?.skipAuthError) {
                        await handleAuthError(error)
                    }
                    break

                case 403:
                    errorType = ErrorTypes.PERMISSION
                    errorMessage = data.message || '您沒有權限執行此操作'
                    shouldRedirect = true
                    redirectPath = '/403'
                    break

                case 404:
                    errorType = ErrorTypes.API
                    errorMessage = data.message || '請求的資源不存在'
                    shouldRedirect = true
                    redirectPath = '/404'
                    break

                case 422:
                    errorType = ErrorTypes.VALIDATION
                    errorMessage = formatValidationErrors(data.errors) || '輸入資料驗證失敗'
                    break

                case 429:
                    errorType = ErrorTypes.RATE_LIMIT
                    errorMessage = data.message || '請求過於頻繁，請稍後再試'
                    break

                case 500:
                    errorType = ErrorTypes.SERVER
                    errorMessage = '伺服器內部錯誤，請稍後再試'
                    shouldRedirect = true
                    redirectPath = '/500'
                    break

                case 502:
                    errorType = ErrorTypes.NETWORK
                    errorMessage = '網路閘道錯誤，請稍後再試'
                    shouldRedirect = true
                    redirectPath = '/500'
                    break

                case 503:
                    errorType = ErrorTypes.SERVER
                    errorMessage = '服務暫時不可用，請稍後再試'
                    shouldRedirect = true
                    redirectPath = '/500'
                    break

                case 504:
                    errorType = ErrorTypes.TIMEOUT
                    errorMessage = '網關超時，請稍後再試'
                    break

                default:
                    errorType = ErrorTypes.UNKNOWN
                    errorMessage = data?.message || `系統錯誤 (${status})`
            }
        } else if (error.code === 'ECONNABORTED') {
            errorType = ErrorTypes.TIMEOUT
            errorMessage = '請求超時，請檢查網路連接並重試'
        } else if (error.code === 'ERR_NETWORK') {
            errorType = ErrorTypes.NETWORK
            errorMessage = '網路連線失敗，請檢查網路設定'
        } else if (error instanceof AppError) {
            errorType = error.type
            errorMessage = error.message
            errorDetails = error.data
        } else {
            errorType = ErrorTypes.UNKNOWN
            errorMessage = error.message || '發生未知錯誤'
        }

        const errorLog = await logError({
            type: errorType,
            message: errorMessage,
            error,
            statusCode,
            details: errorDetails,
            url: window.location.href
        })

        if (!error.config?.skipErrorMessage) {
            showErrorMessage(errorMessage, errorType)
        }

        if (shouldRedirect && !error.config?.skipRedirect) {
            await handleRedirect(redirectPath)
        }

        return {
            type: errorType,
            message: errorMessage,
            statusCode,
            details: errorDetails,
            logId: errorLog.id
        }
    } catch (handlingError) {
        console.error('Error handling failed:', handlingError)
        return {
            type: ErrorTypes.UNKNOWN,
            message: '錯誤處理失敗',
            originalError: error
        }
    }
}

const handleAuthError = async (error) => {
    const currentPath = router.currentRoute.value.path
    if (currentPath === '/login') return

    const refreshToken = localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY)
    if (refreshToken && !error.config?._retry) {
        try {
            error.config._retry = true
            await store.dispatch('auth/refreshToken', refreshToken)
            return
        } catch (refreshError) {
            console.error('Token refresh failed:', refreshError)
        }
    }

    await store.dispatch('auth/logout')
    await handleRedirect('/login')
}

const handleRedirect = async (path) => {
    if (!path || router.currentRoute.value.path === path) return

    try {
        await router.push({
            path,
            query: path === '/login' ? {
                redirect: encodeURIComponent(router.currentRoute.value.fullPath),
                timestamp: Date.now()
            } : undefined
        })
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
        default: import.meta.env.VITE_ERROR_SHOW_DURATION || 3000
    }
    return durations[type] || durations.default
}

const formatValidationErrors = (errors) => {
    if (!errors) return null
    if (typeof errors === 'string') return errors
    if (Array.isArray(errors)) return errors.filter(Boolean).join('、')

    return typeof errors === 'object'
        ? Object.values(errors).flat().filter(Boolean).join('、')
        : null
}

export const logError = async (errorInfo) => {
    const { type, message, error, statusCode, details, url } = errorInfo

    const logData = {
        id: generateErrorId(),
        timestamp: new Date().toISOString(),
        type,
        message,
        statusCode,
        url,
        userAgent: navigator.userAgent,
        stack: error?.stack,
        details,
        response: error?.response?.data,
        request: {
            url: error?.config?.url,
            method: error?.config?.method,
            params: error?.config?.params,
            data: error?.config?.data
        }
    }

    console.group('Error Details')
    console.error('Error Type:', type)
    console.error('Error Message:', message)
    console.error('Status Code:', statusCode)
    console.error('Full Error:', logData)
    console.groupEnd()

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
    // 實作錯誤上報邏輯
    const apiUrl = `${import.meta.env.VITE_API_URL}/api/v1/error-logs`
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(errorData)
        })
        return response.json()
    } catch (error) {
        console.error('Error reporting failed:', error)
    }
}

export class AppError extends Error {
    constructor(message, type = ErrorTypes.UNKNOWN, data = null) {
        super(message)
        this.name = 'AppError'
        this.type = type
        this.data = data
        this.timestamp = new Date().toISOString()

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError)
        }
    }
}

export default {
    handleError,
    logError,
    ErrorTypes,
    AppError
}
