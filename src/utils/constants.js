// API 端點配置
export const API_ENDPOINTS = {
    // 認證相關
    AUTH: {
        BASE: '/api/v1/users',
        LOGIN: '/api/v1/users/login',
        REGISTER: '/api/v1/users/register',
        LOGOUT: '/api/v1/users/logout',
        REFRESH_TOKEN: '/api/v1/users/refresh-token',
        VERIFY_EMAIL: '/api/v1/users/verify-email',
        FORGOT_PASSWORD: '/api/v1/users/forgot-password',
        RESET_PASSWORD: '/api/v1/users/reset-password',
        CHECK_EMAIL: '/api/v1/users/check-email',
        CHECK_USERNAME: '/api/v1/users/check-username'
    },

    // 商品相關
    PRODUCTS: {
        BASE: '/api/v1/products',
        DETAIL: (id) => `/api/v1/products/${id}`,
        CATEGORY: (id) => `/api/v1/products/category/${id}`,
        SEARCH: '/api/v1/products/search',
        FEATURED: '/api/v1/products/featured',
        NEW_ARRIVALS: '/api/v1/products/new-arrivals',
        RECOMMENDED: '/api/v1/products/recommended',
        REVIEWS: (id) => `/api/v1/products/${id}/reviews`,
        RELATED: (id) => `/api/v1/products/${id}/related`,
        CATEGORIES: '/api/v1/categories'
    },

    // 購物車相關
    CART: {
        BASE: '/api/v1/cart',
        ITEMS: '/api/v1/cart/items',
        ADD: '/api/v1/cart/items/add',
        UPDATE: (id) => `/api/v1/cart/items/${id}`,
        REMOVE: (id) => `/api/v1/cart/items/${id}`,
        CLEAR: '/api/v1/cart/clear',
        COUPON: '/api/v1/cart/coupon',
        SHIPPING_METHODS: '/api/v1/cart/shipping-methods',
        CHECKOUT: '/api/v1/cart/checkout',
        SAVE_FOR_LATER: (id) => `/api/v1/cart/items/${id}/save-for-later`,
        SAVED_ITEMS: '/api/v1/cart/saved-items',
        COUNT: '/api/v1/cart/count'
    },

    // 用戶相關
    USER: {
        BASE: '/api/v1/users',
        PROFILE: '/api/v1/users/profile',
        PASSWORD: '/api/v1/users/password',
        AVATAR: '/api/v1/users/avatar',
        ADDRESSES: '/api/v1/users/addresses',
        PREFERENCES: '/api/v1/users/preferences',
        ORDERS: '/api/v1/users/orders',
        FAVORITES: '/api/v1/users/favorites',
        NOTIFICATIONS: '/api/v1/users/notifications'
    },

    // 訂單相關
    ORDERS: {
        BASE: '/api/v1/orders',
        CREATE: '/api/v1/orders',
        LIST: '/api/v1/orders',
        DETAIL: (id) => `/api/v1/orders/${id}`,
        CANCEL: (id) => `/api/v1/orders/${id}/cancel`,
        PAYMENT: '/api/v1/orders/payment-methods',
        PAY: (id) => `/api/v1/orders/${id}/payment`,
        TRACKING: (id) => `/api/v1/orders/${id}/tracking`,
        REFUND: (id) => `/api/v1/orders/${id}/refund`,
        INVOICE: (id) => `/api/v1/orders/${id}/invoice`,
        CONFIRM_RECEIPT: (id) => `/api/v1/orders/${id}/confirm-receipt`
    }
}

// 商品狀態
export const PRODUCT_STATUS = {
    IN_STOCK: 'in_stock',
    OUT_OF_STOCK: 'out_of_stock',
    LOW_STOCK: 'low_stock',
    DISCONTINUED: 'discontinued',
    COMING_SOON: 'coming_soon',
    PRE_ORDER: 'pre_order'
}

// 訂單狀態
export const ORDER_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDING: 'refunding',
    REFUNDED: 'refunded',
    FAILED: 'failed'
}

// 付款方式
export const PAYMENT_METHODS = {
    CREDIT_CARD: {
        id: 'credit_card',
        name: '信用卡',
        icon: 'fa-credit-card',
        description: '支援VISA、Master、JCB'
    },
    ATM: {
        id: 'atm',
        name: 'ATM轉帳',
        icon: 'fa-university',
        description: '請在1小時內完成繳費'
    },
    TRANSFER: {
        id: 'transfer',
        name: '銀行轉帳',
        icon: 'fa-money-bill',
        description: '請在1小時內完成繳費'
    },
    LINE_PAY: {
        id: 'line_pay',
        name: 'LINE Pay',
        icon: 'fa-line',
        description: '使用LINE Pay支付'
    }
}

