import { authApi } from '@/services/api'
import { handleError } from '@/utils/errorHandler'
import router from '@/router'

// 常量配置
const TOKEN_CONFIG = {
    ACCESS_TOKEN_KEY: import.meta.env.VITE_JWT_TOKEN_KEY,
    REFRESH_TOKEN_KEY: import.meta.env.VITE_JWT_REFRESH_KEY,
    TOKEN_PREFIX: 'Bearer',
    REFRESH_INTERVAL: parseInt(import.meta.env.VITE_TOKEN_REFRESH_INTERVAL) || 15 * 60 * 1000,
    SESSION_TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 60 * 60 * 1000
}

const SECURITY_CONFIG = {
    MAX_LOGIN_ATTEMPTS: parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS) || 5,
    LOCK_DURATION: parseInt(import.meta.env.VITE_LOCK_DURATION) || 30 * 60 * 1000,
    PASSWORD_MIN_LENGTH: parseInt(import.meta.env.VITE_PASSWORD_MIN_LENGTH) || 8
}

// 初始狀態
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
    lockUntil: null,
    sessionTimeout: null,
    tokenRefreshTimeout: null,
    isRefreshing: false,
    refreshSubscribers: []
}

// State
const state = {
    ...INITIAL_STATE,
    user: JSON.parse(localStorage.getItem('user')),
    token: localStorage.getItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY),
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
        if (accessToken && refreshToken) {
            state.token = accessToken
            state.refreshToken = refreshToken
            localStorage.setItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY, accessToken)
            localStorage.setItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY, refreshToken)
        } else {
            state.token = null
            state.refreshToken = null
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
    CLEAR_AUTH(state) {
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

            await dispatch('setupAuthRefresh')
            return response
        } catch (error) {
            commit('INCREMENT_LOGIN_ATTEMPTS')
            const errorMessage = error.response?.data?.message || '登入失敗，請檢查帳號密碼'
            commit('SET_ERROR', errorMessage)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async setupAuthRefresh({ dispatch, commit }) {
        const setupTokenRefresh = () => {
            const timeout = setTimeout(
                () => dispatch('refreshToken').catch(() => dispatch('logout')),
                TOKEN_CONFIG.REFRESH_INTERVAL
            )
            commit('SET_TOKEN_REFRESH_TIMEOUT', timeout)
        }

        const setupSessionTimeout = () => {
            const timeout = setTimeout(
                () => dispatch('logout'),
                TOKEN_CONFIG.SESSION_TIMEOUT
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
            const response = await authApi.refreshToken(state.refreshToken)
            if (!response?.accessToken) {
                throw new Error('無效的token刷新響應')
            }

            commit('SET_TOKENS', {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken
            })

            state.refreshSubscribers.forEach(callback => callback(response.accessToken))
            commit('CLEAR_REFRESH_SUBSCRIBERS')
            return response
        } catch (error) {
            state.refreshSubscribers.forEach(callback => callback(null))
            commit('CLEAR_REFRESH_SUBSCRIBERS')
            throw error
        } finally {
            commit('SET_REFRESH_STATE', { isRefreshing: false })
        }
    },

    async logout({ commit, dispatch }) {
        try {
            if (state.token) {
                await authApi.logout()
            }
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            commit('CLEAR_AUTH')
            await dispatch('cart/clearCart', null, { root: true })
            router.push('/login')
        }
    },

    async getProfile({ commit, dispatch }) {
        if (!state.token) return null

        try {
            const response = await authApi.getProfile()
            commit('SET_USER', response)
            return response
        } catch (error) {
            if (error.response?.status === 401) {
                await dispatch('handleAuthError', error)
            }
            throw error
        }
    },

    async handleAuthError({ dispatch }, error) {
        if (error.response?.status === 401 && !error.config?._retry) {
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

    async checkAuth({ commit, dispatch }) {
        const token = localStorage.getItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY)
        const user = JSON.parse(localStorage.getItem('user'))

        if (!token || !user) {
            commit('CLEAR_AUTH')
            return false
        }

        try {
            commit('SET_TOKENS', {
                accessToken: token,
                refreshToken: localStorage.getItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY)
            })
            commit('SET_USER', user)
            commit('SET_AUTH_STATUS', 'authenticated')

            await dispatch('getProfile')
            await dispatch('setupAuthRefresh')
            return true
        } catch (error) {
            commit('CLEAR_AUTH')
            return false
        }
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
