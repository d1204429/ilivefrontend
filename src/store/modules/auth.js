import { apiService } from '@/utils/axios'
import { handleError } from '@/utils/errorHandler'
import router from '@/router'

// 常量配置
const TOKEN_CONFIG = {
    ACCESS_TOKEN_KEY: import.meta.env.VITE_JWT_TOKEN_KEY,
    REFRESH_TOKEN_KEY: import.meta.env.VITE_JWT_REFRESH_KEY,
    TOKEN_PREFIX: 'Bearer',
    REFRESH_INTERVAL: parseInt(import.meta.env.VITE_TOKEN_REFRESH_INTERVAL) || 15 * 60 * 1000,
    SESSION_TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 60 * 60 * 1000,
    TOKEN_EXPIRY_MARGIN: 5 * 60 * 1000 // 5分鐘提前更新
}

const SECURITY_CONFIG = {
    MAX_LOGIN_ATTEMPTS: parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS) || 5,
    LOCK_DURATION: parseInt(import.meta.env.VITE_LOCK_DURATION) || 30 * 60 * 1000,
    PASSWORD_MIN_LENGTH: parseInt(import.meta.env.VITE_PASSWORD_MIN_LENGTH) || 8,
    AUTO_LOGOUT_IDLE_TIME: parseInt(import.meta.env.VITE_AUTO_LOGOUT_IDLE_TIME) || 30 * 60 * 1000
}

// Token 管理器
const tokenManager = {
    getTokens() {
        return {
            accessToken: localStorage.getItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY),
            refreshToken: localStorage.getItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY)
        }
    },
    setTokens(accessToken, refreshToken) {
        if (accessToken) localStorage.setItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY, accessToken)
        if (refreshToken) localStorage.setItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY, refreshToken)
    },
    removeTokens() {
        localStorage.removeItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY)
        localStorage.removeItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY)
    },
    getAuthHeader(token) {
        return token ? `${TOKEN_CONFIG.TOKEN_PREFIX} ${token}` : null
    }
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
    lastActivityTime: null,
    loginAttempts: 0,
    isLocked: false,
    lockUntil: null,
    sessionTimeout: null,
    tokenRefreshTimeout: null,
    isRefreshing: false,
    refreshSubscribers: [],
    idleTimeout: null
}

