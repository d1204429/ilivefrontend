import axios from 'axios';

const AUTH_API_URL = '/api/v1/auth';

const authService = {
    async login(credentials) {
        try {
            const response = await axios.post(`${AUTH_API_URL}/login`, credentials);
            if (response.data.token) {
                localStorage.setItem('user', JSON.stringify(response.data));
                axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
            }
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || '登入失敗');
        }
    },

    async register(user) {
        try {
            const response = await axios.post(`${AUTH_API_URL}/register`, user);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || '註冊失敗');
        }
    },

    logout() {
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
    },

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('user'));
    },

    async refreshToken() {
        try {
            const user = this.getCurrentUser();
            if (user && user.refreshToken) {
                const response = await axios.post(`${AUTH_API_URL}/refresh-token`, {
                    refreshToken: user.refreshToken
                });
                if (response.data.token) {
                    user.token = response.data.token;
                    localStorage.setItem('user', JSON.stringify(user));
                    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                }
                return response.data;
            }
        } catch (error) {
            this.logout();
            throw new Error('Token刷新失敗，請重新登入');
        }
    },

    async changePassword(oldPassword, newPassword) {
        try {
            const response = await axios.post(`${AUTH_API_URL}/change-password`, {
                oldPassword,
                newPassword
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || '修改密碼失敗');
        }
    },

    async requestPasswordReset(email) {
        try {
            const response = await axios.post(`${AUTH_API_URL}/request-password-reset`, { email });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || '請求密碼重設失敗');
        }
    },

    async resetPassword(token, newPassword) {
        try {
            const response = await axios.post(`${AUTH_API_URL}/reset-password`, {
                token,
                newPassword
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || '重設密碼失敗');
        }
    },

    async verifyEmail(token) {
        try {
            const response = await axios.post(`${AUTH_API_URL}/verify-email`, { token });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || '驗證電子郵件失敗');
        }
    },

    isLoggedIn() {
        const user = this.getCurrentUser();
        return !!user && !!user.token;
    },

    getToken() {
        const user = this.getCurrentUser();
        return user ? user.token : null;
    },

    setAxiosInterceptors() {
        axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                if (error.response.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    try {
                        await this.refreshToken();
                        return axios(originalRequest);
                    } catch (refreshError) {
                        return Promise.reject(refreshError);
                    }
                }
                return Promise.reject(error);
            }
        );
    }
};

export default authService;
