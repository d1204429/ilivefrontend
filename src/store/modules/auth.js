import { authApi } from '@/services/api'
import { handleError } from '@/utils/errorHandler'
import router from '@/router'

// Token 配置
const TOKEN_CONFIG = {
    ACCESS_TOKEN_KEY: import.meta.env.VITE_JWT_TOKEN_KEY || 'access_token',
    REFRESH_TOKEN_KEY: import.meta.env.VITE_JWT_REFRESH_KEY || 'refresh_token',
    TOKEN_PREFIX: 'Bearer',
    REFRESH_INTERVAL: parseInt(import.meta.env.VITE_TOKEN_REFRESH_INTERVAL) || 15 * 60 * 1000,
    SESSION_TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 60 * 60 * 1000,
    TOKEN_EXPIRED_CODE: 'TOKEN_EXPIRED'
}

// 安全配置
const SECURITY_CONFIG = {
    MAX_LOGIN_ATTEMPTS: parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS) || 5,
    LOCK_DURATION: parseInt(import.meta.env.VITE_LOCK_DURATION) || 30 * 60 * 1000,
    PASSWORD_MIN_LENGTH: parseInt(import.meta.env.VITE_PASSWORD_MIN_LENGTH) || 8,
    PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    SESSION_KEEP_ALIVE: parseInt(import.meta.env.VITE_SESSION_KEEP_ALIVE) || 5 * 60 * 1000
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
    pendingRequests: [],
    permissions: [],
    roles: [],
    preferences: {}
}

// State
const state = {
    ...INITIAL_STATE,
    user: JSON.parse(localStorage.getItem('user')),
    token: localStorage.getItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY),
    lastLoginTime: localStorage.getItem('lastLoginTime'),
    lastActivityTime: localStorage.getItem('lastActivityTime'),
    loginAttempts: parseInt(localStorage.getItem('loginAttempts')) || 0,
    isLocked: localStorage.getItem('isLocked') === 'true',
    lockUntil: localStorage.getItem('lockUntil'),
    permissions: JSON.parse(localStorage.getItem('permissions')) || [],
    roles: JSON.parse(localStorage.getItem('roles')) || [],
    preferences: JSON.parse(localStorage.getItem('preferences')) || {}
}