// 運送方式
export const SHIPPING_METHODS = {
    HOME_DELIVERY: {
        id: 'home',
        name: '宅配到府',
        description: '2-3 個工作天到貨',
        price: 60,
        icon: 'fa-truck',
        minAmount: 0
    },
    STORE_PICKUP: {
        id: 'store',
        name: '超商取貨',
        description: '2-3 個工作天到店',
        price: 60,
        icon: 'fa-store',
        minAmount: 0
    },
    FREE_SHIPPING: {
        id: 'free',
        name: '免運宅配',
        description: '消費滿 1000 元免運費',
        price: 0,
        icon: 'fa-gift',
        minAmount: 1000
    }
}

// 驗證規則
export const VALIDATION_RULES = {
    USERNAME: {
        required: true,
        min: 3,
        max: 20,
        pattern: /^[a-zA-Z0-9_-]+$/,
        message: '使用者名稱只能包含英文、數字、底線'
    },
    PASSWORD: {
        required: true,
        min: 8,
        max: 20,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
        message: '密碼必須包含大小寫字母和數字'
    },
    EMAIL: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: '請輸入有效的電子郵件'
    },
    PHONE: {
        required: true,
        pattern: /^09\d{8}$/,
        message: '請輸入有效的手機號碼'
    },
    ADDRESS: {
        required: true,
        min: 5,
        max: 100,
        message: '地址長度必須在5-100字之間'
    }
}

// 本地存儲鍵名
export const STORAGE_KEYS = {
    ACCESS_TOKEN: import.meta.env.VITE_JWT_TOKEN_KEY,
    REFRESH_TOKEN: import.meta.env.VITE_JWT_REFRESH_KEY,
    USER: import.meta.env.VITE_USER_STORAGE_KEY,
    CART: import.meta.env.VITE_CART_STORAGE_KEY,
    THEME: 'iLive_theme',
    LANGUAGE: 'iLive_language',
    LAST_LOGIN: 'iLive_last_login',
    REMEMBER_ME: 'iLive_remember_me'
}

// 錯誤訊息
export const ERROR_MESSAGES = {
    NETWORK_ERROR: '網路連線錯誤，請稍後再試',
    AUTH_FAILED: '認證失敗，請重新登入',
    INVALID_INPUT: '輸入資料不正確',
    SERVER_ERROR: '伺服器錯誤，請稍後再試',
    TOKEN_EXPIRED: '登入已過期，請重新登入',
    TOKEN_INVALID: '無效的認證令牌',
    PERMISSION_DENIED: '無權限執行此操作',
    INVALID_OPERATION: '無效的操作',
    RESOURCE_NOT_FOUND: '找不到請求的資源',
    RATE_LIMIT_EXCEEDED: '請求次數過多，請稍後再試',
    VALIDATION_ERROR: '資料驗證失敗'
}

// HTTP 狀態碼
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    TIMEOUT: 408,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
}

// API 響應碼
export const API_RESPONSE_CODE = {
    SUCCESS: import.meta.env.VITE_SUCCESS_CODE,
    ERROR: import.meta.env.VITE_ERROR_CODE,
    UNAUTHORIZED: import.meta.env.VITE_UNAUTHORIZED_CODE,
    FORBIDDEN: import.meta.env.VITE_FORBIDDEN_CODE
}
// 付款方式
export const PAYMENT_METHODS = {
    CREDIT_CARD: {
        id: 'credit_card',
        name: '信用卡',
        icon: 'fa-credit-card',
        description: '支援VISA、Master、JCB',
        enabled: true,
        minAmount: 0,
        maxAmount: 1000000
    },
    ATM: {
        id: 'atm',
        name: 'ATM轉帳',
        icon: 'fa-university',
        description: '請在1小時內完成繳費',
        enabled: true,
        minAmount: 0,
        maxAmount: 30000
    },
    TRANSFER: {
        id: 'transfer',
        name: '銀行轉帳',
        icon: 'fa-money-bill',
        description: '請在1小時內完成繳費',
        enabled: true,
        minAmount: 0,
        maxAmount: 50000
    },
    LINE_PAY: {
        id: 'line_pay',
        name: 'LINE Pay',
        icon: 'fa-line',
        description: '使用LINE Pay支付',
        enabled: true,
        minAmount: 0,
        maxAmount: 100000
    }
}

