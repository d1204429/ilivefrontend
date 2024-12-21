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
        // 商品相關路由
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
            path: '/category/:id',
            name: 'Category',
            component: () => import('@/views/product/ProductListView.vue'),
            props: true,
            meta: {
                title: '商品分類'
            }
        },
        // 購物車相關路由
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
        // 訂單相關路由
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
            path: '/order/payment/:id',
            name: 'OrderPayment',
            component: () => import('@/views/order/OrderPaymentView.vue'),
            props: true,
            meta: {
                requiresAuth: true,
                title: '訂單付款'
            }
        },
        // 用戶相關路由
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
            },
            children: [
                {
                    path: 'orders',
                    name: 'ProfileOrders',
                    component: () => import('@/views/order/OrderHistoryView.vue'),
                    meta: {
                        requiresAuth: true,
                        title: '我的訂單'
                    }
                },
                {
                    path: 'addresses',
                    name: 'ProfileAddresses',
                    component: () => import('@/views/user/AddressListView.vue'),
                    meta: {
                        requiresAuth: true,
                        title: '收貨地址'
                    }
                }
            ]
        },
        // 其他頁面路由
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
        // 錯誤頁面路由
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
    ],
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        } else {
            return { top: 0 }
        }
    }
})

// 路由守衛
router.beforeEach(async (to, from, next) => {
    // 設置頁面標題
    document.title = to.meta.title
        ? `${to.meta.title} - ${import.meta.env.VITE_APP_NAME}`
        : import.meta.env.VITE_APP_NAME

    try {
        const token = localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        const refreshToken = localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY)
        const isAuthenticated = !!token && store.getters['auth/isAuthenticated']

        // 處理 Token 刷新
        if (token && !isAuthenticated && refreshToken) {
            try {
                await store.dispatch('auth/refreshToken')
            } catch (error) {
                console.error('Token 刷新失敗:', error)
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
                store.dispatch('app/setError', {
                    message: '請先登入',
                    type: 'warning',
                    duration: 2000
                })
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

// 路由錯誤處理
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