// Mutations
const mutations = {
    SET_LOADING(state, status) {
        state.loading = status
    },
    SET_ERROR(state, error) {
        state.error = error
        if (error) {
            console.error('Auth Error:', error)
        }
    },
    SET_SUCCESS_MESSAGE(state, message) {
        state.successMessage = message
    },
    SET_USER(state, user) {
        state.user = user
        if (user) {
            localStorage.setItem('user', JSON.stringify(user))
            const currentTime = new Date().toISOString()
            state.lastLoginTime = currentTime
            state.lastActivityTime = currentTime
            localStorage.setItem('lastLoginTime', currentTime)
            localStorage.setItem('lastActivityTime', currentTime)

            if (user.permissions) {
                state.permissions = user.permissions
                localStorage.setItem('permissions', JSON.stringify(user.permissions))
            }
            if (user.roles) {
                state.roles = user.roles
                localStorage.setItem('roles', JSON.stringify(user.roles))
            }
            if (user.preferences) {
                state.preferences = user.preferences
                localStorage.setItem('preferences', JSON.stringify(user.preferences))
            }
        } else {
            localStorage.removeItem('user')
            localStorage.removeItem('lastLoginTime')
            localStorage.removeItem('lastActivityTime')
            localStorage.removeItem('permissions')
            localStorage.removeItem('roles')
            localStorage.removeItem('preferences')
        }
    },
    SET_AUTH_STATUS(state, status) {
        state.authStatus = status
    },
    SET_TOKENS(state, { accessToken, refreshToken }) {
        if (accessToken) {
            state.token = accessToken
            localStorage.setItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY, accessToken)
        }
        if (refreshToken) {
            state.refreshToken = refreshToken
            localStorage.setItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY, refreshToken)
        }
        if (!accessToken && !refreshToken) {
            state.token = null
            state.refreshToken = null
            localStorage.removeItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY)
            localStorage.removeItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY)
        }
    },
    UPDATE_ACTIVITY_TIME(state) {
        const currentTime = new Date().toISOString()
        state.lastActivityTime = currentTime
        localStorage.setItem('lastActivityTime', currentTime)
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
        localStorage.removeItem('lastActivityTime')
        localStorage.removeItem('loginAttempts')
        localStorage.removeItem('isLocked')
        localStorage.removeItem('lockUntil')
        localStorage.removeItem('permissions')
        localStorage.removeItem('roles')
        localStorage.removeItem('preferences')
    }
}
// Actions
const actions = {
    async login({ commit, dispatch }, { username, password, rememberMe = false }) {
        if (state.isLocked && new Date(state.lockUntil) > new Date()) {
            const remainingTime = Math.ceil((new Date(state.lockUntil) - new Date()) / 1000 / 60)
            throw new Error(`帳號已被鎖定，請等待 ${remainingTime} 分鐘後再試`)
        }

        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        commit('SET_SUCCESS_MESSAGE', null)

        try {
            const response = await authApi.login({ username, password })

            if (!response?.accessToken || !response?.user) {
                throw new Error('伺服器回應格式錯誤')
            }

            commit('SET_TOKENS', {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken
            })
            commit('SET_USER', response.user)
            commit('SET_AUTH_STATUS', 'authenticated')
            commit('RESET_LOGIN_ATTEMPTS')
            commit('SET_SUCCESS_MESSAGE', '登入成功')

            if (rememberMe) {
                localStorage.setItem('rememberedUsername', username)
            } else {
                localStorage.removeItem('rememberedUsername')
            }

            await dispatch('setupAuthRefresh')
            await dispatch('initializeUserSession')
            return response
        } catch (error) {
            commit('INCREMENT_LOGIN_ATTEMPTS')
            const errorMessage = handleError(error)
            commit('SET_ERROR', errorMessage)
            throw error
        } finally {
            commit('SET_LOADING', false)
        }
    },

    async initializeUserSession({ commit, dispatch }) {
        // 初始化用戶會話
        const setupSessionKeepAlive = () => {
            window.addEventListener('mousemove', () => commit('UPDATE_ACTIVITY_TIME'))
            window.addEventListener('keypress', () => commit('UPDATE_ACTIVITY_TIME'))

            setInterval(() => {
                const lastActivity = new Date(state.lastActivityTime).getTime()
                const currentTime = Date.now()

                if (currentTime - lastActivity > TOKEN_CONFIG.SESSION_TIMEOUT) {
                    dispatch('logout', { reason: 'session_timeout' })
                }
            }, SECURITY_CONFIG.SESSION_KEEP_ALIVE)
        }

        setupSessionKeepAlive()
        await dispatch('loadUserPreferences')
    },

    async loadUserPreferences({ commit }) {
        try {
            const preferences = await authApi.getUserPreferences()
            commit('SET_USER', { ...state.user, preferences })
        } catch (error) {
            console.error('Failed to load user preferences:', error)
        }
    },

    async setupAuthRefresh({ dispatch, commit }) {
        const setupTokenRefresh = () => {
            if (state.tokenRefreshTimeout) {
                clearTimeout(state.tokenRefreshTimeout)
            }

            const timeout = setTimeout(
                async () => {
                    try {
                        await dispatch('refreshToken')
                        setupTokenRefresh() // 重新設置定時器
                    } catch (error) {
                        await dispatch('logout', { reason: 'refresh_failed' })
                    }
                },
                TOKEN_CONFIG.REFRESH_INTERVAL
            )
            commit('SET_TOKEN_REFRESH_TIMEOUT', timeout)
        }

        setupTokenRefresh()
    },

    async refreshToken({ commit, state }) {
        if (state.isRefreshing) {
            return new Promise((resolve, reject) => {
                commit('ADD_REFRESH_SUBSCRIBER', token => {
                    if (token) {
                        resolve(token)
                    } else {
                        reject(new Error('Token 更新失敗'))
                    }
                })
            })
        }

        commit('SET_REFRESH_STATE', { isRefreshing: true })

        try {
            const response = await authApi.refreshToken({
                refreshToken: state.refreshToken
            })

            if (!response?.accessToken) {
                throw new Error('無效的 token 更新響應')
            }

            commit('SET_TOKENS', {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken
            })

            state.refreshSubscribers.forEach(callback => callback(response.accessToken))
            commit('CLEAR_REFRESH_SUBSCRIBERS')
            return response.accessToken
        } catch (error) {
            state.refreshSubscribers.forEach(callback => callback(null))
            commit('CLEAR_REFRESH_SUBSCRIBERS')
            throw error
        } finally {
            commit('SET_REFRESH_STATE', { isRefreshing: false })
        }
    },

    async logout({ commit, dispatch }, { reason = 'user_logout' } = {}) {
        try {
            if (state.token) {
                await authApi.logout()
            }
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            commit('CLEAR_AUTH')
            await dispatch('cart/clearCart', null, { root: true })

            const query = reason === 'session_timeout'
                ? { error: 'session_timeout' }
                : reason === 'refresh_failed'
                    ? { error: 'token_expired' }
                    : undefined

            router.push({
                path: '/login',
                query
            })
        }
    },

    async handleAuthError({ dispatch }, error) {
        if (error.response?.status === 401) {
            const errorCode = error.response?.data?.code

            if (errorCode === TOKEN_CONFIG.TOKEN_EXPIRED_CODE) {
                try {
                    await dispatch('refreshToken')
                    return true
                } catch (refreshError) {
                    await dispatch('logout', { reason: 'token_expired' })
                    return false
                }
            }

            await dispatch('logout', { reason: 'unauthorized' })
            return false
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

            await dispatch('setupAuthRefresh')
            await dispatch('initializeUserSession')
            return true
        } catch (error) {
            commit('CLEAR_AUTH')
            return false
        }
    },

    async updateProfile({ commit }, profileData) {
        try {
            const response = await authApi.updateProfile(profileData)
            commit('SET_USER', { ...state.user, ...response })
            commit('SET_SUCCESS_MESSAGE', '個人資料更新成功')
            return response
        } catch (error) {
            commit('SET_ERROR', handleError(error))
            throw error
        }
    },

    async changePassword({ commit }, { oldPassword, newPassword }) {
        try {
            if (!SECURITY_CONFIG.PASSWORD_PATTERN.test(newPassword)) {
                throw new Error('密碼必須包含大小寫字母、數字和特殊字符，且長度至少為8位')
            }

            await authApi.changePassword({ oldPassword, newPassword })
            commit('SET_SUCCESS_MESSAGE', '密碼修改成功')
        } catch (error) {
            commit('SET_ERROR', handleError(error))
            throw error
        }
    }
}

