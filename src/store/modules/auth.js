import { authApi } from '@/services/api'
import { handleError } from '@/utils/errorHandler'

// Constants
const TOKEN_KEY = import.meta.env.VITE_JWT_TOKEN_KEY
const REFRESH_KEY = import.meta.env.VITE_JWT_REFRESH_KEY
const INITIAL_STATE = {
    user: null,
    token: null,
    refreshToken: null,
    loading: false,
    error: null,
    authStatus: null,
    successMessage: null,
    lastLoginTime: null
}

// State
const state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem(TOKEN_KEY) || null,
    refreshToken: localStorage.getItem(REFRESH_KEY) || null,
    loading: false,
    error: null,
    authStatus: null,
    successMessage: null,
    lastLoginTime: localStorage.getItem('lastLoginTime') || null
}

// Mutations
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
    CLEAR_AUTH(state) {
        Object.assign(state, { ...INITIAL_STATE })
        localStorage.removeItem('user')
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_KEY)
        localStorage.removeItem('lastLoginTime')
    },
    UPDATE_USER(state, userData) {
        state.user = { ...state.user, ...userData }
        localStorage.setItem('user', JSON.stringify(state.user))
    }
}

// Actions
const actions = {
    async login({ commit, dispatch }, credentials) {
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
            commit('SET_SUCCESS_MESSAGE', '登入成功')

            await dispatch('fetchUserProfile')
            return response
        } catch (error) {
            const errorMessage = error.response?.data?.message || '登入失敗，請檢查帳號密碼'
            handleError(error)
            commit('SET_ERROR', errorMessage)
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

    async logout({ commit, state, dispatch }) {
        try {
            if (state.token) {
                await authApi.logout()
            }
        } catch (error) {
            console.error('登出錯誤:', error)
        } finally {
            await dispatch('clearUserData')
            commit('CLEAR_AUTH')
        }
    },

    async refreshToken({ commit, state }) {
        if (!state.refreshToken) {
            throw new Error('無可用的重新整理權杖')
        }

        try {
            const response = await authApi.refreshToken(state.refreshToken)
            if (!response?.accessToken) {
                throw new Error('無效的重新整理權杖回應')
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
                await dispatch('fetchUserProfile')
            }
        } catch (error) {
            handleError(error)
            commit('CLEAR_AUTH')
        }
    },

    async fetchUserProfile({ commit }) {
        try {
            const response = await authApi.getUserProfile()
            if (response) {
                commit('SET_USER', response)
            }
        } catch (error) {
            console.error('獲取用戶資料失敗:', error)
            if (error.response?.status === 401) {
                commit('CLEAR_AUTH')
            }
            handleError(error)
        }
    },

    async updateUserProfile({ commit }, userData) {
        commit('SET_LOADING', true)

        try {
            const response = await authApi.updateUserProfile(userData)
            commit('UPDATE_USER', response)
            commit('SET_SUCCESS_MESSAGE', '個人資料更新成功')
            return response
        } catch (error) {
            handleError(error)
            commit('SET_ERROR', error.response?.data?.message || '更新個人資料失敗')
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },async syncUserProfile({ commit, dispatch }) {
        try {
            commit('SET_LOADING', true)
            await dispatch('fetchUserProfile')
            commit('SET_SUCCESS_MESSAGE', '資料同步成功')
        } catch (error) {
            handleError(error)
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async changePassword({ commit }, passwordData) {
        commit('SET_LOADING', true)

        try {
            await authApi.changePassword(passwordData)
            commit('SET_SUCCESS_MESSAGE', '密碼更改成功')
        } catch (error) {
            handleError(error)
            commit('SET_ERROR', error.response?.data?.message || '更改密碼失敗')
            throw error
        } finally {
            commit('SET_LOADING', false)
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

// Getters
const getters = {
    isAuthenticated: state => !!state.token && !!state.user,
    currentUser: state => state.user,
    isLoading: state => state.loading,
    error: state => state.error,
    successMessage: state => state.successMessage,
    authStatus: state => state.authStatus,
    token: state => state.token,
    lastLoginTime: state => state.lastLoginTime,
    hasRefreshToken: state => !!state.refreshToken
}

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
}