// 運送方式
export const SHIPPING_METHODS = {
    HOME_DELIVERY: {
        id: 'home',
        name: '宅配到府',
        description: '2-3 個工作天到貨',
        price: parseInt(import.meta.env.VITE_HOME_DELIVERY_FEE) || 60,
        icon: 'fa-truck',
        minAmount: 0,
        freeShippingAmount: parseInt(import.meta.env.VITE_FREE_SHIPPING_AMOUNT) || 1000,
        enabled: true
    },
    STORE_PICKUP: {
        id: 'store',
        name: '超商取貨',
        description: '2-3 個工作天到店',
        price: parseInt(import.meta.env.VITE_STORE_PICKUP_FEE) || 60,
        icon: 'fa-store',
        minAmount: 0,
        freeShippingAmount: parseInt(import.meta.env.VITE_FREE_SHIPPING_AMOUNT) || 1000,
        enabled: true
    }
}

// 驗證規則
export const VALIDATION_RULES = {
    USERNAME: {
        required: true,
        min: parseInt(import.meta.env.VITE_USERNAME_MIN_LENGTH) || 3,
        max: parseInt(import.meta.env.VITE_USERNAME_MAX_LENGTH) || 20,
        pattern: /^[a-zA-Z0-9_-]+$/,
        message: '使用者名稱只能包含英文、數字、底線'
    },
    PASSWORD: {
        required: true,
        min: parseInt(import.meta.env.VITE_PASSWORD_MIN_LENGTH) || 8,
        max: parseInt(import.meta.env.VITE_PASSWORD_MAX_LENGTH) || 20,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        message: '密碼必須包含大小寫字母、數字和特殊字符'
    },
    EMAIL: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: '請輸入有效的電子郵件'
    },
    PHONE: {
        required: true,
        pattern: /^09\d{8}$/,
        message: '請輸入有效的手機號碼'
    },
    ADDRESS: {
        required: true,
        min: 5,
        max: 100,
        message: '地址長度必須在5-100字之間'
    }
}

// 本地存儲鍵名
export const STORAGE_KEYS = {
    ACCESS_TOKEN: import.meta.env.VITE_JWT_TOKEN_KEY || 'access_token',
    REFRESH_TOKEN: import.meta.env.VITE_JWT_REFRESH_KEY || 'refresh_token',
    USER: import.meta.env.VITE_USER_STORAGE_KEY || 'user',
    CART: import.meta.env.VITE_CART_STORAGE_KEY || 'cart',
    THEME: `${import.meta.env.VITE_STORAGE_PREFIX}theme`,
    LANGUAGE: `${import.meta.env.VITE_STORAGE_PREFIX}language`,
    LAST_LOGIN: `${import.meta.env.VITE_STORAGE_PREFIX}last_login`,
    REMEMBER_ME: `${import.meta.env.VITE_STORAGE_PREFIX}remember_me`
}

// 錯誤訊息
export const ERROR_MESSAGES = {
    NETWORK_ERROR: '網路連線錯誤，請稍後再試',
    AUTH_FAILED: '認證失敗，請重新登入',
    INVALID_INPUT: '輸入資料不正確',
    SERVER_ERROR: '伺服器錯誤，請稍後再試',
    TOKEN_EXPIRED: '登入已過期，請重新登入',
    TOKEN_INVALID: '無效的認證令牌',
    PERMISSION_DENIED: '無權限執行此操作',
    INVALID_OPERATION: '無效的操作',
    RESOURCE_NOT_FOUND: '找不到請求的資源',
    RATE_LIMIT_EXCEEDED: '請求次數過多，請稍後再試',
    VALIDATION_ERROR: '資料驗證失敗',
    SESSION_EXPIRED: '工作階段已過期',
    MAINTENANCE: '系統維護中，請稍後再試'
}

// HTTP 狀態碼
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    TIMEOUT: 408,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
}

// API 響應碼
export const API_RESPONSE_CODE = {
    SUCCESS: import.meta.env.VITE_SUCCESS_CODE || 0,
    ERROR: import.meta.env.VITE_ERROR_CODE || -1,
    UNAUTHORIZED: import.meta.env.VITE_UNAUTHORIZED_CODE || 401,
    FORBIDDEN: import.meta.env.VITE_FORBIDDEN_CODE || 403,
    VALIDATION_ERROR: import.meta.env.VITE_VALIDATION_ERROR_CODE || 422,
    SYSTEM_ERROR: import.meta.env.VITE_SYSTEM_ERROR_CODE || 500
}
