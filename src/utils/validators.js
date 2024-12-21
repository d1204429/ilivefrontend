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
    // 支援多種格式：09xxxxxxxx、0912-345-678、0912 345 678
    const pattern = /^09[0-9]{2}[0-9]{3}[0-9]{3}$|^09[0-9]{2}[-\s]?[0-9]{3}[-\s]?[0-9]{3}$/
    if (!pattern.test(value.replace(/\s|-/g, ''))) {
        return '請輸入有效的手機號碼'
    }
    return true
}

// 全名驗證
export const fullName = (value) => {
    if (!value) return true
    if (value.length < 2) return '全名至少需要2個字元'
    if (value.length > 50) return '全名不能超過50個字元'
    // 允許中文、英文、空格和常見符號
    if (!/^[\u4e00-\u9fa5a-zA-Z\s.'()-]+$/.test(value)) {
        return '全名只能包含中文、英文、空格和常見符號'
    }
    return true
}

// 地址驗證
export const address = (value) => {
    if (!value) return true
    if (value.length < 5) return '地址至少需要5個字元'
    if (value.length > 200) return '地址不能超過200個字元'
    // 允許更多符號和數字
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9\s,.'#()-]+$/.test(value)) {
        return '地址包含無效的字元'
    }
    return true
}

// 日期驗證
export const date = (value, { minDate, maxDate } = {}) => {
    if (!value) return true
    const pattern = /^\d{4}-\d{2}-\d{2}$/
    if (!pattern.test(value)) {
        return '請輸入有效的日期（格式：YYYY-MM-DD）'
    }

    const inputDate = new Date(value)
    if (isNaN(inputDate.getTime())) {
        return '請輸入有效的日期'
    }

    if (minDate && inputDate < new Date(minDate)) {
        return `日期不能早於 ${minDate}`
    }

    if (maxDate && inputDate > new Date(maxDate)) {
        return `日期不能晚於 ${maxDate}`
    }

    return true
}

// 檔案驗證
export const file = (options = {}) => (file) => {
    if (!file) return true

    const {
        maxSize = 5 * 1024 * 1024, // 預設5MB
        minSize = 0,
        allowedTypes = [],
        maxFiles = 1
    } = options

    const errors = []

    if (Array.isArray(file) && file.length > maxFiles) {
        errors.push(`最多只能上傳 ${maxFiles} 個檔案`)
    }

    const files = Array.isArray(file) ? file : [file]

    files.forEach(f => {
        if (f.size < minSize) {
            errors.push(`檔案大小不能小於 ${Math.round(minSize / 1024)}KB`)
        }
        if (f.size > maxSize) {
            errors.push(`檔案大小不能超過 ${Math.round(maxSize / 1024 / 1024)}MB`)
        }
        if (allowedTypes.length && !allowedTypes.includes(f.type)) {
            errors.push(`只允許上傳 ${allowedTypes.join(', ')} 格式的檔案`)
        }
    })

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

// 自定義驗證規則生成器
export const createValidator = (validateFn, errorMessage) => (value) => {
    if (!validateFn(value)) {
        return errorMessage
    }
    return true
}

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
    compose,
    createValidator
}
