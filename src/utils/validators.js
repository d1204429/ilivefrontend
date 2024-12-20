// src/utils/validators.js

// 基礎驗證規則
export const required = (value) => {
    if (value === null || value === undefined || value === '') {
        return '此欄位為必填'
    }
    return true
}

// 使用者名稱驗證
export const username = (value) => {
    if (!value) return true
    const pattern = /^[a-zA-Z0-9_]{3,20}$/
    if (!pattern.test(value)) {
        return '使用者名稱只能包含英文、數字和底線，長度3-20個字元'
    }
    if (/^\d+$/.test(value)) {
        return '使用者名稱不能全為數字'
    }
    return true
}

// Email驗證
export const email = (value) => {
    if (!value) return true
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!pattern.test(value)) {
        return '請輸入有效的電子郵件地址'
    }
    if (value.length > 50) {
        return '電子郵件長度不能超過50個字元'
    }
    return true
}

// 密碼強度驗證
export const password = (value) => {
    if (!value) return '請輸入密碼'

    const minLength = 8
    const maxLength = 20
    const hasUpperCase = /[A-Z]/.test(value)
    const hasLowerCase = /[a-z]/.test(value)
    const hasNumbers = /\d/.test(value)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value)

    const errors = []

    if (value.length < minLength) {
        errors.push(`密碼長度至少${minLength}個字元`)
    }
    if (value.length > maxLength) {
        errors.push(`密碼長度不能超過${maxLength}個字元`)
    }
    if (!hasUpperCase) {
        errors.push('需包含大寫字母')
    }
    if (!hasLowerCase) {
        errors.push('需包含小寫字母')
    }
    if (!hasNumbers) {
        errors.push('需包含數字')
    }
    if (!hasSpecialChar) {
        errors.push('需包含特殊符號')
    }

    return errors.length === 0 ? true : errors.join('、')
}

// 密碼強度計算
export const calculatePasswordStrength = (password) => {
    if (!password) return 0

    let strength = 0
    const checks = {
        length: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumbers: /\d/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    strength += Object.values(checks).filter(Boolean).length * 20
    return Math.min(strength, 100)
}

// 確認密碼驗證
export const confirmPassword = (password) => (value) => {
    if (!value) return '請再次輸入密碼'
    if (value !== password) return '兩次輸入的密碼不一致'
    return true
}

// 手機號碼驗證（台灣格式）
export const phoneNumber = (value) => {
    if (!value) return true
    const pattern = /^09\d{8}$/
    if (!pattern.test(value)) {
        return '請輸入有效的手機號碼（格式：09xxxxxxxx）'
    }
    return true
}

// 全名驗證
export const fullName = (value) => {
    if (!value) return true
    if (value.length < 2) return '全名至少需要2個字元'
    if (value.length > 50) return '全名不能超過50個字元'
    if (!/^[\u4e00-\u9fa5a-zA-Z\s]+$/.test(value)) {
        return '全名只能包含中文、英文和空格'
    }
    return true
}

// 地址驗證
export const address = (value) => {
    if (!value) return true
    if (value.length < 5) return '地址至少需要5個字元'
    if (value.length > 100) return '地址不能超過100個字元'
    return true
}

// 日期驗證
export const date = (value) => {
    if (!value) return true
    const pattern = /^\d{4}-\d{2}-\d{2}$/
    if (!pattern.test(value)) {
        return '請輸入有效的日期（格式：YYYY-MM-DD）'
    }

    const date = new Date(value)
    if (isNaN(date.getTime())) {
        return '請輸入有效的日期'
    }
    return true
}

// 檔案驗證
export const file = (maxSize, allowedTypes) => (file) => {
    if (!file) return true

    const errors = []

    if (maxSize && file.size > maxSize) {
        errors.push(`檔案大小不能超過 ${Math.round(maxSize / 1024 / 1024)}MB`)
    }

    if (allowedTypes && !allowedTypes.includes(file.type)) {
        errors.push(`只允許上傳 ${allowedTypes.join(', ')} 格式的檔案`)
    }

    return errors.length === 0 ? true : errors.join('、')
}

// 組合多個驗證規則
export const compose = (...validators) => (value) => {
    for (const validator of validators) {
        const result = validator(value)
        if (result !== true) {
            return result
        }
    }
    return true
}

// 匯出驗證器集合
export default {
    required,
    username,
    email,
    password,
    calculatePasswordStrength,
    confirmPassword,
    phoneNumber,
    fullName,
    address,
    date,
    file,
    compose
}
