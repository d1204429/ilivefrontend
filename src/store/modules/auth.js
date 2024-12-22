import { authApi } from '@/services/api'
import { handleError } from '@/utils/errorHandler'

const TOKEN_KEY = import.meta.env.VITE_JWT_TOKEN_KEY
const REFRESH_KEY = import.meta.env.VITE_JWT_REFRESH_KEY
const MAX_LOGIN_ATTEMPTS = 5
const LOCK_DURATION = 30 * 60 * 1000 // 30 minutes

const INITIAL_STATE = {
    user: null,
    token: null,
    refreshToken: null,
    loading: false,
    error: null,
    authStatus: null,
    successMessage: null,
    lastLoginTime: null,
    loginAttempts: 0,
    isLocked: false,
    lockUntil: null
}

const state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem(TOKEN_KEY) || null,
    refreshToken: localStorage.getItem(REFRESH_KEY) || null,
    loading: false,
    error: null,
    authStatus: null,
    successMessage: null,
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
    },
    SET_SUCCESS_MESSAGE(state, message) {
        state.successMessage = message
    },
    SET_USER(state, user) {
        state.user = user
        if (user) {
            localStorage.setItem('user', JSON.stringify(user))
            const loginTime = new Date().toISOString()
            state.lastLoginTime = loginTime
            localStorage.setItem('lastLoginTime', loginTime)
        } else {
            localStorage.removeItem('user')
            localStorage.removeItem('lastLoginTime')
        }
    },
    SET_AUTH_STATUS(state, status) {
        state.authStatus = status
    },
    SET_TOKENS(state, { accessToken, refreshToken }) {
        state.token = accessToken
        state.refreshToken = refreshToken
        if (accessToken) {
            localStorage.setItem(TOKEN_KEY, accessToken)
            localStorage.setItem(REFRESH_KEY, refreshToken)
        } else {
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(REFRESH_KEY)
        }
    },
    INCREMENT_LOGIN_ATTEMPTS(state) {
        state.loginAttempts++
        if (state.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
            state.isLocked = true
            state.lockUntil = new Date(Date.now() + LOCK_DURATION).toISOString()
        }
    },
    RESET_LOGIN_ATTEMPTS(state) {
        state.loginAttempts = 0
        state.isLocked = false
        state.lockUntil = null
    },
    CLEAR_AUTH(state) {
        Object.assign(state, { ...INITIAL_STATE })
        localStorage.removeItem('user')
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_KEY)
        localStorage.removeItem('lastLoginTime')
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
            const response = await authApi.login(credentials)
            if (!response?.accessToken || !response?.user) {
                throw new Error('無效的登入回應')
            }

            commit('SET_TOKENS', {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken
            })
            commit('SET_USER', response.user)
            commit('SET_AUTH_STATUS', 'authenticated')
            commit('RESET_LOGIN_ATTEMPTS')
            commit('SET_SUCCESS_MESSAGE', '登入成功')

            await dispatch('getProfile')
            return response
        } catch (error) {
            commit('INCREMENT_LOGIN_ATTEMPTS')
            handleError(error)
            commit('SET_ERROR', error.response?.data?.message || '登入失敗，請檢查帳號密碼')
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
            handleError(error)
            commit('SET_ERROR', error.response?.data?.message || '註冊失敗，請稍後再試')
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async logout({ commit, dispatch }) {
        try {
            if (state.token) {
                await authApi.logout()
            }
        } catch (error) {
            console.error('登出錯誤:', error)
        } finally {
            commit('CLEAR_AUTH')
            await dispatch('cart/clearCart', null, { root: true })
        }
    },

    async getProfile({ commit }) {
        try {
            const response = await authApi.getProfile()
            if (response) {
                commit('SET_USER', response)
            }
            return response
        } catch (error) {
            if (error.response?.status === 401) {
                commit('CLEAR_AUTH')
            }
            handleError(error)
            throw error
        }
    },

    async updateProfile({ commit }, userData) {
        commit('SET_LOADING', true)

        try {
            const response = await authApi.updateProfile(userData)
            commit('SET_USER', response)
            commit('SET_SUCCESS_MESSAGE', '個人資料更新成功')
            return response
        } catch (error) {
            handleError(error)
            commit('SET_ERROR', error.response?.data?.message || '更新個人資料失敗')
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async refreshToken({ commit, state }) {
        if (!state.refreshToken) {
            throw new Error('無可用的重新整理權杖')
        }

        try {
            const response = await authApi.refreshToken(state.refreshToken)
            if (!response?.accessToken) {
                throw new Error('重新整理權杖響應無效')
            }

            commit('SET_TOKENS', {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken
            })
            return response
        } catch (error) {
            commit('CLEAR_AUTH')
            handleError(error)
            throw error
        }
    },

    async checkAuth({ commit, dispatch }) {
        try {
            const token = localStorage.getItem(TOKEN_KEY)
            const user = JSON.parse(localStorage.getItem('user'))

            if (token && user) {
                commit('SET_TOKENS', {
                    accessToken: token,
                    refreshToken: localStorage.getItem(REFRESH_KEY)
                })
                commit('SET_USER', user)
                commit('SET_AUTH_STATUS', 'authenticated')
                await dispatch('getProfile')
            }
        } catch (error) {
            handleError(error)
            commit('CLEAR_AUTH')
        }
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
    token: state => state.token,
    lastLoginTime: state => state.lastLoginTime,
    hasRefreshToken: state => !!state.refreshToken,
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
