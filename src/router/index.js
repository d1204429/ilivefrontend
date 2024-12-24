import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'
import { handleError } from '@/utils/errorHandler'

// 路由常量配置
const ROUTE_CONSTANTS = {
    TOKEN_KEY: import.meta.env.VITE_JWT_TOKEN_KEY,
    REFRESH_KEY: import.meta.env.VITE_JWT_REFRESH_KEY,
    APP_NAME: import.meta.env.VITE_APP_NAME || 'iLive',
    DEFAULT_TITLE: '首頁',
    LOGIN_PATH: '/login',
    HOME_PATH: '/',
    ERROR_PATHS: {
        FORBIDDEN: '/403',
        NOT_FOUND: '/404',
        SERVER_ERROR: '/500'
    }
}

// 路由配置
const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/home/HomeView.vue'),
        meta: {
            title: '首頁',
            keepAlive: true
        }
    },
    {
        path: '/products',
        name: 'Products',
        component: () => import('@/views/product/ProductListView.vue'),
        meta: {
            title: '商品列表',
            keepAlive: true
        }
    },
    {
        path: '/category/:id',
        name: 'Category',
        component: () => import('@/views/product/ProductListView.vue'),
        props: route => ({ categoryId: parseInt(route.params.id) }),
        meta: {
            title: '商品分類',
            keepAlive: true
        }
    },
    {
        path: '/product/:id',
        name: 'ProductDetail',
        component: () => import('@/views/product/ProductDetailView.vue'),
        props: route => ({ productId: parseInt(route.params.id) }),
        meta: {
            title: '商品詳情',
            keepAlive: true
        }
    },
    {
        path: '/cart',
        name: 'Cart',
        component: () => import('@/views/cart/CartView.vue'),
        meta: {
            requiresAuth: true,
            title: '購物車'
        }
    },
    {
        path: '/checkout',
        name: 'Checkout',
        component: () => import('@/views/cart/CheckoutView.vue'),
        meta: {
            requiresAuth: true,
            title: '結帳',
            validateCart: true
        }
    },
    {
        path: '/orders',
        name: 'Orders',
        component: () => import('@/views/order/OrderHistoryView.vue'),
        meta: {
            requiresAuth: true,
            title: '訂單記錄'
        }
    },
    {
        path: '/order/:id',
        name: 'OrderDetail',
        component: () => import('@/views/order/OrderDetailView.vue'),
        props: route => ({ orderId: parseInt(route.params.id) }),
        meta: {
            requiresAuth: true,
            title: '訂單詳情'
        }
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/user/LoginView.vue'),
        meta: {
            title: '登入',
            hideForAuth: true
        }
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('@/views/user/RegisterView.vue'),
        meta: {
            title: '註冊',
            hideForAuth: true
        }
    },
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('@/views/user/ProfileView.vue'),
        meta: {
            requiresAuth: true,
            title: '會員資料',
            keepAlive: true
        }
    },
    {
        path: '/about',
        name: 'About',
        component: () => import('@/views/about/AboutView.vue'),
        meta: { title: '關於我們' }
    },
    {
        path: '/contact',
        name: 'Contact',
        component: () => import('@/views/contact/ContactView.vue'),
        meta: { title: '聯絡我們' }
    },
    {
        path: '/403',
        name: 'Forbidden',
        component: () => import('@/views/ErrorView.vue'),
        props: { code: 403, message: '無權限訪問此頁面' },
        meta: { title: '403 無權限訪問' }
    },
    {
        path: '/404',
        name: 'NotFound',
        component: () => import('@/views/NotFoundView.vue'),
        meta: { title: '404 頁面不存在' }
    },
    {
        path: '/500',
        name: 'ServerError',
        component: () => import('@/views/ErrorView.vue'),
        props: { code: 500, message: '伺服器發生錯誤' },
        meta: { title: '500 伺服器錯誤' }
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: ROUTE_CONSTANTS.ERROR_PATHS.NOT_FOUND
    }
]
// 創建路由實例
const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(savedPosition)
                }, 300)
            })
        }
        return { top: 0, behavior: 'smooth' }
    }
})

// 檢查認證狀態
const checkAuthentication = async () => {
    try {
        const token = localStorage.getItem(ROUTE_CONSTANTS.TOKEN_KEY)
        const refreshToken = localStorage.getItem(ROUTE_CONSTANTS.REFRESH_KEY)
        const isAuthenticated = store.getters['auth/isAuthenticated']

        if (!token && !refreshToken) return false

        if (!isAuthenticated && token && refreshToken) {
            try {
                await store.dispatch('auth/checkAuth')
                return true
            } catch (error) {
                console.error('認證檢查失敗:', error)
                await handleAuthError(error)
                return false
            }
        }

        return isAuthenticated
    } catch (error) {
        console.error('認證檢查失敗:', error)
        return false
    }
}

// 處理認證錯誤
const handleAuthError = async (error) => {
    await store.dispatch('auth/logout')
    store.dispatch('app/showNotification', {
        type: 'error',
        message: error.message || '認證失敗，請重新登入',
        duration: 3000
    })
}

// 處理認證重定向
const handleAuthRedirect = (to) => {
    const currentPath = to.fullPath
    const isLoginPage = currentPath === ROUTE_CONSTANTS.LOGIN_PATH

    if (isLoginPage) {
        return { path: ROUTE_CONSTANTS.HOME_PATH }
    }

    return {
        path: ROUTE_CONSTANTS.LOGIN_PATH,
        query: {
            redirect: currentPath,
            message: '請先登入以繼續操作'
        }
    }
}

// 設置文檔標題
const setDocumentTitle = (to) => {
    const title = to.meta.title || ROUTE_CONSTANTS.DEFAULT_TITLE
    document.title = `${title} - ${ROUTE_CONSTANTS.APP_NAME}`
}

// 驗證購物車
const validateCart = async () => {
    try {
        await store.dispatch('cart/validateCart')
        return true
    } catch (error) {
        store.dispatch('app/showNotification', {
            type: 'error',
            message: error.message || '購物車驗證失敗',
            duration: 3000
        })
        return false
    }
}

// 路由守衛
router.beforeEach(async (to, from, next) => {
    try {
        setDocumentTitle(to)
        const isAuthenticated = await checkAuthentication()

        if (to.meta.requiresAuth && !isAuthenticated) {
            store.dispatch('app/showNotification', {
                type: 'warning',
                message: '請先登入以繼續操作',
                duration: 2000
            })
            return next(handleAuthRedirect(to))
        }

        if (to.meta.hideForAuth && isAuthenticated) {
            return next(ROUTE_CONSTANTS.HOME_PATH)
        }

        if (to.meta.validateCart && isAuthenticated) {
            const isValid = await validateCart()
            if (!isValid) {
                return next('/cart')
            }
        }

        next()
    } catch (error) {
        console.error('路由守衛錯誤:', error)
        handleError(error)
        next(ROUTE_CONSTANTS.ERROR_PATHS.SERVER_ERROR)
    }
})

// 路由後置守衛
router.afterEach((to, from) => {
    if (to.meta.keepAlive) {
        const instance = router.currentRoute.value.matched[0].instances.default
        if (instance && instance.activatedCache) {
            instance.activatedCache()
        }
    }
    store.dispatch('app/setLoading', false)
})

export default router