// State
const state = {
    ...INITIAL_STATE,
    user: JSON.parse(localStorage.getItem('user')),
    ...tokenManager.getTokens(),
    lastLoginTime: localStorage.getItem('lastLoginTime'),
    lastActivityTime: Date.now(),
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
            tokenManager.setTokens(accessToken, refreshToken)
        } else {
            state.token = null
            state.refreshToken = null
            tokenManager.removeTokens()
        }
    },
    UPDATE_ACTIVITY_TIME(state) {
        state.lastActivityTime = Date.now()
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
    SET_IDLE_TIMEOUT(state, timeout) {
        if (state.idleTimeout) {
            clearTimeout(state.idleTimeout)
        }
        state.idleTimeout = timeout
    },
    CLEAR_AUTH(state) {
        [state.sessionTimeout, state.tokenRefreshTimeout, state.idleTimeout].forEach(timeout => {
            if (timeout) clearTimeout(timeout)
        })
        Object.assign(state, { ...INITIAL_STATE })
        localStorage.removeItem('user')
        tokenManager.removeTokens()
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
            const response = await apiService.auth.login(credentials)
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
            commit('UPDATE_ACTIVITY_TIME')
            commit('SET_SUCCESS_MESSAGE', '登入成功')

            await dispatch('setupAuthRefresh')
            await dispatch('setupIdleTimeout')
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
                TOKEN_CONFIG.REFRESH_INTERVAL - TOKEN_CONFIG.TOKEN_EXPIRY_MARGIN
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

    setupIdleTimeout({ commit, dispatch }) {
        const timeout = setTimeout(
            () => dispatch('logout'),
            SECURITY_CONFIG.AUTO_LOGOUT_IDLE_TIME
        )
        commit('SET_IDLE_TIMEOUT', timeout)
    },

    updateActivity({ commit, dispatch }) {
        commit('UPDATE_ACTIVITY_TIME')
        dispatch('setupIdleTimeout')
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
            const response = await apiService.auth.refreshToken(state.refreshToken)
            if (!response?.accessToken) {
                throw new Error('無效的token刷新響應')
            }

            commit('SET_TOKENS', {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken
            })
            commit('UPDATE_ACTIVITY_TIME')

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
                await apiService.auth.logout()
            }
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            commit('CLEAR_AUTH')
            await dispatch('cart/clearCart', null, { root: true })
            router.push('/')
        }
    },
    async getProfile({ commit, dispatch }) {
        if (!state.token) return null

        try {
            const response = await apiService.user.getProfile()
            if (response) {
                commit('SET_USER', response)
                commit('UPDATE_ACTIVITY_TIME')
                return response
            }
            throw new Error('獲取用戶資料失敗')
        } catch (error) {
            if (error.response?.status === 401) {
                try {
                    await dispatch('refreshToken')
                    return dispatch('getProfile')
                } catch (refreshError) {
                    await dispatch('handleAuthError', error)
                }
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
                if (router.currentRoute.value.meta.requiresAuth) {
                    await dispatch('logout')
                }
                return false
            }
        }
        return false
    },

    async checkAuth({ commit, dispatch }) {
        const { accessToken, refreshToken } = tokenManager.getTokens()
        const user = JSON.parse(localStorage.getItem('user'))

        if (!accessToken && !user) {
            commit('CLEAR_AUTH')
            return false
        }

        try {
            if (accessToken) {
                commit('SET_TOKENS', { accessToken, refreshToken })
                if (user) {
                    commit('SET_USER', user)
                    commit('SET_AUTH_STATUS', 'authenticated')
                    commit('UPDATE_ACTIVITY_TIME')

                    // 只在需要身份驗證的頁面才自動獲取用戶資料
                    if (router.currentRoute.value.meta.requiresAuth) {
                        await dispatch('getProfile')
                    }

                    await dispatch('setupAuthRefresh')
                    await dispatch('setupIdleTimeout')
                    return true
                }
            }

            // 如果沒有 token 但有用戶資料，清除用戶資料
            if (!accessToken && user) {
                commit('CLEAR_AUTH')
            }

            return false
        } catch (error) {
            console.error('Check auth error:', error)
            commit('CLEAR_AUTH')
            return false
        }
    },

    async initializeAuth({ dispatch }) {
        try {
            const isAuthenticated = await dispatch('checkAuth')
            if (!isAuthenticated && router.currentRoute.value.meta.requiresAuth) {
                const currentPath = router.currentRoute.value.fullPath
                router.push({
                    path: '/login',
                    query: { redirect: currentPath }
                })
            }
        } catch (error) {
            console.error('Initialize auth error:', error)
        }
    },

    async updateProfile({ commit, dispatch }, profileData) {
        try {
            const response = await apiService.user.updateProfile(profileData)
            if (response) {
                commit('SET_USER', response)
                commit('UPDATE_ACTIVITY_TIME')
                return response
            }
            throw new Error('更新用戶資料失敗')
        } catch (error) {
            if (error.response?.status === 401) {
                try {
                    await dispatch('refreshToken')
                    return dispatch('updateProfile', profileData)
                } catch (refreshError) {
                    await dispatch('handleAuthError', error)
                }
            }
            throw error
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
    lastActivityTime: state => state.lastActivityTime,
    hasRefreshToken: state => !!state.refreshToken,
    isAccountLocked: state => state.isLocked,
    remainingLockTime: state => {
        if (!state.lockUntil) return 0
        return Math.max(0, new Date(state.lockUntil) - new Date())
    },
    isSessionExpired: state => {
        if (!state.lastActivityTime) return true
        return Date.now() - state.lastActivityTime >= SECURITY_CONFIG.AUTO_LOGOUT_IDLE_TIME
    },
    isTokenExpired: state => {
        if (!state.token) return true
        const lastRefresh = state.lastActivityTime || Date.now()
        return Date.now() - lastRefresh >= TOKEN_CONFIG.REFRESH_INTERVAL
    }
}

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
}
