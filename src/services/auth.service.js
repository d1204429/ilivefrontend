import axios from 'axios';

// 設定API基礎URL和端點
const API_URL = 'http://localhost:1988/api/v1/users';

const authService = {
    // 用戶登入
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
                    username: username
                };
                localStorage.setItem('user', JSON.stringify(userData));
                this.setAuthHeader(response.data.accessToken);
            }
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || '登入失敗');
        }
    },

    // 用戶註冊
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
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || '註冊失敗');
        }
    },

    // 登出
    logout() {
        localStorage.removeItem('user');
        this.removeAuthHeader();
    },

    // 設定Authorization標頭
    setAuthHeader(token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },

    // 移除Authorization標頭
    removeAuthHeader() {
        delete axios.defaults.headers.common['Authorization'];
    },

    // 獲取當前用戶資料
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // 更新用戶資料
    async updateProfile(userId, userData) {
        try {
            const response = await axios.put(`${API_URL}/${userId}`, userData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || '更新資料失敗');
        }
    },

    // 修改密碼
    async changePassword(userId, oldPassword, newPassword) {
        try {
            const response = await axios.put(`${API_URL}/${userId}/password`, {
                oldPassword,
                newPassword
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data || '修改密碼失敗');
        }
    },

    // 檢查是否已登入
    isAuthenticated() {
        const user = this.getCurrentUser();
        return !!user && !!user.accessToken;
    },

    // 設定請求攔截器
    setupInterceptors() {
        axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // 如果是401錯誤且不是重試請求
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const user = this.getCurrentUser();
                        if (!user || !user.refreshToken) {
                            this.logout();
                            throw new Error('請重新登入');
                        }

                        // 嘗試使用refreshToken獲取新的accessToken
                        const response = await axios.post(`${API_URL}/refresh-token`, {
                            refreshToken: user.refreshToken
                        });

                        if (response.data.accessToken) {
                            // 更新localStorage中的token
                            user.accessToken = response.data.accessToken;
                            localStorage.setItem('user', JSON.stringify(user));

                            // 更新Authorization標頭
                            this.setAuthHeader(response.data.accessToken);

                            // 重試原始請求
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

    // 初始化服務
    init() {
        const user = this.getCurrentUser();
        if (user && user.accessToken) {
            this.setAuthHeader(user.accessToken);
        }
        this.setupInterceptors();
    }
};

// 初始化服務
authService.init();

export default authService;
