// API 端點配置
export const API_ENDPOINTS = {
    // 認證相關
    AUTH: {
        LOGIN: '/api/v1/users/login',
        REGISTER: '/api/v1/users/register',
        LOGOUT: '/api/v1/users/logout',
        REFRESH_TOKEN: '/api/v1/users/refresh-token',
        VERIFY_EMAIL: '/api/v1/users/verify-email',
        FORGOT_PASSWORD: '/api/v1/users/forgot-password',
        RESET_PASSWORD: '/api/v1/users/reset-password'
    },

    // 商品相關
    PRODUCTS: {
        BASE: '/api/v1/products',
        DETAIL: (id) => `/api/v1/products/${id}`,
        CATEGORY: (id) => `/api/v1/products/category/${id}`,
        SEARCH: '/api/v1/products/search',
        FEATURED: '/api/v1/products/featured',
        NEW: '/api/v1/products/new',
        REVIEWS: (id) => `/api/v1/products/${id}/reviews`,
        RELATED: (id) => `/api/v1/products/${id}/related`
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
        SAVE_FOR_LATER: (id) => `/api/v1/cart/items/${id}/save-for-later`,
        SAVED_ITEMS: '/api/v1/cart/saved-items'
    },

    // 用戶相關
    USER: {
        PROFILE: '/api/v1/users/profile',
        UPDATE_PROFILE: '/api/v1/users/profile',
        CHANGE_PASSWORD: '/api/v1/users/password',
        ORDERS: '/api/v1/users/orders',
        ADDRESSES: '/api/v1/users/addresses',
        FAVORITES: '/api/v1/users/favorites',
        NOTIFICATIONS: '/api/v1/users/notifications',
        AVATAR: '/api/v1/users/avatar'
    },

    // 訂單相關
    ORDERS: {
        CREATE: '/api/v1/orders',
        LIST: '/api/v1/orders',
        DETAIL: (id) => `/api/v1/orders/${id}`,
        CANCEL: (id) => `/api/v1/orders/${id}/cancel`,
        PAY: (id) => `/api/v1/orders/${id}/payment`,
        TRACKING: (id) => `/api/v1/orders/${id}/tracking`,
        REFUND: (id) => `/api/v1/orders/${id}/refund`,
        INVOICE: (id) => `/api/v1/orders/${id}/invoice`
    }
}

// 商品狀態
export const PRODUCT_STATUS = {
    IN_STOCK: 'in_stock',
    OUT_OF_STOCK: 'out_of_stock',
    LOW_STOCK: 'low_stock',
    DISCONTINUED: 'discontinued',
    COMING_SOON: 'coming_soon'
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
    REFUNDED: 'refunded'
}

// 付款方式
export const PAYMENT_METHODS = {
    CREDIT_CARD: {
        id: 'credit_card',
        name: '信用卡',
        icon: 'fa-credit-card'
    },
    ATM: {
        id: 'atm',
        name: 'ATM轉帳',
        icon: 'fa-university'
    },
    TRANSFER: {
        id: 'transfer',
        name: '銀行轉帳',
        icon: 'fa-money-bill'
    },
    LINE_PAY: {
        id: 'line_pay',
        name: 'LINE Pay',
        icon: 'fa-line'
    }
}

// 運送方式
export const SHIPPING_METHODS = {
    HOME_DELIVERY: {
        id: 'home',
        name: '宅配到府',
        description: '2-3 個工作天到貨',
        price: 60,
        icon: 'fa-truck'
    },
    STORE_PICKUP: {
        id: 'store',
        name: '超商取貨',
        description: '2-3 個工作天到店',
        price: 60,
        icon: 'fa-store'
    },
    FREE_SHIPPING: {
        id: 'free',
        name: '免運宅配',
        description: '消費滿 1000 元免運費',
        price: 0,
        icon: 'fa-gift'
    }
}

// 驗證規則
export const VALIDATION_RULES = {
    USERNAME: {
        required: true,
        min: 3,
        max: 20,
        pattern: /^[a-zA-Z0-9_-]+$/
    },
    PASSWORD: {
        required: true,
        min: 8,
        max: 20,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
    },
    EMAIL: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    PHONE: {
        required: true,
        pattern: /^09\d{8}$/
    },
    ADDRESS: {
        required: true,
        min: 5,
        max: 100
    }
}

// 本地存儲鍵名
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'user',
    CART: 'cart',
    THEME: 'theme',
    LANGUAGE: 'language'
}

// 錯誤訊息
export const ERROR_MESSAGES = {
    NETWORK_ERROR: '網路連線錯誤，請稍後再試',
    AUTH_FAILED: '認證失敗，請重新登入',
    INVALID_INPUT: '輸入資料不正確',
    SERVER_ERROR: '伺服器錯誤，請稍後再試',
    TOKEN_EXPIRED: '登入已過期，請重新登入',
    PERMISSION_DENIED: '無權限執行此操作',
    INVALID_OPERATION: '無效的操作',
    RESOURCE_NOT_FOUND: '找不到請求的資源'
}

// HTTP 狀態碼
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
}
