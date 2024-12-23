import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'

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

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/home/HomeView.vue'),
        meta: { title: '首頁' }
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
        path: '/product/:id',
        name: 'ProductDetail',
        component: () => import('@/views/product/ProductDetailView.vue'),
        props: true,
        meta: {
            title: '商品詳情',
            keepAlive: true
        }
    },
    {
        path: '/category/:id',
        name: 'Category',
        component: () => import('@/views/product/ProductListView.vue'),
        props: true,
        meta: {
            title: '商品分類',
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
            title: '結帳'
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
        props: true,
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
        component: () => import('@/views/ErrorView.vue'),
        props: { code: 404, message: '找不到此頁面' },
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
                return false
            }
        }

        return isAuthenticated
    } catch (error) {
        console.error('認證檢查失敗:', error)
        return false
    }
}

const handleAuthRedirect = (to) => {
    const currentPath = to.fullPath
    const isLoginPage = currentPath === ROUTE_CONSTANTS.LOGIN_PATH

    if (isLoginPage) {
        return { path: ROUTE_CONSTANTS.HOME_PATH }
    }

    return {
        path: ROUTE_CONSTANTS.LOGIN_PATH,
        query: { redirect: currentPath }
    }
}

const setDocumentTitle = (to) => {
    const title = to.meta.title || ROUTE_CONSTANTS.DEFAULT_TITLE
    document.title = `${title} - ${ROUTE_CONSTANTS.APP_NAME}`
}

router.beforeEach(async (to, from, next) => {
    try {
        setDocumentTitle(to)

        const isAuthenticated = await checkAuthentication()

        // 特殊處理 Profile 和 Products 頁面
        if ((to.name === 'Profile' || to.name === 'Products') && !isAuthenticated) {
            await store.dispatch('auth/checkAuth')
        }

        if (to.meta.requiresAuth && !isAuthenticated) {
            store.dispatch('app/setError', {
                message: '請先登入以繼續操作',
                type: 'warning',
                duration: 2000
            })
            return next(handleAuthRedirect(to))
        }

        if (to.meta.hideForAuth && isAuthenticated) {
            return next(ROUTE_CONSTANTS.HOME_PATH)
        }

        next()
    } catch (error) {
        console.error('路由守衛錯誤:', error)
        next()
    }
})

router.afterEach((to, from) => {
    if (to.meta.keepAlive) {
        const instance = router.currentRoute.value.matched[0].instances.default
        if (instance && instance.activatedCache) {
            instance.activatedCache()
        }
    }
})

export default router
