import api from '@/utils/axios'
import router from '@/router'

const TOKEN_KEY = import.meta.env.VITE_JWT_TOKEN_KEY
const REFRESH_TOKEN_KEY = import.meta.env.VITE_JWT_REFRESH_KEY

const state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem(TOKEN_KEY) || null,
    loading: false,
    error: null,
    successMessage: null
}

const getters = {
    isAuthenticated: state => !!state.token && !!state.user,
    currentUser: state => state.user,
    isAdmin: state => state.user?.role === 'ADMIN',
    isLoading: state => state.loading,
    error: state => state.error,
    successMessage: state => state.successMessage
}

const actions = {
    // 登入
    async login({ commit, dispatch }, credentials) {
        commit('SET_LOADING', true)
        commit('CLEAR_ERROR')

        try {
            const response = await api.post('/users/login', credentials)

            const { accessToken, user } = response
            localStorage.setItem(TOKEN_KEY, accessToken)
            localStorage.setItem('user', JSON.stringify(user))

            commit('AUTH_SUCCESS', { token: accessToken, user })
            await dispatch('initializeUserData')

            return response
        } catch (error) {
            commit('AUTH_ERROR', error.message)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // 註冊
    async register({ commit }, userData) {
        commit('SET_LOADING', true)
        commit('CLEAR_ERROR')

        try {
            const response = await api.post('/users/register', userData)
            commit('SET_SUCCESS_MESSAGE', '註冊成功，請登入')
            return response
        } catch (error) {
            commit('AUTH_ERROR', error.message)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // 登出
    async logout({ commit }) {
        try {
            await api.post('/users/logout')
        } catch (error) {
            console.error('登出錯誤:', error)
        } finally {
            commit('CLEAR_AUTH')
            router.push('/login')
        }
    },

    // 獲取用戶資料
    async fetchUserProfile({ commit }) {
        try {
            const response = await api.get('/users/profile')
            commit('UPDATE_USER', response)
            return response
        } catch (error) {
            commit('AUTH_ERROR', error.message)
            throw error
        }
    },

    // 更新用戶資料
    async updateProfile({ commit }, profileData) {
        commit('SET_LOADING', true)
        commit('CLEAR_ERROR')

        try {
            const response = await api.put('/users/profile', profileData)
            commit('UPDATE_USER', response)
            commit('SET_SUCCESS_MESSAGE', '個人資料更新成功')
            return response
        } catch (error) {
            commit('AUTH_ERROR', error.message)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // 修改密碼
    async changePassword({ commit }, passwordData) {
        commit('SET_LOADING', true)
        commit('CLEAR_ERROR')

        try {
            await api.put('/users/password', passwordData)
            commit('SET_SUCCESS_MESSAGE', '密碼修改成功')
        } catch (error) {
            commit('AUTH_ERROR', error.message)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // 初始化用戶數據
    async initializeUserData({ dispatch }) {
        try {
            await Promise.all([
                dispatch('cart/fetchCart', null, { root: true }),
                dispatch('fetchUserProfile')
            ])
        } catch (error) {
            console.error('初始化用戶數據失敗:', error)
        }
    },

    // 檢查認證狀態
    checkAuth({ commit, dispatch }) {
        const token = localStorage.getItem(TOKEN_KEY)
        const user = JSON.parse(localStorage.getItem('user'))

        if (token && user) {
            commit('AUTH_SUCCESS', { token, user })
            dispatch('initializeUserData')
        }
    }
}

const mutations = {
    SET_LOADING(state, status) {
        state.loading = status
    },

    AUTH_SUCCESS(state, { token, user }) {
        state.token = token
        state.user = user
        state.error = null
    },

    AUTH_ERROR(state, error) {
        state.error = error
    },

    UPDATE_USER(state, user) {
        state.user = { ...state.user, ...user }
        localStorage.setItem('user', JSON.stringify(state.user))
    },

    CLEAR_AUTH(state) {
        state.token = null
        state.user = null
        state.error = null
        state.successMessage = null
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem('user')
    },

    CLEAR_ERROR(state) {
        state.error = null
    },

    SET_SUCCESS_MESSAGE(state, message) {
        state.successMessage = message
    },

    CLEAR_SUCCESS_MESSAGE(state) {
        state.successMessage = null
    }
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
