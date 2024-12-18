import axios from 'axios'
import router from '@/router'
import store from '@/store'
import api from '@/utils/axios'

const API_URL = import.meta.env.VITE_API_BASE_URL + '/users'

class AuthService {
    constructor() {
        this.init()
    }

    async login(username, password) {
        try {
            const response = await api.post('/users/login', {
                username,
                password
            })

            if (response.accessToken) {
                this.setUserData(response)
                await this.fetchUserProfile()
                return response
            }
            throw new Error('登入失敗：未收到有效的認證Token')
        } catch (error) {
            throw this.handleError(error)
        }
    }

    async fetchUserProfile() {
        try {
            const response = await api.get('/users/profile')
            const userData = this.getCurrentUser()
            const updatedUserData = { ...userData, ...response }
            this.setUserData(updatedUserData)
            return response
        } catch (error) {
            throw this.handleError(error)
        }
    }

    async register(userData) {
        try {
            const response = await api.post('/users/register', {
                username: userData.username,
                password: userData.password,
                email: userData.email,
                fullName: userData.fullName,
                phoneNumber: userData.phoneNumber,
                address: userData.address,
                birthday: userData.birthday,
                gender: userData.gender
            })

            if (response) {
                await this.login(userData.username, userData.password)
                return response
            }
            throw new Error('註冊失敗')
        } catch (error) {
            throw this.handleError(error)
        }
    }

    async logout() {
        try {
            await api.post('/users/logout')
        } catch (error) {
            console.error('登出時發生錯誤:', error)
        } finally {
            this.clearUserData()
        }
    }

    clearUserData() {
        localStorage.clear()
        sessionStorage.clear()
        this.removeAuthHeader()
        store.commit('auth/CLEAR_USER_STATE')
        store.commit('cart/CLEAR_CART')
        router.push('/login')
    }

    setUserData(userData) {
        if (!userData) return

        const userDataToStore = {
            ...userData,
            lastLoginTime: new Date().toISOString()
        }

        localStorage.setItem('user', JSON.stringify(userDataToStore))

        if (userData.accessToken) {
            localStorage.setItem('accessToken', userData.accessToken)
            this.setAuthHeader(userData.accessToken)
        }

        if (userData.refreshToken) {
            localStorage.setItem('refreshToken', userData.refreshToken)
        }

        store.commit('auth/SET_USER', userDataToStore)
    }

    setAuthHeader(token) {
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        }
    }

    removeAuthHeader() {
        delete api.defaults.headers.common['Authorization']
        delete axios.defaults.headers.common['Authorization']
    }

    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('user'))
        } catch (error) {
            this.clearUserData()
            return null
        }
    }

    isAuthenticated() {
        const user = this.getCurrentUser()
        const token = localStorage.getItem('accessToken')
        return !!(user && token)
    }

    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refreshToken')
            if (!refreshToken) {
                throw new Error('無可用的重整Token')
            }

            const response = await api.post('/users/refresh-token', {
                refreshToken,
                grantType: 'refresh_token'
            })

            const { accessToken, refreshToken: newRefreshToken } = response
            const userData = this.getCurrentUser()

            if (userData) {
                userData.accessToken = accessToken
                userData.refreshToken = newRefreshToken
                this.setUserData(userData)
            }

            return accessToken
        } catch (error) {
            this.clearUserData()
            throw error
        }
    }

    handleError(error) {
        let errorMessage = '發生未知錯誤'

        if (error.response) {
            const { status, data } = error.response

            switch (status) {
                case 400:
                    errorMessage = data.message || '請求參數錯誤'
                    break
                case 401:
                    errorMessage = '認證失敗，請重新登入'
                    this.clearUserData()
                    break
                case 403:
                    errorMessage = '無權限執行此操作'
                    break
                case 404:
                    errorMessage = '請求的資源不存在'
                    break
                case 429:
                    errorMessage = '請求過於頻繁，請稍後再試'
                    break
                case 500:
                    errorMessage = '伺服器錯誤，請稍後再試'
                    break
                default:
                    errorMessage = data.message || `請求失敗 (${status})`
            }
        } else if (error.request) {
            errorMessage = '網路連接失敗，請檢查網路設置'
        } else {
            errorMessage = error.message
        }

        return new Error(errorMessage)
    }

    setupInterceptors() {
        let isRefreshing = false
        let failedQueue = []

        const processQueue = (error, token = null) => {
            failedQueue.forEach(prom => {
                if (error) {
                    prom.reject(error)
                } else {
                    prom.resolve(token)
                }
            })
            failedQueue = []
        }

        api.interceptors.response.use(
            response => response,
            async error => {
                const originalRequest = error.config

                if (error.response?.status === 401 && !originalRequest._retry) {
                    if (isRefreshing) {
                        return new Promise((resolve, reject) => {
                            failedQueue.push({ resolve, reject })
                        }).then(token => {
                            originalRequest.headers['Authorization'] = `Bearer ${token}`
                            return api(originalRequest)
                        }).catch(err => Promise.reject(err))
                    }

                    originalRequest._retry = true
                    isRefreshing = true

                    try {
                        const token = await this.refreshToken()
                        processQueue(null, token)
                        originalRequest.headers['Authorization'] = `Bearer ${token}`
                        return api(originalRequest)
                    } catch (refreshError) {
                        processQueue(refreshError, null)
                        return Promise.reject(refreshError)
                    } finally {
                        isRefreshing = false
                    }
                }
                return Promise.reject(error)
            }
        )
    }

    init() {
        const accessToken = localStorage.getItem('accessToken')
        if (accessToken) {
            this.setAuthHeader(accessToken)
        }
        this.setupInterceptors()
    }
}

export default new AuthService()
