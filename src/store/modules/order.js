import axios from 'axios'
import { handleError } from '@/utils/errorHandler'

const state = {
    orders: [],
    currentOrder: null,
    orderStatistics: null,
    loading: false,
    error: null,
    pagination: {
        page: 1,
        limit: 10,
        total: 0
    }
}

const getters = {
    orders: state => state.orders,
    currentOrder: state => state.currentOrder,
    orderStatistics: state => state.orderStatistics,
    isLoading: state => state.loading,
    error: state => state.error,
    pagination: state => state.pagination,

    // 依狀態過濾訂單
    ordersByStatus: state => status => {
        return state.orders.filter(order => order.status === status)
    },

    // 計算訂單總金額
    totalOrderAmount: state => {
        return state.orders.reduce((total, order) => total + order.totalAmount, 0)
    }
}

const actions = {
    // 獲取訂單列表
    async fetchOrders({ commit }, params = {}) {
        try {
            commit('SET_LOADING', true)
            const response = await axios.get('/api/v1/orders', { params })
            commit('SET_ORDERS', response.data.orders)
            commit('SET_PAGINATION', response.data.pagination)
            return response.data
        } catch (error) {
            commit('SET_ERROR', handleError(error))
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // 獲取訂單詳情
    async fetchOrderById({ commit }, orderId) {
        try {
            commit('SET_LOADING', true)
            const response = await axios.get(`/api/v1/orders/${orderId}`)
            commit('SET_CURRENT_ORDER', response.data)
            return response.data
        } catch (error) {
            commit('SET_ERROR', handleError(error))
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // 建立訂單
    async createOrder({ commit }, orderData) {
        try {
            commit('SET_LOADING', true)
            const response = await axios.post('/api/v1/orders', orderData)
            commit('ADD_ORDER', response.data)
            return response.data
        } catch (error) {
            commit('SET_ERROR', handleError(error))
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // 更新訂單狀態
    async updateOrderStatus({ commit }, { orderId, status }) {
        try {
            commit('SET_LOADING', true)
            const response = await axios.put(`/api/v1/orders/${orderId}/status`, { status })
            commit('UPDATE_ORDER_STATUS', { orderId, status })
            return response.data
        } catch (error) {
            commit('SET_ERROR', handleError(error))
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // 取消訂單
    async cancelOrder({ commit }, orderId) {
        try {
            commit('SET_LOADING', true)
            await axios.put(`/api/v1/orders/${orderId}/cancel`)
            commit('UPDATE_ORDER_STATUS', { orderId, status: 'cancelled' })
        } catch (error) {
            commit('SET_ERROR', handleError(error))
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // 獲取訂單統計資料
    async fetchOrderStatistics({ commit }) {
        try {
            commit('SET_LOADING', true)
            const response = await axios.get('/api/v1/orders/statistics')
            commit('SET_ORDER_STATISTICS', response.data)
            return response.data
        } catch (error) {
            commit('SET_ERROR', handleError(error))
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // 付款處理
    async processPayment({ commit }, { orderId, paymentData }) {
        try {
            commit('SET_LOADING', true)
            const response = await axios.post(`/api/v1/orders/${orderId}/payment`, paymentData)
            commit('UPDATE_ORDER_STATUS', { orderId, status: 'paid' })
            return response.data
        } catch (error) {
            commit('SET_ERROR', handleError(error))
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    }
}

const mutations = {
    SET_ORDERS(state, orders) {
        state.orders = orders
    },

    SET_CURRENT_ORDER(state, order) {
        state.currentOrder = order
    },

    SET_ORDER_STATISTICS(state, statistics) {
        state.orderStatistics = statistics
    },

    SET_LOADING(state, status) {
        state.loading = status
    },

    SET_ERROR(state, error) {
        state.error = error
    },

    SET_PAGINATION(state, pagination) {
        state.pagination = pagination
    },

    ADD_ORDER(state, order) {
        state.orders.unshift(order)
    },

    UPDATE_ORDER_STATUS(state, { orderId, status }) {
        const order = state.orders.find(o => o.id === orderId)
        if (order) {
            order.status = status
        }
        if (state.currentOrder && state.currentOrder.id === orderId) {
            state.currentOrder.status = status
        }
    },

    CLEAR_ORDERS(state) {
        state.orders = []
        state.currentOrder = null
        state.orderStatistics = null
        state.error = null
        state.pagination = {
            page: 1,
            limit: 10,
            total: 0
        }
    }
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
