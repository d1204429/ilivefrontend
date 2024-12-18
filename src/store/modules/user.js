import { userApi } from '@/services/api'
import authService from '@/services/auth.service'

const state = {
    userInfo: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem('user'),
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    loading: false,
    error: null
}

const mutations = {
    SET_LOADING(state, status) {
        state.loading = status
    },
    SET_ERROR(state, error) {
        state.error = error
    },
    SET_USER_INFO(state, userInfo) {
        state.userInfo = userInfo
        if (userInfo) {
            localStorage.setItem('user', JSON.stringify(userInfo))
        } else {
            localStorage.removeItem('user')
        }
    },
    SET_AUTH_STATUS(state, status) {
        state.isAuthenticated = status
    },
    SET_TOKENS(state, { accessToken, refreshToken }) {
        state.accessToken = accessToken
        state.refreshToken = refreshToken
        if (accessToken) {
            localStorage.setItem('accessToken', accessToken)
            localStorage.setItem('refreshToken', refreshToken)
        } else {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
        }
    },
    CLEAR_USER_STATE(state) {
        state.userInfo = null
        state.isAuthenticated = false
        state.accessToken = null
        state.refreshToken = null
        state.error = null
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
    }
}

const actions = {
    async login({ commit }, { username, password }) {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        try {
            const response = await authService.login(username, password)
            const { accessToken, refreshToken, user } = response
            commit('SET_TOKENS', { accessToken, refreshToken })
            commit('SET_USER_INFO', user)
            commit('SET_AUTH_STATUS', true)
            return response
        } catch (error) {
            commit('SET_ERROR', error.message)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async register({ commit }, userData) {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        try {
            const response = await authService.register(userData)
            return response
        } catch (error) {
            commit('SET_ERROR', error.message)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async logout({ commit }) {
        try {
            await authService.logout()
        } finally {
            commit('CLEAR_USER_STATE')
        }
    },

    async fetchUserInfo({ commit, state }) {
        if (!state.accessToken) return

        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        try {
            const response = await userApi.getUserInfo()
            commit('SET_USER_INFO', response.data)
            return response.data
        } catch (error) {
            commit('SET_ERROR', error.message)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async updateUserInfo({ commit }, userData) {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        try {
            const response = await userApi.updateUserInfo(userData)
            commit('SET_USER_INFO', response.data)
            return response.data
        } catch (error) {
            commit('SET_ERROR', error.message)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async changePassword({ commit }, { oldPassword, newPassword }) {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        try {
            await authService.changePassword(oldPassword, newPassword)
        } catch (error) {
            commit('SET_ERROR', error.message)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async resetPassword({ commit }, { token, newPassword }) {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        try {
            await authService.resetPassword(token, newPassword)
        } catch (error) {
            commit('SET_ERROR', error.message)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async refreshToken({ commit, state }) {
        if (!state.refreshToken) return

        try {
            const response = await authService.refreshToken(state.refreshToken)
            const { accessToken, refreshToken } = response
            commit('SET_TOKENS', { accessToken, refreshToken })
            return response
        } catch (error) {
            commit('CLEAR_USER_STATE')
            throw error
        }
    }
}

const getters = {
    isAuthenticated: state => state.isAuthenticated,
    userInfo: state => state.userInfo,
    accessToken: state => state.accessToken,
    refreshToken: state => state.refreshToken,
    loading: state => state.loading,
    error: state => state.error,
    userId: state => state.userInfo?.userId,
    username: state => state.userInfo?.username,
    email: state => state.userInfo?.email
}

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
}
