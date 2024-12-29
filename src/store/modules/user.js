// src/store/modules/user.js
import { userApi } from '@/services/api'
import authService from '@/services/auth.service'
import router from '@/router'

// Token 配置
const TOKEN_CONFIG = {
    ACCESS_TOKEN_KEY: import.meta.env.VITE_JWT_TOKEN_KEY || 'access_token',
    REFRESH_TOKEN_KEY: import.meta.env.VITE_JWT_REFRESH_KEY || 'refresh_token',
    TOKEN_PREFIX: 'Bearer',
    TOKEN_EXPIRY: parseInt(import.meta.env.VITE_JWT_EXPIRY) || 30 * 60 * 1000
}

// 安全配置
const SECURITY_CONFIG = {
    MAX_LOGIN_ATTEMPTS: parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS) || 5,
    LOCK_DURATION: parseInt(import.meta.env.VITE_LOCK_DURATION) || 30 * 60 * 1000,
    SESSION_TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 60 * 60 * 1000,
    PASSWORD_MIN_LENGTH: 8,
    REFRESH_THRESHOLD: 5 * 60 * 1000,
    PASSWORD_PATTERN: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
}

// 初始狀態
const state = {
    userInfo: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY),
    accessToken: localStorage.getItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY) || null,
    refreshToken: localStorage.getItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY) || null,
    loading: false,
    error: null,
    successMessage: null,
    lastLoginTime: localStorage.getItem('lastLoginTime') || null,
    loginAttempts: parseInt(localStorage.getItem('loginAttempts')) || 0,
    isLocked: localStorage.getItem('isLocked') === 'true',
    lockUntil: localStorage.getItem('lockUntil') || null,
    sessionTimeout: null,
    tokenRefreshTimeout: null,
    isRefreshing: false,
    refreshSubscribers: [],
    userPreferences: JSON.parse(localStorage.getItem('userPreferences')) || {},
    passwordResetToken: null,
    passwordResetExpiry: null,
    verificationStatus: localStorage.getItem('verificationStatus') || 'unverified',
    lastPasswordChange: localStorage.getItem('lastPasswordChange') || null,
    securityQuestions: JSON.parse(localStorage.getItem('securityQuestions')) || [],
    twoFactorEnabled: localStorage.getItem('twoFactorEnabled') === 'true',
    twoFactorSecret: null,
    loginHistory: JSON.parse(localStorage.getItem('loginHistory')) || []
}
// mutations
const mutations = {
    SET_LOADING(state, status) {
        state.loading = status
    },
    SET_ERROR(state, error) {
        state.error = error || null
        if (error) {
            setTimeout(() => {
                state.error = null
            }, 3000)
        }
    },
    SET_SUCCESS_MESSAGE(state, message) {
        state.successMessage = message
        if (message) {
            setTimeout(() => {
                state.successMessage = null
            }, 3000)
        }
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
    SET_USER_PREFERENCES(state, preferences) {
        state.userPreferences = { ...state.userPreferences, ...preferences }
        localStorage.setItem('userPreferences', JSON.stringify(state.userPreferences))
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
    SET_VERIFICATION_STATUS(state, status) {
        state.verificationStatus = status
        localStorage.setItem('verificationStatus', status)
    },
    SET_PASSWORD_RESET_TOKEN(state, { token, expiry }) {
        state.passwordResetToken = token
        state.passwordResetExpiry = expiry
    },
    UPDATE_LOGIN_HISTORY(state, loginData) {
        state.loginHistory.push(loginData)
        localStorage.setItem('loginHistory', JSON.stringify(state.loginHistory))
    },
    SET_TWO_FACTOR_STATUS(state, { enabled, secret = null }) {
        state.twoFactorEnabled = enabled
        state.twoFactorSecret = secret
        localStorage.setItem('twoFactorEnabled', enabled)
    },
    CLEAR_USER_STATE(state) {
        if (state.sessionTimeout) clearTimeout(state.sessionTimeout)
        if (state.tokenRefreshTimeout) clearTimeout(state.tokenRefreshTimeout)

        Object.assign(state, {
            userInfo: null,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
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
            userPreferences: {},
            verificationStatus: 'unverified',
            passwordResetToken: null,
            passwordResetExpiry: null,
            twoFactorEnabled: false,
            twoFactorSecret: null,
            loginHistory: []
        })

        const keysToRemove = [
            'user',
            TOKEN_CONFIG.ACCESS_TOKEN_KEY,
            TOKEN_CONFIG.REFRESH_TOKEN_KEY,
            'lastLoginTime',
            'loginAttempts',
            'isLocked',
            'lockUntil',
            'userPreferences',
            'verificationStatus',
            'twoFactorEnabled',
            'loginHistory'
        ]

        keysToRemove.forEach(key => localStorage.removeItem(key))
    }
}// actions
const actions = {
    async login({ commit, dispatch }, credentials) {
        if (state.isLocked && new Date(state.lockUntil) > new Date()) {
            const remainingTime = Math.ceil((new Date(state.lockUntil) - new Date()) / 1000 / 60)
            throw new Error(`帳號已被鎖定，請等待 ${remainingTime} 分鐘後再試`)
        }

        commit('SET_LOADING', true)
        commit('SET_ERROR', null)

        try {
            const response = await authService.login(credentials)
            commit('SET_TOKENS', {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken
            })
            commit('SET_USER_INFO', response.user)
            commit('SET_AUTH_STATUS', true)
            commit('RESET_LOGIN_ATTEMPTS')
            commit('SET_SUCCESS_MESSAGE', '登入成功')
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
        const refreshToken = () => {
            const timeout = setTimeout(
                async () => {
                    try {
                        await dispatch('refreshToken')
                        refreshToken()
                    } catch {
                        await dispatch('logout')
                    }
                },
                TOKEN_CONFIG.TOKEN_EXPIRY - SECURITY_CONFIG.REFRESH_THRESHOLD
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

        refreshToken()
        setupSessionTimeout()
    },

    async refreshToken({ commit, state }) {
        if (state.isRefreshing) {
            return new Promise((resolve, reject) => {
                commit('ADD_REFRESH_SUBSCRIBER', token => {
                    if (token) resolve(token)
                    else reject(new Error('Token refresh failed'))
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
    }
}

// getters
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
    userPreferences: state => state.userPreferences
}

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
}

