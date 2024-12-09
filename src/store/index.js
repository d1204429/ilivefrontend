import { createStore } from 'vuex'
import auth from './modules/auth'
import cart from './modules/cart'
import product from './modules/product'
import user from './modules/user'
import order from './modules/order'

export default createStore({
    state: {
        loading: false,
        error: null
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
        }
    },

    actions: {
        setLoading({ commit }, status) {
            commit('SET_LOADING', status)
        },
        setError({ commit }, error) {
            commit('SET_ERROR', error)
        },
        clearError({ commit }) {
            commit('CLEAR_ERROR')
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
        error: state => state.error
    }
})
