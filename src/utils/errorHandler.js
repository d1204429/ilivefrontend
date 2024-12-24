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
    TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',
    FORM_VALIDATION: 'FORM_VALIDATION_ERROR',
    FILE_UPLOAD: 'FILE_UPLOAD_ERROR',
    PAYMENT: 'PAYMENT_ERROR'
}

// 錯誤狀態碼映射
const ERROR_STATUS_MAP = {
    400: {
        type: ErrorTypes.VALIDATION,
        message: '請求參數錯誤，請檢查輸入內容',
        retryable: false
    },
    401: {
        type: ErrorTypes.AUTH,
        message: '身份驗證已過期，請重新登入',
        redirect: '/login',
        retryable: false
    },
    403: {
        type: ErrorTypes.PERMISSION,
        message: '您沒有權限執行此操作',
        redirect: '/403',
        retryable: false
    },
    404: {
        type: ErrorTypes.API,
        message: '請求的資源不存在',
        redirect: '/404',
        retryable: false
    },
    422: {
        type: ErrorTypes.VALIDATION,
        message: '輸入資料驗證失敗',
        retryable: false
    },
    429: {
        type: ErrorTypes.RATE_LIMIT,
        message: '請求過於頻繁，請稍後再試',
        retryable: true,
        retryDelay: 5000
    },
    500: {
        type: ErrorTypes.SERVER,
        message: '伺服器內部錯誤，請稍後再試',
        redirect: '/500',
        retryable: true
    },
    502: {
        type: ErrorTypes.NETWORK,
        message: '網路閘道錯誤，請稍後再試',
        redirect: '/500',
        retryable: true
    },
    503: {
        type: ErrorTypes.SERVER,
        message: '服務暫時不可用，請稍後再試',
        redirect: '/500',
        retryable: true
    },
    504: {
        type: ErrorTypes.TIMEOUT,
        message: '網關超時，請稍後再試',
        retryable: true
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
        retryable: false,
        retryDelay: 0,
        timestamp: new Date().toISOString(),
        requestId: error.config?.requestId,
        url: error.config?.url
    }
    try {
        // 處理響應錯誤
        if (error.response) {
            const { status, data } = error.response
            const errorConfig = ERROR_STATUS_MAP[status] || {
                type: ErrorTypes.UNKNOWN,
                message: `系統錯誤 (${status})`
            }

            errorInfo = {
                ...errorInfo,
                type: errorConfig.type,
                message: data?.message || errorConfig.message,
                statusCode: status,
                details: data,
                shouldRedirect: !!errorConfig.redirect,
                redirectPath: errorConfig.redirect,
                retryable: errorConfig.retryable,
                retryDelay: errorConfig.retryDelay
            }
        }
        // 處理網絡錯誤
        else if (error.request) {
            errorInfo = {
                type: ErrorTypes.NETWORK,
                message: '網路連線失敗，請檢查網路設定',
                retryable: true,
                details: {
                    code: error.code,
                    request: error.request
                }
            }
        }
        // 處理業務邏輯錯誤
        else if (error instanceof BusinessException) {
            errorInfo = {
                type: ErrorTypes.BUSINESS,
                message: error.message,
                details: error.data,
                retryable: false
            }
        }

        // 記錄錯誤
        if (import.meta.env.DEV) {
            console.group('Error Details')
            console.error('Error Type:', errorInfo.type)
            console.error('Error Message:', errorInfo.message)
            console.error('Status Code:', errorInfo.statusCode)
            console.error('Details:', errorInfo.details)
            console.error('Stack:', error.stack)
            console.groupEnd()
        }

        // 顯示錯誤消息
        if (!error.config?.skipErrorMessage) {
            store.dispatch('app/showNotification', {
                type: 'error',
                message: errorInfo.message,
                duration: getDurationByErrorType(errorInfo.type)
            })
        }

        // 處理重定向
        if (errorInfo.shouldRedirect && !error.config?.skipRedirect) {
            const query = errorInfo.redirectPath === '/login'
                ? { redirect: router.currentRoute.value.fullPath }
                : undefined

            await router.push({
                path: errorInfo.redirectPath,
                query
            })
        }

        return errorInfo

    } catch (handlingError) {
        console.error('Error handling failed:', handlingError)
        return {
            type: ErrorTypes.UNKNOWN,
            message: '錯誤處理失敗',
            details: handlingError,
            originalError: error
        }
    }
}

// 業務邏輯錯誤類
export class BusinessException extends Error {
    constructor(message, data = null) {
        super(message)
        this.name = 'BusinessException'
        this.data = data
        this.timestamp = new Date().toISOString()

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, BusinessException)
        }
    }
}

export default {
    handleError,
    ErrorTypes,
    BusinessException
}
