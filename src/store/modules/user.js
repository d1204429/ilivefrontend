import { userApi } from '@/services/api'
import authService from '@/services/auth.service'
import router from '@/router'

// Token相關常量
const TOKEN_CONFIG = {
    ACCESS_TOKEN_KEY: import.meta.env.VITE_JWT_TOKEN_KEY,
    REFRESH_TOKEN_KEY: import.meta.env.VITE_JWT_REFRESH_KEY,
    TOKEN_PREFIX: 'Bearer',
    REFRESH_INTERVAL: parseInt(import.meta.env.VITE_TOKEN_REFRESH_INTERVAL) || 15 * 60 * 1000
}

// 安全相關常量
const SECURITY_CONFIG = {
    MAX_LOGIN_ATTEMPTS: parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS) || 5,
    LOCK_DURATION: parseInt(import.meta.env.VITE_LOCK_DURATION) || 30 * 60 * 1000,
    SESSION_TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 60 * 60 * 1000,
    PASSWORD_MIN_LENGTH: parseInt(import.meta.env.VITE_PASSWORD_MIN_LENGTH) || 8
}

// 初始狀態
const INITIAL_STATE = {
    userInfo: null,
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    loading: false,
    error: null,
    successMessage: null,
    lastLoginTime: null,
    loginAttempts: 0,
    isLocked: false,
    lockUntil: null,
    sessionTimeout: null,
    tokenRefreshTimeout: null,
    isRefreshing: false,
    refreshSubscribers: [],
    pendingRequests: []
}

// State
const state = {
    ...INITIAL_STATE,
    userInfo: JSON.parse(localStorage.getItem('user')),
    isAuthenticated: !!localStorage.getItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY),
    accessToken: localStorage.getItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY),
    lastLoginTime: localStorage.getItem('lastLoginTime'),
    loginAttempts: parseInt(localStorage.getItem('loginAttempts')) || 0,
    isLocked: localStorage.getItem('isLocked') === 'true',
    lockUntil: localStorage.getItem('lockUntil')
}

