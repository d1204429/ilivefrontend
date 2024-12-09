import { createStore } from 'vuex'
import auth from './modules/auth'
import cart from './modules/cart'
import product from './modules/product'
import user from './modules/user'
import order from './modules/order'

export default createStore({
    state: {
        loading: false,
        error: null,
        notification: null
    },

    mutations: {
        SET_LOADING(state, status) {
            state.loading = status
        },
        SET_ERROR(state, error) {
            state.error = error
        },
        CLEAR_ERROR(state) {
            state.error = null
        },
        SET_NOTIFICATION(state, notification) {
            state.notification = notification
        },
        CLEAR_NOTIFICATION(state) {
            state.notification = null
        }
    },

    actions: {
        setLoading({ commit }, status) {
            commit('SET_LOADING', status)
        },
        setError({ commit }, error) {
            commit('SET_ERROR', error)
            setTimeout(() => {
                commit('CLEAR_ERROR')
            }, 3000)
        },
        clearError({ commit }) {
            commit('CLEAR_ERROR')
        },
        showNotification({ commit }, { message, type = 'info' }) {
            commit('SET_NOTIFICATION', { message, type })
            setTimeout(() => {
                commit('CLEAR_NOTIFICATION')
            }, 3000)
        }
    },

    modules: {
        auth,
        cart,
        product,
        user,
        order
    },

    getters: {
        isLoading: state => state.loading,
        error: state => state.error,
        notification: state => state.notification
    }
})
