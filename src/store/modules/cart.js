import axios from '@/utils/axios'
import { cartApi } from '@/services/api'
import { handleError } from '@/utils/errorHandler'

export default {
    namespaced: true,

    state: {
        cartItems: [],
        loading: false,
        error: null,
        subtotal: 0,
        shipping: 0,
        lastUpdated: null,
        pendingRequests: []
    },

    mutations: {
        SET_CART_ITEMS(state, items) {
            state.cartItems = items
            state.lastUpdated = new Date().toISOString()
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
            state.lastUpdated = new Date().toISOString()
        },

        UPDATE_QUANTITY(state, { productId, quantity }) {
            const item = state.cartItems.find(item => item.productId === productId)
            if (item) {
                item.quantity = quantity
                this.commit('cart/UPDATE_SUBTOTAL')
                state.lastUpdated = new Date().toISOString()
            }
        },

        REMOVE_FROM_CART(state, productId) {
            state.cartItems = state.cartItems.filter(item => item.productId !== productId)
            this.commit('cart/UPDATE_SUBTOTAL')
            state.lastUpdated = new Date().toISOString()
        },

        CLEAR_CART(state) {
            state.cartItems = []
            state.subtotal = 0
            state.shipping = 0
            state.lastUpdated = new Date().toISOString()
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
        },

        ADD_PENDING_REQUEST(state, request) {
            state.pendingRequests.push(request)
        },

        REMOVE_PENDING_REQUEST(state, requestId) {
            state.pendingRequests = state.pendingRequests.filter(req => req.id !== requestId)
        }
    },

    actions: {
        async fetchCartItems({ commit }) {
            try {
                commit('SET_LOADING', true)
                commit('SET_ERROR', null)
                const response = await cartApi.getItems()
                commit('SET_CART_ITEMS', response)
                commit('UPDATE_SUBTOTAL')
                return response
            } catch (error) {
                const errorMessage = await handleError(error)
                commit('SET_ERROR', errorMessage)
                throw error
            } finally {
                commit('SET_LOADING', false)
            }
        },

        async addToCart({ commit }, { productId, quantity = 1 }) {
            try {
                commit('SET_LOADING', true)
                commit('SET_ERROR', null)

                const requestId = Date.now()
                commit('ADD_PENDING_REQUEST', { id: requestId, type: 'add', productId })

                const response = await cartApi.addItem({ productId, quantity })
                commit('ADD_TO_CART', response)
                return response
            } catch (error) {
                const errorMessage = await handleError(error)
                commit('SET_ERROR', errorMessage)
                throw error
            } finally {
                commit('SET_LOADING', false)
                commit('REMOVE_PENDING_REQUEST', requestId)
            }
        },

        async updateQuantity({ commit }, { productId, quantity }) {
            try {
                commit('SET_LOADING', true)
                commit('SET_ERROR', null)

                const requestId = Date.now()
                commit('ADD_PENDING_REQUEST', { id: requestId, type: 'update', productId })

                await cartApi.updateItem(productId, { quantity })
                commit('UPDATE_QUANTITY', { productId, quantity })
            } catch (error) {
                const errorMessage = await handleError(error)
                commit('SET_ERROR', errorMessage)
                throw error
            } finally {
                commit('SET_LOADING', false)
                commit('REMOVE_PENDING_REQUEST', requestId)
            }
        },

        async removeFromCart({ commit }, productId) {
            try {
                commit('SET_LOADING', true)
                commit('SET_ERROR', null)

                const requestId = Date.now()
                commit('ADD_PENDING_REQUEST', { id: requestId, type: 'remove', productId })

                await cartApi.removeItem(productId)
                commit('REMOVE_FROM_CART', productId)
            } catch (error) {
                const errorMessage = await handleError(error)
                commit('SET_ERROR', errorMessage)
                throw error
            } finally {
                commit('SET_LOADING', false)
                commit('REMOVE_PENDING_REQUEST', requestId)
            }
        },

        async clearCart({ commit }) {
            try {
                commit('SET_LOADING', true)
                commit('SET_ERROR', null)
                await cartApi.clear()
                commit('CLEAR_CART')
            } catch (error) {
                const errorMessage = await handleError(error)
                commit('SET_ERROR', errorMessage)
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
            return state.cartItems.reduce((count, item) => count + item.quantity, 0)
        },
        isLoading: state => state.loading,
        error: state => state.error,
        lastUpdated: state => state.lastUpdated,
        hasPendingRequests: state => state.pendingRequests.length > 0,
        getPendingRequestsByType: state => type => {
            return state.pendingRequests.filter(req => req.type === type)
        }
    }
}
