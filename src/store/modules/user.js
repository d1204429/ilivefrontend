import { userApi } from '@/services/api'
import authService from '@/services/auth.service'

const state = {
    userInfo: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY),
    accessToken: localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY) || null,
    refreshToken: localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY) || null,
    loading: false,
    error: null,
    lastLoginTime: localStorage.getItem('lastLoginTime') || null,
    loginAttempts: 0,
    isLocked: false,
    lockUntil: null
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
        state.loginAttempts = 0
        state.isLocked = false
        state.lockUntil = null
        localStorage.removeItem('user')
        localStorage.removeItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        localStorage.removeItem(import.meta.env.VITE_JWT_REFRESH_KEY)
        localStorage.removeItem('lastLoginTime')
    },
    INCREMENT_LOGIN_ATTEMPTS(state) {
        state.loginAttempts++
        if (state.loginAttempts >= 5) {
            state.isLocked = true
            state.lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }
    },
    RESET_LOGIN_ATTEMPTS(state) {
        state.loginAttempts = 0
        state.isLocked = false
        state.lockUntil = null
    }
}

const actions = {
    async login({ commit, dispatch }, credentials) {
        if (state.isLocked && new Date(state.lockUntil) > new Date()) {
            throw new Error('帳號已被鎖定，請稍後再試')
        }

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
            commit('RESET_LOGIN_ATTEMPTS')
            await dispatch('fetchUserInfo')
            return response
        } catch (error) {
            commit('INCREMENT_LOGIN_ATTEMPTS')
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
            commit('SET_SUCCESS_MESSAGE', '註冊成功，請登入')
            return response
        } catch (error) {
            commit('SET_ERROR', error.message || '註冊失敗')
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async logout({ commit, dispatch }) {
        try {
            await authService.logout()
            await dispatch('cart/clearCart', null, { root: true })
        } catch (error) {
            console.error('登出錯誤:', error)
        } finally {
            commit('CLEAR_USER_STATE')
        }
    },

    async fetchUserInfo({ commit, state }) {
        if (!state.isAuthenticated) return

        commit('SET_LOADING', true)
        try {
            const response = await userApi.getProfile()
            commit('SET_USER_INFO', response)
            return response
        } catch (error) {
            if (error.response?.status === 401) {
                commit('CLEAR_USER_STATE')
            }
            commit('SET_ERROR', error.message)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async updateUserInfo({ commit }, userData) {
        commit('SET_LOADING', true)
        try {
            const response = await userApi.updateProfile(userData)
            commit('SET_USER_INFO', response)
            return response
        } catch (error) {
            commit('SET_ERROR', error.message)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async changePassword({ commit }, { oldPassword, newPassword }) {
        commit('SET_LOADING', true)
        try {
            await userApi.changePassword({ oldPassword, newPassword })
            commit('SET_SUCCESS_MESSAGE', '密碼修改成功')
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

    async checkAuth({ commit, dispatch }) {
        const token = localStorage.getItem(import.meta.env.VITE_JWT_TOKEN_KEY)
        const user = JSON.parse(localStorage.getItem('user'))

        if (token && user) {
            commit('SET_TOKENS', {
                accessToken: token,
                refreshToken: localStorage.getItem(import.meta.env.VITE_JWT_REFRESH_KEY)
            })
            commit('SET_USER_INFO', user)
            commit('SET_AUTH_STATUS', true)
            await dispatch('fetchUserInfo')
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
    userId: state => state.userInfo?.id,
    username: state => state.userInfo?.username,
    email: state => state.userInfo?.email,
    fullName: state => state.userInfo?.fullName,
    phoneNumber: state => state.userInfo?.phoneNumber,
    address: state => state.userInfo?.address,
    lastLoginTime: state => state.lastLoginTime,
    isAccountLocked: state => state.isLocked,
    remainingLockTime: state => {
        if (!state.lockUntil) return 0
        return Math.max(0, new Date(state.lockUntil) - new Date())
    }
}

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
}