// Getters
const getters = {
    isAuthenticated: state => !!state.token && !!state.user,
    currentUser: state => state.user,
    userFullName: state => {
        const user = state.user
        return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''
    },
    accessToken: state => state.token,
    refreshToken: state => state.refreshToken,
    isLoading: state => state.loading,
    error: state => state.error,
    successMessage: state => state.successMessage,
    authStatus: state => state.authStatus,
    lastLoginTime: state => state.lastLoginTime,
    lastActivityTime: state => state.lastActivityTime,
    hasRefreshToken: state => !!state.refreshToken,
    isAccountLocked: state => state.isLocked,
    remainingLockTime: state => {
        if (!state.lockUntil) return 0
        return Math.max(0, new Date(state.lockUntil) - new Date())
    },
    loginAttempts: state => state.loginAttempts,
    isRefreshing: state => state.isRefreshing,
    pendingRequests: state => state.pendingRequests,
    userPermissions: state => state.permissions,
    hasPermission: state => permission => state.permissions.includes(permission),
    userRoles: state => state.roles,
    hasRole: state => role => state.roles.includes(role),
    userPreferences: state => state.preferences,
    isSessionValid: state => {
        if (!state.lastActivityTime) return false
        return (Date.now() - new Date(state.lastActivityTime).getTime()) < TOKEN_CONFIG.SESSION_TIMEOUT
    },
    isTokenExpired: state => {
        if (!state.token) return true
        try {
            const tokenData = JSON.parse(atob(state.token.split('.')[1]))
            return tokenData.exp * 1000 < Date.now()
        } catch {
            return true
        }
    },
    sessionTimeRemaining: state => {
        if (!state.lastActivityTime) return 0
        const timeElapsed = Date.now() - new Date(state.lastActivityTime).getTime()
        return Math.max(0, TOKEN_CONFIG.SESSION_TIMEOUT - timeElapsed)
    }
}

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
}
