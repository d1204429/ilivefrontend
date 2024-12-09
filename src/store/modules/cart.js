import axios from 'axios'

export default {
    namespaced: true,

    state: {
        cartItems: [],
        loading: false,
        error: null,
        subtotal: 0,
        shipping: 0
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
            this.commit('cart/UPDATE_SUBTOTAL')
        },

        UPDATE_QUANTITY(state, { productId, quantity }) {
            const item = state.cartItems.find(item => item.productId === productId)
            if (item) {
                item.quantity = quantity
                this.commit('cart/UPDATE_SUBTOTAL')
            }
        },

        REMOVE_FROM_CART(state, productId) {
            state.cartItems = state.cartItems.filter(item => item.productId !== productId)
            this.commit('cart/UPDATE_SUBTOTAL')
        },

        CLEAR_CART(state) {
            state.cartItems = []
            state.subtotal = 0
            state.shipping = 0
        },

        SET_LOADING(state, status) {
            state.loading = status
        },

        SET_ERROR(state, error) {
            state.error = error
        },

        UPDATE_SUBTOTAL(state) {
            state.subtotal = state.cartItems.reduce((total, item) => {
                return total + (item.price * item.quantity)
            }, 0)

            // 更新運費計算
            state.shipping = state.subtotal >= 1000 ? 0 : 60
        }
    },

    actions: {
        async fetchCartItems({ commit }) {
            try {
                commit('SET_LOADING', true)
                const response = await axios.get('/api/v1/cart/items')
                commit('SET_CART_ITEMS', response.data)
                commit('UPDATE_SUBTOTAL')
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || '獲取購物車失敗')
            } finally {
                commit('SET_LOADING', false)
            }
        },

        async addToCart({ commit }, { productId, quantity = 1 }) {
            try {
                commit('SET_LOADING', true)
                const response = await axios.post('/api/v1/cart/items', {
                    productId,
                    quantity
                })
                commit('ADD_TO_CART', response.data)
                return response.data
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || '加入購物車失敗')
                throw error
            } finally {
                commit('SET_LOADING', false)
            }
        },

        async updateQuantity({ commit }, { productId, quantity }) {
            try {
                commit('SET_LOADING', true)
                await axios.put(`/api/v1/cart/items/${productId}`, { quantity })
                commit('UPDATE_QUANTITY', { productId, quantity })
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || '更新數量失敗')
                throw error
            } finally {
                commit('SET_LOADING', false)
            }
        },

        async removeFromCart({ commit }, productId) {
            try {
                commit('SET_LOADING', true)
                await axios.delete(`/api/v1/cart/items/${productId}`)
                commit('REMOVE_FROM_CART', productId)
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || '移除商品失敗')
                throw error
            } finally {
                commit('SET_LOADING', false)
            }
        },

        async clearCart({ commit }) {
            try {
                commit('SET_LOADING', true)
                await axios.delete('/api/v1/cart/clear')
                commit('CLEAR_CART')
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || '清空購物車失敗')
                throw error
            } finally {
                commit('SET_LOADING', false)
            }
        }
    },

    getters: {
        cartItems: state => state.cartItems,

        cartTotal: state => state.subtotal + state.shipping,

        subtotal: state => state.subtotal,

        shipping: state => state.shipping,

        cartItemCount: state => {
            return state.cartItems.reduce((count, item) => {
                return count + item.quantity
            }, 0)
        },

        isLoading: state => state.loading,

        error: state => state.error
    }
}
