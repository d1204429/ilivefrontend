import axios from 'axios'
import router from '@/router'
import store from '@/store'

const API_URL = 'http://localhost:1988/api/v1/users'

class AuthService {
    constructor() {
        this.init()
    }

    async login(username, password) {
        try {
            const response = await axios.post(`${API_URL}/login`, {
                username,
                password
            })

            if (response.data.accessToken) {
                const userData = {
                    accessToken: response.data.accessToken,
                    refreshToken: response.data.refreshToken,
                    username: username,
                    userId: response.data.userId,
                    email: response.data.email,
                    fullName: response.data.fullName
                }
                this.setUserData(userData)
            }
            return response.data
        } catch (error) {
            throw this.handleError(error)
        }
    }

    async register(userData) {
        try {
            const response = await axios.post(`${API_URL}/register`, {
                username: userData.username,
                password: userData.password,
                email: userData.email,
                fullName: userData.fullName,
                phoneNumber: userData.phoneNumber,
                address: userData.address
            })

            if (response.data) {
                // 註冊成功後自動登入
                await this.login(userData.username, userData.password)
            }
            return response.data
        } catch (error) {
            throw this.handleError(error)
        }
    }

    logout() {
        localStorage.clear()
        this.removeAuthHeader()
        store.commit('auth/CLEAR_USER_STATE')
        router.push('/login')
    }

    setUserData(userData) {
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('accessToken', userData.accessToken)
        localStorage.setItem('refreshToken', userData.refreshToken)
        this.setAuthHeader(userData.accessToken)
        store.commit('auth/SET_USER', userData)
    }

    setAuthHeader(token) {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        }
    }

    removeAuthHeader() {
        delete axios.defaults.headers.common['Authorization']
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('user'))
    }

    isAuthenticated() {
        const user = this.getCurrentUser()
        return !!user?.accessToken
    }

    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refreshToken')
            if (!refreshToken) {
                throw new Error('No refresh token')
            }

            const response = await axios.post(`${API_URL}/refresh-token`, {
                refreshToken
            })

            const { accessToken, newRefreshToken } = response.data
            const userData = this.getCurrentUser()
            if (userData) {
                userData.accessToken = accessToken
                userData.refreshToken = newRefreshToken
                this.setUserData(userData)
            }

            return accessToken
        } catch (error) {
            this.logout()
            throw error
        }
    }

    handleError(error) {
        const message = error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            '發生錯誤'
        return new Error(message)
    }

    setupInterceptors() {
        axios.interceptors.response.use(
            response => response,
            async error => {
                const originalRequest = error.config

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true
                    try {
                        const accessToken = await this.refreshToken()
                        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`
                        return axios(originalRequest)
                    } catch (refreshError) {
                        return Promise.reject(refreshError)
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
