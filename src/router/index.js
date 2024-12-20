import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'Home',
            component: () => import('@/views/home/HomeView.vue'),
            meta: {
                title: '首頁'
            }
        },
        {
            path: '/products',
            name: 'Products',
            component: () => import('@/views/product/ProductListView.vue'),
            meta: {
                title: '商品列表'
            }
        },
        {
            path: '/product/:id',
            name: 'ProductDetail',
            component: () => import('@/views/product/ProductDetailView.vue'),
            props: true,
            meta: {
                title: '商品詳情'
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
                title: '會員資料'
            }
        },
        {
            path: '/category/:id',
            name: 'Category',
            component: () => import('@/views/product/ProductListView.vue'),
            props: true,
            meta: {
                title: '商品分類'
            }
        },
        {
            path: '/about',
            name: 'About',
            component: () => import('@/views/about/AboutView.vue'),
            meta: {
                title: '關於我們'
            }
        },
        {
            path: '/contact',
            name: 'Contact',
            component: () => import('@/views/contact/ContactView.vue'),
            meta: {
                title: '聯絡我們'
            }
        },
        {
            path: '/403',
            name: 'Forbidden',
            component: () => import('@/views/ErrorView.vue'),
            props: { code: 403, message: '無權限訪問' },
            meta: {
                title: '403 Forbidden'
            }
        },
        {
            path: '/404',
            name: 'NotFound',
            component: () => import('@/views/ErrorView.vue'),
            props: { code: 404, message: '頁面不存在' },
            meta: {
                title: '404 Not Found'
            }
        },
        {
            path: '/500',
            name: 'ServerError',
            component: () => import('@/views/ErrorView.vue'),
            props: { code: 500, message: '伺服器錯誤' },
            meta: {
                title: '500 Server Error'
            }
        },
        {
            path: '/:pathMatch(.*)*',
            redirect: '/404'
        }
    ]
})

router.beforeEach(async (to, from, next) => {
    document.title = to.meta.title
        ? `${to.meta.title} - ${import.meta.env.VITE_APP_NAME}`
        : import.meta.env.VITE_APP_NAME

    try {
        const token = localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        const refreshToken = localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY)
        const isAuthenticated = !!token && store.getters['auth/isAuthenticated']

        // 公開路由直接通過
        if (to.matched.some(record => !record.meta.requiresAuth)) {
            next()
            return
        }

        // Token 過期處理
        if (token && !isAuthenticated && refreshToken) {
            try {
                await store.dispatch('auth/refreshToken')
            } catch (error) {
                await store.dispatch('auth/logout')
                next({
                    path: '/login',
                    query: { redirect: to.fullPath }
                })
                return
            }
        }

        // 需要認證的路由檢查
        if (to.matched.some(record => record.meta.requiresAuth)) {
            if (!isAuthenticated) {
                next({
                    path: '/login',
                    query: { redirect: to.fullPath }
                })
                return
            }
        }

        // 已登入用戶的路由限制
        if (isAuthenticated && to.meta.hideForAuth) {
            next({ path: '/' })
            return
        }

        // 儲存前一頁路徑
        if (!to.meta.hideForAuth && from.name) {
            localStorage.setItem('previousPath', from.fullPath)
        }

        next()
    } catch (error) {
        console.error('路由守衛錯誤:', error)
        store.dispatch('app/setError', {
            message: '路由錯誤，請重新登入',
            type: 'error',
            duration: 3000
        })
        next('/login')
    }
})

router.onError((error) => {
    console.error('路由錯誤:', error)
    store.dispatch('app/setError', {
        message: '頁面載入失敗',
        type: 'error',
        duration: 3000
    })
    router.push('/500')
})

export default router
