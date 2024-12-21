import { orderApi } from '@/services/api'
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
        total: 0,
        totalPages: 0
    },
    filters: {
        status: '',
        dateRange: {
            start: '',
            end: ''
        },
        keyword: ''
    }
}

const getters = {
    orders: state => state.orders,
    currentOrder: state => state.currentOrder,
    orderStatistics: state => state.orderStatistics,
    isLoading: state => state.loading,
    error: state => state.error,
    pagination: state => state.pagination,
    filters: state => state.filters,

    // 依狀態過濾訂單
    ordersByStatus: state => status => {
        return state.orders.filter(order => order.status === status)
    },

    // 計算訂單總金額
    totalOrderAmount: state => {
        return state.orders.reduce((total, order) => total + order.totalAmount, 0)
    },

    // 獲取特定狀態的訂單數量
    orderCountByStatus: state => status => {
        return state.orders.filter(order => order.status === status).length
    },

    // 判斷是否有更多頁
    hasMorePages: state => {
        return state.pagination.page < state.pagination.totalPages
    },

    // 獲取當前訂單的可用操作
    availableActions: state => {
        if (!state.currentOrder) return []

        const actions = []
        const { status } = state.currentOrder

        switch(status) {
            case 'pending':
                actions.push('pay', 'cancel')
                break
            case 'paid':
                actions.push('cancel')
                break
            case 'shipping':
                actions.push('confirm')
                break
            case 'delivered':
                actions.push('review')
                break
        }

        return actions
    }
}

const actions = {
    // 獲取訂單列表
    async fetchOrders({ commit, state }, params = {}) {
        try {
            commit('SET_LOADING', true)
            const queryParams = {
                page: state.pagination.page,
                limit: state.pagination.limit,
                ...state.filters,
                ...params
            }
            const response = await orderApi.getList(queryParams)
            commit('SET_ORDERS', response.orders)
            commit('SET_PAGINATION', response.pagination)
            return response
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
            const response = await orderApi.getById(orderId)
            commit('SET_CURRENT_ORDER', response)
            return response
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
            const response = await orderApi.create(orderData)
            commit('ADD_ORDER', response)
            return response
        } catch (error) {
            commit('SET_ERROR', handleError(error))
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // 更新訂單
    async updateOrder({ commit }, { orderId, data }) {
        try {
            commit('SET_LOADING', true)
            const response = await orderApi.update(orderId, data)
            commit('UPDATE_ORDER', { orderId, data: response })
            return response
        } catch (error) {
            commit('SET_ERROR', handleError(error))
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // 取消訂單
    async cancelOrder({ commit }, { orderId, reason }) {
        try {
            commit('SET_LOADING', true)
            const response = await orderApi.cancel(orderId, reason)
            commit('UPDATE_ORDER_STATUS', {
                orderId,
                status: 'cancelled',
                cancelReason: reason
            })
            return response
        } catch (error) {
            commit('SET_ERROR', handleError(error))
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // 支付訂單
    async payOrder({ commit }, { orderId, paymentData }) {
        try {
            commit('SET_LOADING', true)
            const response = await orderApi.pay(orderId, paymentData)
            commit('UPDATE_ORDER_STATUS', {
                orderId,
                status: 'paid',
                paymentInfo: response.paymentInfo
            })
            return response
        } catch (error) {
            commit('SET_ERROR', handleError(error))
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // 確認收貨
    async confirmReceipt({ commit }, orderId) {
        try {
            commit('SET_LOADING', true)
            const response = await orderApi.confirmReceipt(orderId)
            commit('UPDATE_ORDER_STATUS', {
                orderId,
                status: 'completed'
            })
            return response
        } catch (error) {
            commit('SET_ERROR', handleError(error))
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // 申請退款
    async requestRefund({ commit }, { orderId, refundData }) {
        try {
            commit('SET_LOADING', true)
            const response = await orderApi.requestRefund(orderId, refundData)
            commit('UPDATE_ORDER_STATUS', {
                orderId,
                status: 'refunding',
                refundInfo: response.refundInfo
            })
            return response
        } catch (error) {
            commit('SET_ERROR', handleError(error))
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // 更新過濾條件
    updateFilters({ commit, dispatch }, filters) {
        commit('SET_FILTERS', filters)
        commit('RESET_PAGINATION')
        return dispatch('fetchOrders')
    },

    // 清空訂單狀態
    clearOrderState({ commit }) {
        commit('CLEAR_ORDERS')
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
        state.pagination = {
            ...state.pagination,
            ...pagination
        }
    },

    SET_FILTERS(state, filters) {
        state.filters = {
            ...state.filters,
            ...filters
        }
    },

    RESET_PAGINATION(state) {
        state.pagination.page = 1
    },

    ADD_ORDER(state, order) {
        state.orders.unshift(order)
    },

    UPDATE_ORDER(state, { orderId, data }) {
        const index = state.orders.findIndex(o => o.id === orderId)
        if (index !== -1) {
            state.orders.splice(index, 1, { ...state.orders[index], ...data })
        }
        if (state.currentOrder?.id === orderId) {
            state.currentOrder = { ...state.currentOrder, ...data }
        }
    },

    UPDATE_ORDER_STATUS(state, { orderId, status, ...additionalData }) {
        const order = state.orders.find(o => o.id === orderId)
        if (order) {
            order.status = status
            Object.assign(order, additionalData)
        }
        if (state.currentOrder?.id === orderId) {
            state.currentOrder.status = status
            Object.assign(state.currentOrder, additionalData)
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
            total: 0,
            totalPages: 0
        }
        state.filters = {
            status: '',
            dateRange: {
                start: '',
                end: ''
            },
            keyword: ''
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
