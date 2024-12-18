import { userApi } from '@/services/api'
import authService from '@/services/auth.service'

const state = {
    userInfo: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem('accessToken'),
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
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
        state.lastLoginTime = null
        localStorage.clear()
    }
}

const actions = {
    async login({ commit, dispatch }, { username, password }) {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        try {
            const response = await authService.login(username, password)
            const { accessToken, refreshToken, user } = response
            commit('SET_TOKENS', { accessToken, refreshToken })
            commit('SET_USER_INFO', user)
            commit('SET_AUTH_STATUS', true)
            await dispatch('fetchUserInfo')
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
            const response = await authService.register({
                ...userData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
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
            console.error('登出時發生錯誤:', error)
        } finally {
            commit('CLEAR_USER_STATE')
        }
    },

    async fetchUserInfo({ commit, state }) {
        if (!state.accessToken) return

        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        try {
            const userInfo = await userApi.getUserInfo()
            commit('SET_USER_INFO', {
                ...userInfo,
                updatedAt: new Date().toISOString()
            })
            return userInfo
        } catch (error) {
            commit('SET_ERROR', error.message || '獲取用戶資訊失敗')
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async updateUserInfo({ commit }, userData) {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        try {
            const response = await userApi.updateUserInfo({
                ...userData,
                updatedAt: new Date().toISOString()
            })
            commit('SET_USER_INFO', response)
            return response
        } catch (error) {
            commit('SET_ERROR', error.message || '更新用戶資訊失敗')
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async changePassword({ commit, state }, { oldPassword, newPassword }) {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        try {
            await userApi.changePassword({
                userId: state.userInfo.userId,
                oldPassword,
                newPassword
            })
        } catch (error) {
            commit('SET_ERROR', error.message || '修改密碼失敗')
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