// Mutations
const mutations = {
    SET_LOADING(state, status) {
        state.loading = status
    },
    SET_ERROR(state, error) {
        state.error = error || null
    },
    SET_SUCCESS_MESSAGE(state, message) {
        state.successMessage = message
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
        if (accessToken && refreshToken) {
            localStorage.setItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY, accessToken)
            localStorage.setItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY, refreshToken)
        } else {
            localStorage.removeItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY)
            localStorage.removeItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY)
        }
    },
    SET_REFRESH_STATE(state, { isRefreshing, subscribers = [] }) {
        state.isRefreshing = isRefreshing
        if (subscribers !== undefined) {
            state.refreshSubscribers = subscribers
        }
    },
    ADD_REFRESH_SUBSCRIBER(state, callback) {
        state.refreshSubscribers.push(callback)
    },
    ADD_PENDING_REQUEST(state, request) {
        state.pendingRequests.push(request)
    },
    CLEAR_PENDING_REQUESTS(state) {
        state.pendingRequests = []
    },
    CLEAR_REFRESH_SUBSCRIBERS(state) {
        state.refreshSubscribers = []
    },
    INCREMENT_LOGIN_ATTEMPTS(state) {
        state.loginAttempts++
        localStorage.setItem('loginAttempts', state.loginAttempts)

        if (state.loginAttempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
            state.isLocked = true
            state.lockUntil = new Date(Date.now() + SECURITY_CONFIG.LOCK_DURATION).toISOString()
            localStorage.setItem('isLocked', 'true')
            localStorage.setItem('lockUntil', state.lockUntil)
        }
    },
    RESET_LOGIN_ATTEMPTS(state) {
        state.loginAttempts = 0
        state.isLocked = false
        state.lockUntil = null
        localStorage.removeItem('loginAttempts')
        localStorage.removeItem('isLocked')
        localStorage.removeItem('lockUntil')
    },
    SET_SESSION_TIMEOUT(state, timeout) {
        if (state.sessionTimeout) {
            clearTimeout(state.sessionTimeout)
        }
        state.sessionTimeout = timeout
    },
    SET_TOKEN_REFRESH_TIMEOUT(state, timeout) {
        if (state.tokenRefreshTimeout) {
            clearTimeout(state.tokenRefreshTimeout)
        }
        state.tokenRefreshTimeout = timeout
    },
    CLEAR_USER_STATE(state) {
        if (state.sessionTimeout) {
            clearTimeout(state.sessionTimeout)
        }
        if (state.tokenRefreshTimeout) {
            clearTimeout(state.tokenRefreshTimeout)
        }
        Object.assign(state, { ...INITIAL_STATE })
        localStorage.removeItem('user')
        localStorage.removeItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY)
        localStorage.removeItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY)
        localStorage.removeItem('lastLoginTime')
        localStorage.removeItem('loginAttempts')
        localStorage.removeItem('isLocked')
        localStorage.removeItem('lockUntil')
    }
}
// Actions
const actions = {
    async login({ commit, dispatch }, credentials) {
        if (state.isLocked && new Date(state.lockUntil) > new Date()) {
            const remainingTime = Math.ceil((new Date(state.lockUntil) - new Date()) / 1000 / 60)
            throw new Error(`帳號已被鎖定，請等待 ${remainingTime} 分鐘後再試`)
        }

        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        commit('SET_SUCCESS_MESSAGE', null)

        try {
            const response = await authService.login(credentials.username, credentials.password)
            commit('SET_TOKENS', {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken
            })
            commit('SET_USER_INFO', response.user)
            commit('SET_AUTH_STATUS', true)
            commit('RESET_LOGIN_ATTEMPTS')
            await dispatch('setupAuthRefresh')
            return response
        } catch (error) {
            commit('INCREMENT_LOGIN_ATTEMPTS')
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async setupAuthRefresh({ dispatch, commit }) {
        const setupTokenRefresh = () => {
            const timeout = setTimeout(
                () => dispatch('refreshToken').catch(() => dispatch('logout')),
                SECURITY_CONFIG.SESSION_TIMEOUT / 2
            )
            commit('SET_TOKEN_REFRESH_TIMEOUT', timeout)
        }

        const setupSessionTimeout = () => {
            const timeout = setTimeout(
                () => dispatch('logout'),
                SECURITY_CONFIG.SESSION_TIMEOUT
            )
            commit('SET_SESSION_TIMEOUT', timeout)
        }

        setupTokenRefresh()
        setupSessionTimeout()
    },

    async refreshToken({ commit, state }) {
        if (state.isRefreshing) {
            return new Promise((resolve, reject) => {
                commit('ADD_REFRESH_SUBSCRIBER', token => {
                    if (token) {
                        resolve(token)
                    } else {
                        reject(new Error('Token refresh failed'))
                    }
                })
            })
        }

        commit('SET_REFRESH_STATE', { isRefreshing: true })

        try {
            const response = await authService.refreshToken(state.refreshToken)
            commit('SET_TOKENS', {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken
            })
            state.refreshSubscribers.forEach(callback => callback(response.accessToken))
            return response
        } catch (error) {
            state.refreshSubscribers.forEach(callback => callback(null))
            throw error
        } finally {
            commit('SET_REFRESH_STATE', { isRefreshing: false })
            commit('CLEAR_REFRESH_SUBSCRIBERS')
        }
    },

    async logout({ commit, dispatch }) {
        try {
            if (state.accessToken) {
                await authService.logout()
            }
        } catch (error) {
            console.error('登出錯誤:', error)
        } finally {
            commit('CLEAR_USER_STATE')
            await dispatch('cart/clearCart', null, { root: true })
            router.push('/login')
        }
    },
    // Actions (續)
    async fetchUserInfo({ commit, dispatch }) {
        if (!state.isAuthenticated) return null

        commit('SET_LOADING', true)
        try {
            const response = await userApi.getProfile()
            commit('SET_USER_INFO', response)
            return response
        } catch (error) {
            if (error.response?.status === 401) {
                await dispatch('handleAuthError', error)
            }
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async handleAuthError({ dispatch }, error) {
        if (error.response?.status === 401) {
            try {
                await dispatch('refreshToken')
                return true
            } catch (refreshError) {
                await dispatch('logout')
                return false
            }
        }
        return false
    },

    async updateUserInfo({ commit }, userData) {
        commit('SET_LOADING', true)
        try {
            const response = await userApi.updateProfile(userData)
            commit('SET_USER_INFO', response)
            commit('SET_SUCCESS_MESSAGE', '個人資料更新成功')
            return response
        } catch (error) {
            commit('SET_ERROR', error.message)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async checkAuth({ commit, dispatch }) {
        const token = localStorage.getItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY)
        const user = JSON.parse(localStorage.getItem('user'))

        if (!token || !user) {
            commit('CLEAR_USER_STATE')
            return false
        }

        try {
            commit('SET_TOKENS', {
                accessToken: token,
                refreshToken: localStorage.getItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY)
            })
            commit('SET_USER_INFO', user)
            commit('SET_AUTH_STATUS', true)
            await dispatch('fetchUserInfo')
            await dispatch('setupAuthRefresh')
            return true
        } catch (error) {
            commit('CLEAR_USER_STATE')
            return false
        }
    }
}

// Getters
const getters = {
    isAuthenticated: state => state.isAuthenticated,
    currentUser: state => state.userInfo,
    accessToken: state => state.accessToken,
    refreshToken: state => state.refreshToken,
    loading: state => state.loading,
    error: state => state.error,
    successMessage: state => state.successMessage,
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
    },
    isRefreshing: state => state.isRefreshing,
    pendingRequests: state => state.pendingRequests,
    userPermissions: state => state.userInfo?.permissions || [],
    userRoles: state => state.userInfo?.roles || [],
    isSessionValid: state => {
        if (!state.lastLoginTime) return false
        const sessionTimeout = SECURITY_CONFIG.SESSION_TIMEOUT
        const lastLogin = new Date(state.lastLoginTime).getTime()
        return (Date.now() - lastLogin) < sessionTimeout
    }
}

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
}
