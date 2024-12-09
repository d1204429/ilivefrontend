const state = {
    userInfo: null,
    isAuthenticated: false,
    token: localStorage.getItem('token') || null
}

const mutations = {
    SET_USER_INFO(state, userInfo) {
        state.userInfo = userInfo
    },
    SET_AUTH_STATUS(state, status) {
        state.isAuthenticated = status
    },
    SET_TOKEN(state, token) {
        state.token = token
        if (token) {
            localStorage.setItem('token', token)
        } else {
            localStorage.removeItem('token')
        }
    },
    CLEAR_USER_DATA(state) {
        state.userInfo = null
        state.isAuthenticated = false
        state.token = null
        localStorage.removeItem('token')
    }
}

const actions = {
    // 登入
    async login({ commit }, credentials) {
        try {
            const response = await axios.post('/api/v1/users/login', credentials)
            const { token, user } = response.data
            commit('SET_TOKEN', token)
            commit('SET_USER_INFO', user)
            commit('SET_AUTH_STATUS', true)
            return response.data
        } catch (error) {
            throw error
        }
    },

    // 登出
    async logout({ commit }) {
        try {
            await axios.post('/api/v1/users/logout')
            commit('CLEAR_USER_DATA')
        } catch (error) {
            commit('CLEAR_USER_DATA')
            throw error
        }
    },

    // 獲取用戶資訊
    async fetchUserInfo({ commit }) {
        try {
            const response = await axios.get('/api/v1/users/profile')
            commit('SET_USER_INFO', response.data)
            return response.data
        } catch (error) {
            throw error
        }
    },

    // 更新用戶資訊
    async updateUserInfo({ commit }, userData) {
        try {
            const response = await axios.put('/api/v1/users/profile', userData)
            commit('SET_USER_INFO', response.data)
            return response.data
        } catch (error) {
            throw error
        }
    },

    // 修改密碼
    async changePassword({ commit }, passwords) {
        try {
            await axios.put('/api/v1/users/password', passwords)
        } catch (error) {
            throw error
        }
    },

    // 註冊
    async register({ commit }, userData) {
        try {
            const response = await axios.post('/api/v1/users/register', userData)
            return response.data
        } catch (error) {
            throw error
        }
    }
}

const getters = {
    isAuthenticated: state => state.isAuthenticated,
    userInfo: state => state.userInfo,
    token: state => state.token
}

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
}
