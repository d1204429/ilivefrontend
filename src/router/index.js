import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'

const ROUTE_CONSTANTS = {
    TOKEN_KEY: import.meta.env.VITE_JWT_TOKEN_KEY,
    REFRESH_KEY: import.meta.env.VITE_JWT_REFRESH_KEY,
    APP_NAME: import.meta.env.VITE_APP_NAME || 'iLive',
    DEFAULT_TITLE: '首頁'
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
        meta: { title: '商品列表' }
    },
    {
        path: '/product/:id',
        name: 'ProductDetail',
        component: () => import('@/views/product/ProductDetailView.vue'),
        props: true,
        meta: { title: '商品詳情' }
    },
    {
        path: '/category/:id',
        name: 'Category',
        component: () => import('@/views/product/ProductListView.vue'),
        props: true,
        meta: { title: '商品分類' }
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
        name: 'login',
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
            title: '會員資料'
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
        props: { code: 403, message: '無權限訪問' },
        meta: { title: '403 Forbidden' }
    },
    {
        path: '/404',
        name: 'NotFound',
        component: () => import('@/views/ErrorView.vue'),
        props: { code: 404, message: '頁面不存在' },
        meta: { title: '404 Not Found' }
    },
    {
        path: '/500',
        name: 'ServerError',
        component: () => import('@/views/ErrorView.vue'),
        props: { code: 500, message: '伺服器錯誤' },
        meta: { title: '500 Server Error' }
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/404'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        }
        return { top: 0 }
    }
})

const checkAuthentication = async () => {
    const token = localStorage.getItem(ROUTE_CONSTANTS.TOKEN_KEY)
    const refreshToken = localStorage.getItem(ROUTE_CONSTANTS.REFRESH_KEY)
    const isAuthenticated = store.getters['auth/isAuthenticated']

    if (token && !isAuthenticated && refreshToken) {
        try {
            await store.dispatch('auth/refreshToken', refreshToken)
            return true
        } catch (error) {
            await store.dispatch('auth/logout')
            return false
        }
    }
    return isAuthenticated
}

const handleAuthRedirect = (to) => {
    return {
        path: '/login',
        query: { redirect: to.fullPath }
    }
}

router.beforeEach(async (to, from, next) => {
    try {
        document.title = to.meta.title
            ? `${to.meta.title} - ${ROUTE_CONSTANTS.APP_NAME}`
            : ROUTE_CONSTANTS.APP_NAME

        const isAuthenticated = await checkAuthentication()

        if (to.meta.requiresAuth && !isAuthenticated) {
            store.dispatch('app/setError', {
                message: '請先登入以繼續操作',
                type: 'warning',
                duration: 2000
            })
            return next(handleAuthRedirect(to))
        }

        if (to.meta.hideForAuth && isAuthenticated) {
            return next('/')
        }

        if (!to.meta.hideForAuth && from.name) {
            localStorage.setItem('previousPath', from.fullPath)
        }

        next()
    } catch (error) {
        console.error('路由錯誤:', error)
        store.dispatch('app/setError', {
            message: '系統錯誤，請稍後再試',
            type: 'error',
            duration: 3000
        })
        next('/500')
    }
})

router.onError((error) => {
    console.error('路由載入錯誤:', error)
    store.dispatch('app/setError', {
        message: '頁面載入失敗，請重新整理',
        type: 'error',
        duration: 3000
    })
})

export default router
