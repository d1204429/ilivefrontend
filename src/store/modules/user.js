import { userApi } from '@/services/api'
import authService from '@/services/auth.service'

const state = {
    userInfo: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY),
    accessToken: localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY) || null,
    refreshToken: localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY) || null,
    loading: false,
    error: null,
    lastLoginTime: localStorage.getItem('lastLoginTime') || null
}

const mutations = {
    SET_LOADING(state, status) {
        state.loading = status
    },
    SET_ERROR(state, error) {
        state.error = error
        if (!error) {
            state.error = null
        }
    },
    SET_USER_INFO(state, userInfo) {
        state.userInfo = userInfo
        if (userInfo) {
            localStorage.setItem('user', JSON.stringify(userInfo))
            state.lastLoginTime = new Date().toISOString()
            localStorage.setItem('lastLoginTime', state.lastLoginTime)
        } else {
            localStorage.removeItem('user')
            localStorage.removeItem('lastLoginTime')
        }
    },
    SET_AUTH_STATUS(state, status) {
        state.isAuthenticated = status
    },
    SET_TOKENS(state, { accessToken, refreshToken }) {
        state.accessToken = accessToken
        state.refreshToken = refreshToken
        if (accessToken) {
            localStorage.setItem(import.meta.env.VITE_JWT_TOKEN_KEY, accessToken)
            localStorage.setItem(import.meta.env.VITE_JWT_REFRESH_KEY, refreshToken)
        } else {
            localStorage.removeItem(import.meta.env.VITE_JWT_TOKEN_KEY)
            localStorage.removeItem(import.meta.env.VITE_JWT_REFRESH_KEY)
        }
    },
    CLEAR_USER_STATE(state) {
        state.userInfo = null
        state.isAuthenticated = false
        state.accessToken = null
        state.refreshToken = null
        state.error = null
        state.lastLoginTime = null
        localStorage.removeItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        localStorage.removeItem(import.meta.env.VITE_JWT_REFRESH_KEY)
        localStorage.removeItem('user')
        localStorage.removeItem('lastLoginTime')
    }
}

const actions = {
    async login({ commit, dispatch }, credentials) {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        try {
            const response = await authService.login(credentials.username, credentials.password)
            commit('SET_TOKENS', {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken
            })
            commit('SET_USER_INFO', response.user)
            commit('SET_AUTH_STATUS', true)
            return response
        } catch (error) {
            commit('SET_ERROR', error.message || '登入失敗')
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
            commit('SET_ERROR', error.message || '註冊失敗')
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async logout({ commit }) {
        try {
            await authService.logout()
        } catch (error) {
            console.error('登出錯誤:', error)
        } finally {
            commit('CLEAR_USER_STATE')
        }
    },

    async fetchUserInfo({ commit, state }) {
        if (!state.userInfo?.userId) return

        commit('SET_LOADING', true)
        try {
            const userInfo = await userApi.getProfile(state.userInfo.userId)
            commit('SET_USER_INFO', userInfo)
            return userInfo
        } catch (error) {
            commit('SET_ERROR', error.message)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async updateUserInfo({ commit, state }, userData) {
        if (!state.userInfo?.userId) return

        commit('SET_LOADING', true)
        try {
            const response = await userApi.updateProfile(state.userInfo.userId, userData)
            commit('SET_USER_INFO', response)
            return response
        } catch (error) {
            commit('SET_ERROR', error.message)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async changePassword({ commit, state }, { oldPassword, newPassword }) {
        if (!state.userInfo?.userId) return

        commit('SET_LOADING', true)
        try {
            await userApi.changePassword(state.userInfo.userId, {
                oldPassword,
                newPassword
            })
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
            commit('SET_TOKENS', {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken
            })
            return response
        } catch (error) {
            commit('CLEAR_USER_STATE')
            throw error
        }
    },

    checkAuth({ commit, dispatch }) {
        const token = localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        const user = JSON.parse(localStorage.getItem('user'))

        if (token && user) {
            commit('SET_TOKENS', {
                accessToken: token,
                refreshToken: localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY)
            })
            commit('SET_USER_INFO', user)
            commit('SET_AUTH_STATUS', true)
            dispatch('fetchUserInfo')
        }
    }
}

const getters = {
    isAuthenticated: state => state.isAuthenticated,
    currentUser: state => state.userInfo,
    accessToken: state => state.accessToken,
    refreshToken: state => state.refreshToken,
    loading: state => state.loading,
    error: state => state.error,
    userId: state => state.userInfo?.userId,
    username: state => state.userInfo?.username,
    email: state => state.userInfo?.email,
    fullName: state => state.userInfo?.fullName,
    phoneNumber: state => state.userInfo?.phoneNumber,
    address: state => state.userInfo?.address,
    lastLoginTime: state => state.lastLoginTime
}

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
}
