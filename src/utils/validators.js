// 基本驗證規則
export const required = (value) => {
    return !!value || '此欄位為必填'
}

// Email驗證
export const email = (value) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return !value || pattern.test(value) || '請輸入有效的電子郵件'
}

// 手機號碼驗證
export const phone = (value) => {
    const pattern = /^09\d{8}$/
    return !value || pattern.test(value) || '請輸入有效的手機號碼'
}

// 密碼驗證
export const password = (value) => {
    const hasNumber = /\d/.test(value)
    const hasLetter = /[a-zA-Z]/.test(value)
    const hasMinLength = value && value.length >= 8

    if (!value) return '請輸入密碼'
    if (!hasMinLength) return '密碼長度至少8個字元'
    if (!hasNumber || !hasLetter) return '密碼必須包含數字和英文字母'

    return true
}

// 確認密碼驗證
export const confirmPassword = (password) => (value) => {
    return value === password || '密碼不一致'
}

// 最小長度驗證
export const minLength = (min) => (value) => {
    return !value || value.length >= min || `最少需要${min}個字元`
}

// 最大長度驗證
export const maxLength = (max) => (value) => {
    return !value || value.length <= max || `最多只能輸入${max}個字元`
}

// 數字驗證
export const numeric = (value) => {
    return !value || /^\d+$/.test(value) || '只能輸入數字'
}

// 價格驗證
export const price = (value) => {
    const pattern = /^\d+(\.\d{1,2})?$/
    return !value || pattern.test(value) || '請輸入有效的價格'
}

// 身分證字號驗證
export const taiwanId = (value) => {
    const pattern = /^[A-Z][12]\d{8}$/
    return !value || pattern.test(value) || '請輸入有效的身分證字號'
}

// 日期驗證
export const date = (value) => {
    const pattern = /^\d{4}-\d{2}-\d{2}$/
    return !value || pattern.test(value) || '請輸入有效的日期 (YYYY-MM-DD)'
}

// 網址驗證
export const url = (value) => {
    try {
        new URL(value)
        return true
    } catch {
        return '請輸入有效的網址'
    }
}

// 信用卡號驗證
export const creditCard = (value) => {
    const pattern = /^\d{4}-\d{4}-\d{4}-\d{4}$/
    return !value || pattern.test(value) || '請輸入有效的信用卡號'
}

// 台灣郵遞區號驗證
export const zipCode = (value) => {
    const pattern = /^\d{3}(\d{2})?$/
    return !value || pattern.test(value) || '請輸入有效的郵遞區號'
}

// 檔案大小驗證
export const fileSize = (maxSize) => (file) => {
    return !file || file.size <= maxSize || `檔案大小不能超過 ${maxSize / 1024 / 1024}MB`
}

// 檔案類型驗證
export const fileType = (types) => (file) => {
    return !file || types.includes(file.type) || '不支援此檔案格式'
}

// 自訂範圍驗證
export const range = (min, max) => (value) => {
    const val = parseFloat(value)
    return !value || (val >= min && val <= max) || `數值必須在 ${min} 到 ${max} 之間`
}

// 組合驗證器
export const compose = (...validators) => (value) => {
    for (const validator of validators) {
        const result = validator(value)
        if (result !== true) {
            return result
        }
    }
    return true
}

// 使用範例：
// const validatePassword = compose(required, password)
// const validateEmail = compose(required, email)
