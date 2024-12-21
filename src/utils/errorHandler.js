// src/utils/errorHandler.js

import store from '@/store'
import router from '@/router'

export const ErrorTypes = {
    VALIDATION: 'VALIDATION_ERROR',
    AUTH: 'AUTH_ERROR',
    NETWORK: 'NETWORK_ERROR',
    SERVER: 'SERVER_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR',
    BUSINESS: 'BUSINESS_ERROR'
}

export const handleError = async (error) => {
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
                await handleAuthError()
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
    } else if (error instanceof AppError) {
        errorType = error.type
        errorMessage = error.message
    } else {
        errorType = ErrorTypes.UNKNOWN
        errorMessage = error.message || '發生未知錯誤'
    }

    logError({
        type: errorType,
        message: errorMessage,
        error
    })

    if (errorType !== ErrorTypes.AUTH || error.response?.status !== 401) {
        showErrorMessage(errorMessage, errorType)
    }

    if (shouldRedirect) {
        await handleRedirect(redirectPath)
    }

    return {
        type: errorType,
        message: errorMessage
    }
}

const handleAuthError = async () => {
    const refreshToken = store.getters['auth/refreshToken']
    if (refreshToken) {
        try {
            await store.dispatch('auth/refreshToken')
        } catch (refreshError) {
            await store.dispatch('auth/logout')
            await handleRedirect('/login')
        }
    } else {
        await store.dispatch('auth/logout')
        await handleRedirect('/login')
    }
}

const handleRedirect = async (path) => {
    if (router.currentRoute.value.path !== path) {
        try {
            await router.push({
                path,
                query: path === '/login' ? { redirect: router.currentRoute.value.fullPath } : {}
            })
        } catch (navigationError) {
            console.error('Navigation error:', navigationError)
        }
    }
}

const showErrorMessage = (message, type) => {
    store.dispatch('app/setError', {
        message,
        type,
        duration: import.meta.env.VITE_ERROR_SHOW_DURATION
    })
}

const formatValidationErrors = (errors) => {
    if (!errors) return null
    if (typeof errors === 'string') return errors
    if (Array.isArray(errors)) return errors.join(', ')

    if (typeof errors === 'object') {
        return Object.values(errors)
            .flat()
            .filter(error => typeof error === 'string')
            .join(', ')
    }

    return null
}

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
        config: {
            url: error?.config?.url,
            method: error?.config?.method,
            params: error?.config?.params
        }
    }

    if (import.meta.env.DEV) {
        console.group('Error Details')
        console.error('Error Type:', type)
        console.error('Error Message:', message)
        console.error('Full Error:', logData)
        console.groupEnd()
    }

    if (import.meta.env.PROD) {
        // TODO: 實現錯誤上報邏輯
        // sendErrorToServer(logData)
    }
}

export class AppError extends Error {
    constructor(message, type = ErrorTypes.UNKNOWN, data = null) {
        super(message)
        this.name = 'AppError'
        this.type = type
        this.data = data

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
