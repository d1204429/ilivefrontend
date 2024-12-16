import axios from 'axios'
import authService from '@/services/auth.service'

const state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    status: '',
    error: null,
    loading: false
}

const getters = {
    isAuthenticated: state => !!state.accessToken,
    authStatus: state => state.status,
    currentUser: state => state.user,
    authError: state => state.error,
    isLoading: state => state.loading,
    hasError: state => !!state.error
}

const actions = {
    // 登入動作
    async login({ commit }, { username, password }) {
        commit('SET_LOADING', true)
        try {
            commit('CLEAR_ERROR')
            const response = await authService.login(username, password)
            const { accessToken, refreshToken, user } = response

            // 儲存認證資訊
            localStorage.setItem('accessToken', accessToken)
            localStorage.setItem('refreshToken', refreshToken)
            localStorage.setItem('user', JSON.stringify(user))

            commit('AUTH_SUCCESS', { accessToken, refreshToken, user })
            return response
        } catch (error) {
            commit('AUTH_ERROR', error.message)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // 註冊動作
    async register({ commit }, userData) {
        commit('SET_LOADING', true)
        try {
            commit('CLEAR_ERROR')
            const response = await authService.register(userData)
            return response
        } catch (error) {
            commit('AUTH_ERROR', error.message)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // 登出動作
    async logout({ commit }) {
        try {
            commit('CLEAR_ERROR')
            // 清除本地儲存
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')

            // 重置狀態
            commit('LOGOUT')

            // 清除 axios 預設標頭
            delete axios.defaults.headers.common['Authorization']
        } catch (error) {
            commit('AUTH_ERROR', '登出時發生錯誤')
            throw error
        }
    },

    // 刷新令牌
    async refreshToken({ commit, state }) {
        try {
            if (!state.refreshToken) {
                throw new Error('No refresh token available')
            }

            const response = await authService.refreshToken(state.refreshToken)
            const { accessToken, refreshToken } = response

            localStorage.setItem('accessToken', accessToken)
            localStorage.setItem('refreshToken', refreshToken)

            commit('UPDATE_TOKENS', { accessToken, refreshToken })
            return response
        } catch (error) {
            commit('AUTH_ERROR', '令牌刷新失敗')
            commit('LOGOUT')
            throw error
        }
    },

    // 更新用戶資料
    async updateProfile({ commit, state }, userData) {
        commit('SET_LOADING', true)
        try {
            commit('CLEAR_ERROR')
            const response = await authService.updateProfile(state.user.id, userData)
            const updatedUser = response.data

            localStorage.setItem('user', JSON.stringify(updatedUser))
            commit('UPDATE_USER', updatedUser)

            return response
        } catch (error) {
            commit('AUTH_ERROR', '更新用戶資料失敗')
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // 修改密碼
    async changePassword({ commit, state }, { oldPassword, newPassword }) {
        commit('SET_LOADING', true)
        try {
            commit('CLEAR_ERROR')
            await authService.changePassword(state.user.id, oldPassword, newPassword)
            commit('SET_SUCCESS_MESSAGE', '密碼修改成功')
        } catch (error) {
            commit('AUTH_ERROR', '密碼修改失敗')
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    // 初始化認證狀態
    async initAuth({ commit, dispatch }) {
        const accessToken = localStorage.getItem('accessToken')
        const user = JSON.parse(localStorage.getItem('user'))

        if (accessToken && user) {
            commit('AUTH_SUCCESS', {
                accessToken,
                refreshToken: localStorage.getItem('refreshToken'),
                user
            })

            // 設定 axios 預設標頭
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        }
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
    },

    CLEAR_ERROR(state) {
        state.error = null
    },

    SET_SUCCESS_MESSAGE(state, message) {
        state.status = 'success'
        state.error = null
    }
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
