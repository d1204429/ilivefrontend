// src/utils/errorHandler.js

export const handleError = (error) => {
    if (error.response) {
        // 伺服器回應的錯誤
        const { status, data } = error.response

        switch (status) {
            case 400:
                return data.message || '請求參數錯誤'
            case 401:
                return '身份驗證失敗，請重新登入'
            case 403:
                return '您沒有權限執行此操作'
            case 404:
                return '請求的資源不存在'
            case 422:
                return data.message || '驗證錯誤'
            case 429:
                return '請求過於頻繁，請稍後再試'
            case 500:
                return '伺服器錯誤，請稍後再試'
            default:
                return data.message || '發生未知錯誤'
        }
    }

    if (error.request) {
        // 請求發出但沒有收到回應
        return '網路連線錯誤，請檢查您的網路連接'
    }

    // 其他錯誤
    return error.message || '發生未知錯誤'
}

export const logError = (error) => {
    console.error('Error:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
    })
}

export default {
    handleError,
    logError
}
