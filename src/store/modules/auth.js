import axios from 'axios'
import authService from '@/services/auth.service'
import router from '@/router'

const state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    status: '',
    error: null,
    loading: false,
    lastLoginTime: localStorage.getItem('lastLoginTime') || null,
    successMessage: null
}

const getters = {
    isAuthenticated: state => !!state.accessToken && !!state.user,
    authStatus: state => state.status,
    currentUser: state => state.user,
    authError: state => state.error,
    isLoading: state => state.loading,
    hasError: state => !!state.error,
    successMessage: state => state.successMessage,
    userRole: state => state.user?.role || 'guest',
    isAdmin: state => state.user?.role === 'ADMIN',
    lastLoginTime: state => state.lastLoginTime
}

const actions = {
    async login({ commit, dispatch }, { username, password }) {
        commit('SET_LOADING', true)
        commit('CLEAR_ERROR')
        try {
            const response = await authService.login(username, password)
            const { accessToken, refreshToken, user } = response

            localStorage.setItem('accessToken', accessToken)
            localStorage.setItem('refreshToken', refreshToken)
            localStorage.setItem('user', JSON.stringify(user))
            localStorage.setItem('lastLoginTime', new Date().toISOString())

            commit('AUTH_SUCCESS', { accessToken, refreshToken, user })
            dispatch('initUserData')
            return response
        } catch (error) {
            commit('AUTH_ERROR', error.message || '登入失敗')
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async register({ commit }, userData) {
        commit('SET_LOADING', true)
        commit('CLEAR_ERROR')
        try {
            const response = await authService.register(userData)
            commit('SET_SUCCESS_MESSAGE', '註冊成功，請登入')
            return response
        } catch (error) {
            commit('AUTH_ERROR', error.message || '註冊失敗')
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async logout({ commit, dispatch }) {
        try {
            commit('CLEAR_ERROR')
            await authService.logout()
        } catch (error) {
            console.error('登出時發生錯誤:', error)
        } finally {
            dispatch('clearUserData')
            router.push('/login')
        }
    },

    async refreshToken({ commit, dispatch, state }) {
        try {
            if (!state.refreshToken) {
                throw new Error('無可用的重整Token')
            }

            const response = await authService.refreshToken(state.refreshToken)
            const { accessToken, refreshToken } = response

            localStorage.setItem('accessToken', accessToken)
            localStorage.setItem('refreshToken', refreshToken)

            commit('UPDATE_TOKENS', { accessToken, refreshToken })
            return response
        } catch (error) {
            dispatch('clearUserData')
            router.push('/login')
            throw error
        }
    },

    async updateProfile({ commit }, userData) {
        commit('SET_LOADING', true)
        commit('CLEAR_ERROR')
        try {
            const response = await authService.updateProfile(userData)
            const updatedUser = { ...state.user, ...response.data }

            localStorage.setItem('user', JSON.stringify(updatedUser))
            commit('UPDATE_USER', updatedUser)
            commit('SET_SUCCESS_MESSAGE', '個人資料更新成功')

            return response
        } catch (error) {
            commit('AUTH_ERROR', error.message || '更新個人資料失敗')
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async changePassword({ commit }, passwords) {
        commit('SET_LOADING', true)
        commit('CLEAR_ERROR')
        try {
            await authService.changePassword(passwords)
            commit('SET_SUCCESS_MESSAGE', '密碼修改成功')
        } catch (error) {
            commit('AUTH_ERROR', error.message || '密碼修改失敗')
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async initAuth({ commit, dispatch }) {
        const accessToken = localStorage.getItem('accessToken')
        const user = JSON.parse(localStorage.getItem('user'))
        const lastLoginTime = localStorage.getItem('lastLoginTime')

        if (accessToken && user) {
            commit('AUTH_SUCCESS', {
                accessToken,
                refreshToken: localStorage.getItem('refreshToken'),
                user
            })
            commit('SET_LAST_LOGIN_TIME', lastLoginTime)
            await dispatch('validateSession')
        }
    },

    async validateSession({ dispatch, state }) {
        try {
            await authService.verifyToken()
        } catch (error) {
            dispatch('clearUserData')
        }
    },

    async initUserData({ dispatch }) {
        try {
            await dispatch('cart/fetchCartItems', null, { root: true })
            await dispatch('user/fetchUserPreferences', null, { root: true })
        } catch (error) {
            console.error('初始化用戶資料失敗:', error)
        }
    },

    clearUserData({ commit }) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        localStorage.removeItem('lastLoginTime')

        delete axios.defaults.headers.common['Authorization']
        commit('LOGOUT')
        commit('cart/CLEAR_CART', null, { root: true })
        commit('user/CLEAR_USER_DATA', null, { root: true })
    }
}

const mutations = {
    SET_LOADING(state, status) {
        state.loading = status
    },

    AUTH_SUCCESS(state, { accessToken, refreshToken, user }) {
        state.status = 'success'
        state.accessToken = accessToken
        state.refreshToken = refreshToken
        state.user = user
        state.error = null
        state.lastLoginTime = new Date().toISOString()
    },

    AUTH_ERROR(state, error) {
        state.status = 'error'
        state.error = error
    },

    UPDATE_TOKENS(state, { accessToken, refreshToken }) {
        state.accessToken = accessToken
        state.refreshToken = refreshToken
    },

    UPDATE_USER(state, user) {
        state.user = user
    },

    LOGOUT(state) {
        state.status = ''
        state.accessToken = null
        state.refreshToken = null
        state.user = null
        state.error = null
        state.lastLoginTime = null
        state.successMessage = null
    },

    CLEAR_ERROR(state) {
        state.error = null
    },

    SET_SUCCESS_MESSAGE(state, message) {
        state.status = 'success'
        state.successMessage = message
        state.error = null
    },

    CLEAR_SUCCESS_MESSAGE(state) {
        state.successMessage = null
    },

    SET_LAST_LOGIN_TIME(state, time) {
        state.lastLoginTime = time
    }
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
