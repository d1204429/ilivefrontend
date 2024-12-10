import { createRouter, createWebHistory } from 'vue-router'

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
            path: '/404',
            name: 'NotFound',
            component: () => import('@/views/NotFoundView.vue'),
            meta: {
                title: '404 Not Found'
            }
        },
        {
            path: '/:pathMatch(.*)*',
            redirect: '/404'
        }
    ]
})

router.beforeEach(async (to, from, next) => {
    // 設置頁面標題
    document.title = to.meta.title ? `${to.meta.title} - iLive商城` : 'iLive商城'

    try {
        const token = localStorage.getItem('token')
        const isAuthenticated = !!token

        // 檢查需要登入的頁面
        if (to.matched.some(record => record.meta.requiresAuth)) {
            if (!isAuthenticated) {
                next({
                    path: '/login',
                    query: { redirect: to.fullPath }
                })
                return
            }
        }

        // 檢查已登入用戶不能訪問的頁面
        if (isAuthenticated && to.meta.hideForAuth) {
            next({ path: '/' })
            return
        }

        // 儲存上一頁路徑（用於返回功能）
        if (!to.meta.hideForAuth) {
            localStorage.setItem('previousPath', from.fullPath)
        }

        next()
    } catch (error) {
        console.error('路由守衛錯誤:', error)
        next('/404')
    }
})

// 全局路由錯誤處理
router.onError((error) => {
    console.error('路由錯誤:', error)
    router.push('/404')
})

export default router
