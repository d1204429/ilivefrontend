import axios from 'axios'

const state = {
    user: null,
    token: localStorage.getItem('token') || null,
    status: '',
    error: null
}

const getters = {
    isAuthenticated: state => !!state.token,
    authStatus: state => state.status,
    currentUser: state => state.user,
    authError: state => state.error
}

const actions = {
    // 登入動作
    async login({ commit }, credentials) {
        try {
            commit('auth_request')
            const response = await axios.post('/api/v1/users/login', credentials)
            const { token, user } = response.data

            localStorage.setItem('token', token)
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

            commit('auth_success', { token, user })
            return response
        } catch (error) {
            commit('auth_error', error.response?.data?.message || '登入失敗')
            localStorage.removeItem('token')
            throw error
        }
    },

    // 註冊動作
    async register({ commit, dispatch }, userData) {
        try {
            commit('auth_request')
            const response = await axios.post('/api/v1/users/register', userData)

            // 註冊成功後自動登入
            const loginCredentials = {
                email: userData.email,
                password: userData.password
            }
            await dispatch('login', loginCredentials)

            return response
        } catch (error) {
            commit('auth_error', error.response?.data?.message || '註冊失敗')
            throw error
        }
    },

    // 登出動作
    async logout({ commit }) {
        try {
            await axios.post('/api/v1/users/logout')
            localStorage.removeItem('token')
            delete axios.defaults.headers.common['Authorization']
            commit('logout')
        } catch (error) {
            console.error('登出失敗:', error)
            // 即使API呼叫失敗，仍然清除本地狀態
            localStorage.removeItem('token')
            delete axios.defaults.headers.common['Authorization']
            commit('logout')
            throw error
        }
    },

    // 初始化認證狀態
    async initAuth({ commit, dispatch }) {
        const token = localStorage.getItem('token')
        if (token) {
            commit('auth_request')
            try {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
                const response = await axios.get('/api/v1/users/profile')
                commit('auth_success', { token, user: response.data })
            } catch (error) {
                commit('auth_error', '認證已過期')
                dispatch('logout')
            }
        }
    }
}

const mutations = {
    auth_request(state) {
        state.status = 'loading'
        state.error = null
    },

    auth_success(state, { token, user }) {
        state.status = 'success'
        state.token = token
        state.user = user
        state.error = null
    },

    auth_error(state, error) {
        state.status = 'error'
        state.error = error
    },

    logout(state) {
        state.status = ''
        state.token = null
        state.user = null
        state.error = null
    },

    clear_error(state) {
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
