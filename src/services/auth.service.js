import axios from 'axios';

const API_URL = 'http://localhost:1988/api/v1/users';

const authService = {
    async login(username, password) {
        try {
            const response = await axios.post(`${API_URL}/login`, {
                username,
                password
            });

            if (response.data.accessToken) {
                const userData = {
                    accessToken: response.data.accessToken,
                    refreshToken: response.data.refreshToken,
                    username: username,
                    userId: response.data.userId
                };
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('accessToken', response.data.accessToken);
                localStorage.setItem('refreshToken', response.data.refreshToken);
                this.setAuthHeader(response.data.accessToken);
            }
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || '登入失敗');
        }
    },

    async register(userData) {
        try {
            const response = await axios.post(`${API_URL}/register`, {
                username: userData.username,
                password: userData.password,
                email: userData.email,
                fullName: userData.fullName,
                phoneNumber: userData.phoneNumber,
                address: userData.address
            });

            // 如果註冊成功，自動登入
            if (response.data) {
                await this.login(userData.username, userData.password);
            }
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.errors ||
                '註冊失敗';
            throw new Error(errorMessage);
        }
    },

    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        this.removeAuthHeader();
    },

    setAuthHeader(token) {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    },

    removeAuthHeader() {
        delete axios.defaults.headers.common['Authorization'];
    },

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    async updateProfile(userId, userData) {
        try {
            const response = await axios.put(`${API_URL}/${userId}`, userData);

            // 更新本地存儲的用戶資訊
            const currentUser = this.getCurrentUser();
            if (currentUser) {
                const updatedUser = { ...currentUser, ...response.data };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }

            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || '更新資料失敗');
        }
    },

    async changePassword(userId, oldPassword, newPassword) {
        try {
            const response = await axios.put(`${API_URL}/${userId}/password`, {
                oldPassword,
                newPassword
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || '修改密碼失敗');
        }
    },

    isAuthenticated() {
        const accessToken = localStorage.getItem('accessToken');
        return !!accessToken;
    },

    setupInterceptors() {
        axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const refreshToken = localStorage.getItem('refreshToken');
                        if (!refreshToken) {
                            this.logout();
                            throw new Error('請重新登入');
                        }

                        const response = await axios.post(`${API_URL}/refresh-token`, {
                            refreshToken
                        });

                        if (response.data.accessToken) {
                            localStorage.setItem('accessToken', response.data.accessToken);
                            this.setAuthHeader(response.data.accessToken);

                            // 更新原始請求的Authorization標頭
                            originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;
                            return axios(originalRequest);
                        }
                    } catch (refreshError) {
                        this.logout();
                        throw new Error('Session已過期，請重新登入');
                    }
                }
                return Promise.reject(error);
            }
        );
    },

    init() {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            this.setAuthHeader(accessToken);
        }
        this.setupInterceptors();
    }
};

authService.init();

export default authService;
