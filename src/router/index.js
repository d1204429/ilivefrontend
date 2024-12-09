import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'Home',
            component: () => import('@/views/HomeView.vue')
        },
        {
            path: '/products',
            name: 'Products',
            component: () => import('@/views/ProductListView.vue')
        },
        {
            path: '/product/:id',
            name: 'ProductDetail',
            component: () => import('@/views/ProductDetailView.vue')
        },
        {
            path: '/cart',
            name: 'Cart',
            component: () => import('@/views/CartView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/checkout',
            name: 'Checkout',
            component: () => import('@/views/CheckoutView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/login',
            name: 'Login',
            component: () => import('@/views/LoginView.vue')
        },
        {
            path: '/register',
            name: 'Register',
            component: () => import('@/views/RegisterView.vue')
        },
        {
            path: '/profile',
            name: 'Profile',
            component: () => import('@/views/ProfileView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/category/:id',
            name: 'Category',
            component: () => import('@/views/ProductListView.vue')
        }
    ]
})

// 導航守衛
router.beforeEach((to, from, next) => {
    const isAuthenticated = localStorage.getItem('token')

    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!isAuthenticated) {
            next({
                path: '/login',
                query: { redirect: to.fullPath }
            })
        } else {
            next()
        }
    } else {
        next()
    }
})

export default router
