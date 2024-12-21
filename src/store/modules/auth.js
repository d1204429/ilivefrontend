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
    },
    UPDATE_USER(state, userData) {
        state.user = { ...state.user, ...userData }
        localStorage.setItem('user', JSON.stringify(state.user))
    }
}

const actions = {
    async login({ commit, dispatch }, credentials) {
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
            await dispatch('fetchUserProfile')
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
            commit('SET_SUCCESS_MESSAGE', '註冊成功，請登入')
            return response
        } catch (error) {
            commit('SET_ERROR', error.response?.data?.message || '註冊失敗')
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async logout({ commit, dispatch }) {
        try {
            await authApi.logout()
            await dispatch('clearUserData')
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

    async checkAuth({ commit, dispatch }) {
        const token = localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        const user = JSON.parse(localStorage.getItem('user'))

        if (token && user) {
            commit('SET_TOKENS', {
                accessToken: token,
                refreshToken: localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY)
            })
            commit('SET_USER', user)
            commit('SET_AUTH_STATUS', 'authenticated')
            await dispatch('fetchUserProfile')
        }
    },

    async fetchUserProfile({ commit }) {
        try {
            const response = await authApi.getUserProfile()
            commit('SET_USER', response.data)
        } catch (error) {
            console.error('獲取用戶資料失敗:', error)
        }
    },

    async updateUserProfile({ commit, dispatch }, userData) {
        commit('SET_LOADING', true)
        try {
            const response = await authApi.updateUserProfile(userData)
            commit('UPDATE_USER', response.data)
            commit('SET_SUCCESS_MESSAGE', '個人資料更新成功')
            return response.data
        } catch (error) {
            const errorMsg = error.response?.data?.message || '更新個人資料失敗'
            commit('SET_ERROR', errorMsg)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    }
    ,

    async changePassword({ commit }, passwordData) {
        try {
            await authApi.changePassword(passwordData)
            commit('SET_SUCCESS_MESSAGE', '密碼更改成功')
        } catch (error) {
            commit('SET_ERROR', error.response?.data?.message || '更改密碼失敗')
            throw error
        }
    },

    clearUserData({ commit }) {
        commit('CLEAR_AUTH')
    },

    setError({ commit }, error) {
        commit('SET_ERROR', error)
    },

    clearError({ commit }) {
        commit('SET_ERROR', null)
    },

    setSuccessMessage({ commit }, message) {
        commit('SET_SUCCESS_MESSAGE', message)
    },

    clearSuccessMessage({ commit }) {
        commit('SET_SUCCESS_MESSAGE', null)
    }
}

const getters = {
    isAuthenticated: state => !!state.token && !!state.user,
    currentUser: state => state.user,
    isLoading: state => state.loading,
    error: state => state.error,
    successMessage: state => state.successMessage,
    authStatus: state => state.authStatus,
    token: state => state.token
}

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
}
