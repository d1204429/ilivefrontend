import store from '@/store'
import router from '@/router'

export const ErrorTypes = {
    VALIDATION: 'VALIDATION_ERROR',
    AUTH: 'AUTH_ERROR',
    NETWORK: 'NETWORK_ERROR',
    SERVER: 'SERVER_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR'
}

export const handleError = (error) => {
    let errorMessage = ''
    let errorType = ErrorTypes.UNKNOWN
    let shouldRedirect = false
    let redirectPath = ''

    if (error.response) {
        const { status, data } = error.response

        switch (status) {
            case 400:
                errorType = ErrorTypes.VALIDATION
                errorMessage = data.message || '請求參數錯誤'
                break

            case 401:
                errorType = ErrorTypes.AUTH
                errorMessage = '身份驗證已過期，請重新登入'
                shouldRedirect = true
                redirectPath = '/login'
                // 清除用戶認證信息
                store.dispatch('auth/logout')
                break

            case 403:
                errorType = ErrorTypes.AUTH
                errorMessage = '您沒有權限執行此操作'
                shouldRedirect = true
                redirectPath = '/403'
                break

            case 404:
                errorType = ErrorTypes.VALIDATION
                errorMessage = '請求的資源不存在'
                shouldRedirect = true
                redirectPath = '/404'
                break

            case 422:
                errorType = ErrorTypes.VALIDATION
                errorMessage = formatValidationErrors(data.errors) || '輸入資料驗證失敗'
                break

            case 429:
                errorType = ErrorTypes.SERVER
                errorMessage = '請求過於頻繁，請稍後再試'
                break

            case 500:
            case 502:
            case 503:
                errorType = ErrorTypes.SERVER
                errorMessage = '伺服器暫時無法處理請求，請稍後再試'
                shouldRedirect = true
                redirectPath = '/500'
                break

            default:
                errorType = ErrorTypes.UNKNOWN
                errorMessage = data.message || '發生未知錯誤'
        }
    } else if (error.request) {
        errorType = ErrorTypes.NETWORK
        errorMessage = '網路連線錯誤，請檢查您的網路連接'
    } else {
        errorType = ErrorTypes.UNKNOWN
        errorMessage = error.message || '發生未知錯誤'
    }

    // 記錄錯誤
    logError({
        type: errorType,
        message: errorMessage,
        error
    })

    // 顯示錯誤訊息
    store.dispatch('app/setError', errorMessage)

    // 處理重定向
    if (shouldRedirect && router.currentRoute.value.path !== redirectPath) {
        router.push(redirectPath)
    }

    return {
        type: errorType,
        message: errorMessage
    }
}

// 格式化驗證錯誤
const formatValidationErrors = (errors) => {
    if (!errors) return null

    if (typeof errors === 'string') return errors

    if (Array.isArray(errors)) {
        return errors.join(', ')
    }

    if (typeof errors === 'object') {
        return Object.values(errors)
            .map(error => Array.isArray(error) ? error.join(', ') : error)
            .join(', ')
    }

    return null
}

// 錯誤日誌
export const logError = (errorInfo) => {
    const { type, message, error } = errorInfo

    const logData = {
        timestamp: new Date().toISOString(),
        type,
        message,
        url: window.location.href,
        userAgent: navigator.userAgent,
        stack: error?.stack,
        response: error?.response?.data,
        status: error?.response?.status,
        config: error?.config
    }

    // 開發環境下在控制台輸出詳細錯誤信息
    if (import.meta.env.DEV) {
        console.group('Error Details')
        console.error('Error Type:', type)
        console.error('Error Message:', message)
        console.error('Full Error:', logData)
        console.groupEnd()
    }

    // TODO: 可以在這裡添加錯誤上報邏輯
    // sendErrorToServer(logData)
}

// 自定義錯誤類
export class AppError extends Error {
    constructor(message, type = ErrorTypes.UNKNOWN, data = null) {
        super(message)
        this.name = 'AppError'
        this.type = type
        this.data = data
    }
}

export default {
    handleError,
    logError,
    ErrorTypes,
    AppError
}
