import store from '@/store'
import router from '@/router'

// 錯誤類型常量
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
    TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED'
}

// 錯誤狀態碼映射
const ERROR_STATUS_MAP = {
    400: {
        type: ErrorTypes.VALIDATION,
        message: '請求參數錯誤，請檢查輸入內容'
    },
    401: {
        type: ErrorTypes.AUTH,
        message: '身份驗證已過期，請重新登入'
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
        message: '請求過於頻繁，請稍後再試'
    },
    500: {
        type: ErrorTypes.SERVER,
        message: '伺服器內部錯誤，請稍後再試',
        redirect: '/500'
    },
    502: {
        type: ErrorTypes.NETWORK,
        message: '網路閘道錯誤，請稍後再試',
        redirect: '/500'
    },
    503: {
        type: ErrorTypes.SERVER,
        message: '服務暫時不可用，請稍後再試',
        redirect: '/500'
    },
    504: {
        type: ErrorTypes.TIMEOUT,
        message: '網關超時，請稍後再試'
    }
}

// 錯誤處理器
export const handleError = async (error) => {
    let errorInfo = {
        type: ErrorTypes.UNKNOWN,
        message: '發生未知錯誤',
        statusCode: null,
        details: null,
        shouldRedirect: false,
        redirectPath: '',
        retryable: false
    }

    try {
        // 處理響應錯誤
        if (error.response) {
            errorInfo = handleResponseError(error)
        }
        // 處理網絡錯誤
        else if (error.request) {
            errorInfo = handleNetworkError(error)
        }
        // 處理業務邏輯錯誤
        else if (error instanceof AppError) {
            errorInfo = handleAppError(error)
        }
        // 處理其他錯誤
        else {
            errorInfo = handleUnknownError(error)
        }

        // 處理認證錯誤
        if (errorInfo.type === ErrorTypes.AUTH && !error.config?.skipAuthError) {
            await handleAuthError(error)
        }

        // 記錄錯誤
        const errorLog = await logError({
            ...errorInfo,
            error,
            url: window.location.href
        })

        // 顯示錯誤消息
        if (!error.config?.skipErrorMessage) {
            showErrorMessage(errorInfo.message, errorInfo.type)
        }

        // 處理重定向
        if (errorInfo.shouldRedirect && !error.config?.skipRedirect) {
            await handleRedirect(errorInfo.redirectPath)
        }

        return {
            ...errorInfo,
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

// 處理響應錯誤
const handleResponseError = (error) => {
    const { status, data } = error.response
    const errorConfig = ERROR_STATUS_MAP[status] || {
        type: ErrorTypes.UNKNOWN,
        message: `系統錯誤 (${status})`
    }

    return {
        type: errorConfig.type,
        message: data?.message || errorConfig.message,
        statusCode: status,
        details: data,
        shouldRedirect: !!errorConfig.redirect,
        redirectPath: errorConfig.redirect,
        retryable: status >= 500 || status === 429
    }
}

// 處理網絡錯誤
const handleNetworkError = (error) => {
    if (error.code === 'ECONNABORTED') {
        return {
            type: ErrorTypes.TIMEOUT,
            message: '請求超時，請檢查網路連接並重試',
            retryable: true
        }
    }

    return {
        type: ErrorTypes.NETWORK,
        message: '網路連線失敗，請檢查網路設定',
        retryable: true
    }
}

// 處理應用錯誤
const handleAppError = (error) => {
    return {
        type: error.type,
        message: error.message,
        details: error.data,
        retryable: false
    }
}

// 處理未知錯誤
const handleUnknownError = (error) => {
    return {
        type: ErrorTypes.UNKNOWN,
        message: error.message || '發生未知錯誤',
        retryable: false
    }
}

// 處理認證錯誤
const handleAuthError = async (error) => {
    const currentPath = router.currentRoute.value.path
    if (currentPath === '/login') return

    // 檢查是否可以刷新token
    const refreshToken = localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY)
    if (refreshToken && !error.config?._retry) {
        try {
            error.config._retry = true
            await store.dispatch('auth/refreshToken', refreshToken)
            return
        } catch (refreshError) {
            console.error('Token refresh failed:', refreshError)
            await handleTokenRefreshFailure()
        }
    } else {
        await handleTokenRefreshFailure()
    }
}

// 處理Token刷新失敗
const handleTokenRefreshFailure = async () => {
    await store.dispatch('auth/logout')
    await handleRedirect('/login')
}

// 處理重定向
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

// 顯示錯誤消息
const showErrorMessage = (message, type) => {
    const duration = getDurationByErrorType(type)
    store.dispatch('app/setError', {
        message,
        type,
        duration
    }).catch(console.error)
}

// 獲取錯誤顯示時間
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

// 格式化驗證錯誤
const formatValidationErrors = (errors) => {
    if (!errors) return null
    if (typeof errors === 'string') return errors
    if (Array.isArray(errors)) return errors.filter(Boolean).join('、')
    return Object.values(errors).flat().filter(Boolean).join('、')
}

// 記錄錯誤
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
        }
    }

    // 開發環境下在控制台輸出錯誤信息
    if (import.meta.env.DEV) {
        console.group('Error Details')
        console.error('Error Type:', errorInfo.type)
        console.error('Error Message:', errorInfo.message)
        console.error('Status Code:', errorInfo.statusCode)
        console.error('Full Error:', logData)
        console.groupEnd()
    }

    // 生產環境下上報錯誤
    if (import.meta.env.PROD) {
        try {
            await reportErrorToServer(logData)
        } catch (reportError) {
            console.error('Error reporting failed:', reportError)
        }
    }

    return logData
}

// 生成錯誤ID
const generateErrorId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 上報錯誤到服務器
const reportErrorToServer = async (errorData) => {
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

// 應用錯誤類
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
