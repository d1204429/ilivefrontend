import axios from 'axios'

export default {
    namespaced: true,

    state: {
        cartItems: [],
        loading: false,
        error: null
    },

    mutations: {
        SET_CART_ITEMS(state, items) {
            state.cartItems = items
        },

        ADD_TO_CART(state, item) {
            const existingItem = state.cartItems.find(
                cartItem => cartItem.productId === item.productId
            )

            if (existingItem) {
                existingItem.quantity += item.quantity
            } else {
                state.cartItems.push(item)
            }
        },

        UPDATE_QUANTITY(state, { productId, quantity }) {
            const item = state.cartItems.find(item => item.productId === productId)
            if (item) {
                item.quantity = quantity
            }
        },

        REMOVE_FROM_CART(state, productId) {
            state.cartItems = state.cartItems.filter(item => item.productId !== productId)
        },

        CLEAR_CART(state) {
            state.cartItems = []
        },

        SET_LOADING(state, status) {
            state.loading = status
        },

        SET_ERROR(state, error) {
            state.error = error
        }
    },

    actions: {
        async fetchCartItems({ commit }, userId) {
            try {
                commit('SET_LOADING', true)
                const response = await axios.get(`/api/v1/cart/items/${userId}`)
                commit('SET_CART_ITEMS', response.data)
            } catch (error) {
                commit('SET_ERROR', error.message)
            } finally {
                commit('SET_LOADING', false)
            }
        },

        async addToCart({ commit }, { userId, productId, quantity }) {
            try {
                commit('SET_LOADING', true)
                const response = await axios.post('/api/v1/cart/items/add', {
                    userId,
                    productId,
                    quantity
                })
                commit('ADD_TO_CART', response.data)
            } catch (error) {
                commit('SET_ERROR', error.message)
            } finally {
                commit('SET_LOADING', false)
            }
        },

        async updateQuantity({ commit }, { userId, productId, quantity }) {
            try {
                commit('SET_LOADING', true)
                await axios.put(`/api/v1/cart/items/${productId}`, {
                    userId,
                    quantity
                })
                commit('UPDATE_QUANTITY', { productId, quantity })
            } catch (error) {
                commit('SET_ERROR', error.message)
            } finally {
                commit('SET_LOADING', false)
            }
        },

        async removeFromCart({ commit }, { userId, productId }) {
            try {
                commit('SET_LOADING', true)
                await axios.delete(`/api/v1/cart/items/${productId}`, {
                    data: { userId }
                })
                commit('REMOVE_FROM_CART', productId)
            } catch (error) {
                commit('SET_ERROR', error.message)
            } finally {
                commit('SET_LOADING', false)
            }
        },

        async clearCart({ commit }, userId) {
            try {
                commit('SET_LOADING', true)
                await axios.delete(`/api/v1/cart/${userId}`)
                commit('CLEAR_CART')
            } catch (error) {
                commit('SET_ERROR', error.message)
            } finally {
                commit('SET_LOADING', false)
            }
        }
    },

    getters: {
        cartItems: state => state.cartItems,

        cartTotal: state => {
            return state.cartItems.reduce((total, item) => {
                return total + (item.price * item.quantity)
            }, 0)
        },

        cartItemCount: state => {
            return state.cartItems.reduce((count, item) => {
                return count + item.quantity
            }, 0)
        },

        isLoading: state => state.loading,

        error: state => state.error
    }
}
