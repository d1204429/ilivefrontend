import { authApi } from '@/services/api'

const state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY) || null,
    refreshToken: localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY) || null,
    loading: false,
    error: null,
    authStatus: null,
    successMessage: null
}

const mutations = {
    SET_LOADING(state, status) {
        state.loading = status
    },
    SET_ERROR(state, error) {
        state.error = error
    },
    SET_SUCCESS_MESSAGE(state, message) {
        state.successMessage = message
    },
    SET_USER(state, user) {
        state.user = user
        if (user) {
            localStorage.setItem('user', JSON.stringify(user))
        } else {
            localStorage.removeItem('user')
        }
    },
    SET_AUTH_STATUS(state, status) {
        state.authStatus = status
    },
    SET_TOKENS(state, { accessToken, refreshToken }) {
        state.token = accessToken
        state.refreshToken = refreshToken
        if (accessToken) {
            localStorage.setItem(import.meta.env.VITE_JWT_TOKEN_KEY, accessToken)
            localStorage.setItem(import.meta.env.VITE_JWT_REFRESH_KEY, refreshToken)
        } else {
            localStorage.removeItem(import.meta.env.VITE_JWT_TOKEN_KEY)
            localStorage.removeItem(import.meta.env.VITE_JWT_REFRESH_KEY)
        }
    },
    CLEAR_AUTH(state) {
        state.user = null
        state.token = null
        state.refreshToken = null
        state.error = null
        state.authStatus = null
        state.successMessage = null
        localStorage.removeItem('user')
        localStorage.removeItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        localStorage.removeItem(import.meta.env.VITE_JWT_REFRESH_KEY)
    }
}

const actions = {
    async login({ commit }, credentials) {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        try {
            const response = await authApi.login(credentials)
            commit('SET_TOKENS', {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken
            })
            commit('SET_USER', response.user)
            commit('SET_AUTH_STATUS', 'authenticated')
            commit('SET_SUCCESS_MESSAGE', '登入成功')
            return response
        } catch (error) {
            commit('SET_ERROR', error.response?.data?.message || '登入失敗')
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async register({ commit }, userData) {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        try {
            const response = await authApi.register(userData)
            commit('SET_SUCCESS_MESSAGE', '註冊成功')
            return response
        } catch (error) {
            commit('SET_ERROR', error.response?.data?.message || '註冊失敗')
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async logout({ commit }) {
        try {
            await authApi.logout()
        } catch (error) {
            console.error('登出錯誤:', error)
        } finally {
            commit('CLEAR_AUTH')
        }
    },

    async refreshToken({ commit, state }) {
        try {
            const response = await authApi.refreshToken(state.refreshToken)
            commit('SET_TOKENS', {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken
            })
            return response
        } catch (error) {
            commit('CLEAR_AUTH')
            throw error
        }
    },

    checkAuth({ commit }) {
        const token = localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        const user = JSON.parse(localStorage.getItem('user'))

        if (token && user) {
            commit('SET_TOKENS', {
                accessToken: token,
                refreshToken: localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY)
            })
            commit('SET_USER', user)
            commit('SET_AUTH_STATUS', 'authenticated')
        }
    }
}

const getters = {
    isAuthenticated: state => !!state.token && !!state.user,
    currentUser: state => state.user,
    isLoading: state => state.loading,
    error: state => state.error,
    successMessage: state => state.successMessage,
    authStatus: state => state.authStatus
}

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
}
