// API Endpoints
export const API_ENDPOINTS = {
    // 用戶相關
    AUTH: {
        LOGIN: '/api/v1/users/login',
        REGISTER: '/api/v1/users/register',
        LOGOUT: '/api/v1/users/logout'
    },

    // 商品相關
    PRODUCTS: {
        BASE: '/api/v1/products',
        DETAIL: (id) => `/api/v1/products/${id}`,
        CATEGORY: (id) => `/api/v1/products/category/${id}`,
        SEARCH: '/api/v1/products/search',
        FEATURED: '/api/v1/products/featured',
        NEW: '/api/v1/products/new'
    },

    // 購物車相關
    CART: {
        BASE: '/api/v1/cart',
        ITEMS: '/api/v1/cart/items',
        ADD: '/api/v1/cart/items/add',
        UPDATE: (id) => `/api/v1/cart/items/${id}`,
        REMOVE: (id) => `/api/v1/cart/items/${id}`,
        CLEAR: '/api/v1/cart/clear'
    },

    // 用戶相關
    USER: {
        PROFILE: '/api/v1/users/profile',
        UPDATE_PROFILE: '/api/v1/users/profile',
        CHANGE_PASSWORD: '/api/v1/users/password',
        ORDERS: '/api/v1/users/orders'
    }
}

// 商品狀態
export const PRODUCT_STATUS = {
    IN_STOCK: 'in_stock',
    OUT_OF_STOCK: 'out_of_stock',
    LOW_STOCK: 'low_stock'
}

// 訂單狀態
export const ORDER_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
}

// 付款方式
export const PAYMENT_METHODS = {
    CREDIT_CARD: 'credit_card',
    ATM: 'atm',
    TRANSFER: 'transfer'
}

// 運送方式
export const SHIPPING_METHODS = {
    HOME_DELIVERY: {
        id: 'home',
        name: '宅配到府',
        description: '2-3 個工作天到貨',
        price: 60
    },
    STORE_PICKUP: {
        id: 'store',
        name: '超商取貨',
        description: '2-3 個工作天到店',
        price: 60
    },
    FREE_SHIPPING: {
        id: 'free',
        name: '免運宅配',
        description: '消費滿 1000 元免運費',
        price: 0
    }
}

// 驗證規則
export const VALIDATION_RULES = {
    USERNAME: {
        required: true,
        min: 3,
        max: 20
    },
    PASSWORD: {
        required: true,
        min: 6,
        max: 20
    },
    EMAIL: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    PHONE: {
        required: true,
        pattern: /^09\d{8}$/
    }
}

// 本地存儲鍵名
export const STORAGE_KEYS = {
    TOKEN: 'token',
    USER: 'user',
    CART: 'cart'
}

// 錯誤訊息
export const ERROR_MESSAGES = {
    NETWORK_ERROR: '網路連線錯誤，請稍後再試',
    AUTH_FAILED: '認證失敗，請重新登入',
    INVALID_INPUT: '輸入資料不正確',
    SERVER_ERROR: '伺服器錯誤，請稍後再試'
}
