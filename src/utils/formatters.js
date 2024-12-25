// 日期時間格式化工具
import dayjs from 'dayjs'
import 'dayjs/locale/zh-tw'

// 設置默認語言為繁體中文
dayjs.locale('zh-tw')

// 貨幣格式化
export const formatCurrency = (amount, currency = 'TWD') => {
    if (typeof amount !== 'number') return '0'

    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount)
}

// 日期格式化
export const formatDate = (date, format = 'YYYY-MM-DD') => {
    if (!date) return ''
    return dayjs(date).format(format)
}

// 時間格式化
export const formatTime = (date, format = 'HH:mm:ss') => {
    if (!date) return ''
    return dayjs(date).format(format)
}

// 完整日期時間格式化
export const formatDateTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
    if (!date) return ''
    return dayjs(date).format(format)
}

// 相對時間格式化
export const formatRelativeTime = (date) => {
    if (!date) return ''
    const now = dayjs()
    const target = dayjs(date)
    const diffMinutes = now.diff(target, 'minute')

    if (diffMinutes < 1) return '剛剛'
    if (diffMinutes < 60) return `${diffMinutes} 分鐘前`

    const diffHours = now.diff(target, 'hour')
    if (diffHours < 24) return `${diffHours} 小時前`

    const diffDays = now.diff(target, 'day')
    if (diffDays < 7) return `${diffDays} 天前`

    return formatDate(date)
}

// 數字格式化
export const formatNumber = (number, options = {}) => {
    if (typeof number !== 'number') return '0'

    const {
        minimumFractionDigits = 0,
        maximumFractionDigits = 2,
        useGrouping = true
    } = options

    return new Intl.NumberFormat('zh-TW', {
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping
    }).format(number)
}

// 百分比格式化
export const formatPercentage = (number, decimals = 2) => {
    if (typeof number !== 'number') return '0%'
    return `${(number * 100).toFixed(decimals)}%`
}
// 檔案大小格式化
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// 地址格式化
export const formatAddress = (address) => {
    if (!address) return ''
    const {
        city,
        district,
        street,
        detail
    } = address
    return [city, district, street, detail].filter(Boolean).join(' ')
}

// 電話號碼格式化
export const formatPhoneNumber = (phone) => {
    if (!phone) return ''
    return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1-$2-$3')
}

// 信用卡號格式化
export const formatCreditCard = (number) => {
    if (!number) return ''
    return number.replace(/(\d{4})(?=\d)/g, '$1 ')
}

// 身分證字號格式化
export const formatIDNumber = (id) => {
    if (!id) return ''
    return id.replace(/^(.{6})(.+)$/, (_, p1, p2) => p1 + '****' + p2.slice(-2))
}

// 訂單編號格式化
export const formatOrderNumber = (number, prefix = 'ORD') => {
    if (!number) return ''
    return `${prefix}${String(number).padStart(8, '0')}`
}

// 促銷折扣格式化
export const formatDiscount = (type, value) => {
    if (!type || !value) return ''
    switch (type.toUpperCase()) {
        case 'PERCENTAGE':
            return `${value}% OFF`
        case 'FIXED_AMOUNT':
            return `$${formatNumber(value)} 折扣`
        default:
            return `${value}`
    }
}

// 庫存狀態格式化
export const formatStockStatus = (quantity) => {
    if (typeof quantity !== 'number') return '無庫存資訊'
    if (quantity <= 0) return '已售完'
    if (quantity <= 10) return `剩餘 ${quantity} 件`
    return '現貨充足'
}

// 評分格式化
export const formatRating = (rating, maxRating = 5) => {
    if (typeof rating !== 'number') return '無評分'
    const normalizedRating = Math.min(Math.max(rating, 0), maxRating)
    return `${normalizedRating.toFixed(1)}/${maxRating}`
}

export default {
    formatCurrency,
    formatDate,
    formatTime,
    formatDateTime,
    formatRelativeTime,
    formatNumber,
    formatPercentage,
    formatFileSize,
    formatAddress,
    formatPhoneNumber,
    formatCreditCard,
    formatIDNumber,
    formatOrderNumber,
    formatDiscount,
    formatStockStatus,
    formatRating
}
