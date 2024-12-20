import api from '@/utils/axios'
import router from '@/router'

const TOKEN_KEY = import.meta.env.VITE_JWT_TOKEN_KEY
const REFRESH_TOKEN_KEY = import.meta.env.VITE_JWT_REFRESH_KEY

const state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem(TOKEN_KEY) || null,
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) || null,
    loading: false,
    error: null,
    successMessage: null,
    authStatus: null
}

const getters = {
    isAuthenticated: state => !!state.token && !!state.user,
    currentUser: state => state.user,
    isAdmin: state => state.user?.role === 'ADMIN',
    isLoading: state => state.loading,
    error: state => state.error,
    successMessage: state => state.successMessage,
    authStatus: state => state.authStatus
}

const actions = {
    async login({ commit, dispatch }, credentials) {
        commit('SET_LOADING', true)
        commit('CLEAR_ERROR')
        commit('SET_AUTH_STATUS', 'logging-in')

        try {
            const response = await api.post('/users/login', credentials)
            const { accessToken, refreshToken, user } = response

            if (!accessToken || !refreshToken || !user) {
                throw new Error('登入回應格式錯誤')
            }

            localStorage.setItem(TOKEN_KEY, accessToken)
            localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
            localStorage.setItem('user', JSON.stringify(user))

            commit('AUTH_SUCCESS', { token: accessToken, refreshToken, user })
            commit('SET_AUTH_STATUS', 'authenticated')
            await dispatch('initializeUserData')

            return response
        } catch (error) {
            commit('AUTH_ERROR', error.message || '登入失敗')
            commit('SET_AUTH_STATUS', 'error')
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async register({ commit }, userData) {
        commit('SET_LOADING', true)
        commit('CLEAR_ERROR')

        try {
            const response = await api.post('/users/register', userData)
            commit('SET_SUCCESS_MESSAGE', '註冊成功，請登入')
            return response
        } catch (error) {
            commit('AUTH_ERROR', error.message || '註冊失敗')
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async refreshToken({ commit, state }) {
        if (!state.refreshToken) {
            throw new Error('No refresh token available')
        }

        try {
            const response = await api.post('/users/refresh-token', {
                refreshToken: state.refreshToken
            })

            const { accessToken, refreshToken } = response
            localStorage.setItem(TOKEN_KEY, accessToken)
            localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)

            commit('UPDATE_TOKENS', { accessToken, refreshToken })
            return response
        } catch (error) {
            commit('CLEAR_AUTH')
            throw error
        }
    },

    async logout({ commit }) {
        try {
            if (state.token) {
                await api.post('/users/logout')
            }
        } catch (error) {
            console.error('登出錯誤:', error)
        } finally {
            commit('CLEAR_AUTH')
            commit('SET_AUTH_STATUS', null)
            router.push('/login')
        }
    },

    async fetchUserProfile({ commit, state }) {
        try {
            const userId = state.user?.userId
            if (!userId) throw new Error('用戶未登入')

            const response = await api.get(`/users/${userId}`)
            commit('UPDATE_USER', response)
            return response
        } catch (error) {
            commit('AUTH_ERROR', error.message)
            throw error
        }
    },

    async updateProfile({ commit, state }, profileData) {
        commit('SET_LOADING', true)
        commit('CLEAR_ERROR')

        try {
            const userId = state.user?.userId
            if (!userId) throw new Error('用戶未登入')

            const response = await api.put(`/users/${userId}`, profileData)
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

    async changePassword({ commit, state }, passwordData) {
        commit('SET_LOADING', true)
        commit('CLEAR_ERROR')

        try {
            const userId = state.user?.userId
            if (!userId) throw new Error('用戶未登入')

            await api.put(`/users/${userId}/password`, passwordData)
            commit('SET_SUCCESS_MESSAGE', '密碼修改成功')
        } catch (error) {
            commit('AUTH_ERROR', error.message)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

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

    checkAuth({ commit, dispatch }) {
        const token = localStorage.getItem(TOKEN_KEY)
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
        const user = JSON.parse(localStorage.getItem('user'))

        if (token && refreshToken && user) {
            commit('AUTH_SUCCESS', { token, refreshToken, user })
            commit('SET_AUTH_STATUS', 'authenticated')
            dispatch('initializeUserData')
        } else {
            commit('SET_AUTH_STATUS', null)
        }
    }
}

const mutations = {
    SET_LOADING(state, status) {
        state.loading = status
    },

    AUTH_SUCCESS(state, { token, refreshToken, user }) {
        state.token = token
        state.refreshToken = refreshToken
        state.user = user
        state.error = null
    },

    UPDATE_TOKENS(state, { accessToken, refreshToken }) {
        state.token = accessToken
        state.refreshToken = refreshToken
    },

    AUTH_ERROR(state, error) {
        state.error = error
        state.authStatus = 'error'
    },

    UPDATE_USER(state, user) {
        state.user = { ...state.user, ...user }
        localStorage.setItem('user', JSON.stringify(state.user))
    },

    CLEAR_AUTH(state) {
        state.token = null
        state.refreshToken = null
        state.user = null
        state.error = null
        state.successMessage = null
        state.authStatus = null
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
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
    },

    SET_AUTH_STATUS(state, status) {
        state.authStatus = status
    }
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
