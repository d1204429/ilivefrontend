<template>
  <div class="login-view">
    <div class="login-container">
      <h2>登入</h2>
      <form @submit.prevent="handleSubmit">
        <!-- 帳號輸入 -->
        <div class="form-group">
          <label>帳號</label>
          <input
              type="text"
              v-model="formData.username"
              :class="{ 'error': errors.username }"
              @blur="validateUsername"
              placeholder="請輸入帳號"
          >
          <span class="error-text" v-if="errors.username">{{ errors.username }}</span>
        </div>

        <!-- 密碼輸入 -->
        <div class="form-group">
          <label>密碼</label>
          <div class="password-input">
            <input
                :type="showPassword ? 'text' : 'password'"
                v-model="formData.password"
                :class="{ 'error': errors.password }"
                @blur="validatePassword"
                placeholder="請輸入密碼"
            >
            <i
                class="password-toggle"
                :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"
                @click="togglePasswordVisibility"
            ></i>
          </div>
          <span class="error-text" v-if="errors.password">{{ errors.password }}</span>
        </div>

        <!-- 記住我選項 -->
        <div class="remember-me">
          <input
              type="checkbox"
              v-model="formData.rememberMe"
              id="remember-me"
          >
          <label for="remember-me">記住我</label>
        </div>

        <!-- 錯誤訊息顯示 -->
        <div v-if="loginError" class="error-message">
          {{ loginError }}
        </div>

        <!-- 登入按鈕 -->
        <button
            type="submit"
            class="login-btn"
            :disabled="isLoading || !isFormValid"
        >
          {{ isLoading ? '登入中...' : '登入' }}
        </button>

        <!-- 其他選項 -->
        <div class="additional-options">
          <router-link to="/forgot-password">忘記密碼？</router-link>
          <router-link to="/register">註冊新帳號</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

export default {
  name: 'LoginView',

  setup() {
    const router = useRouter()
    const store = useStore()
    const isLoading = ref(false)
    const loginError = ref('')
    const showPassword = ref(false)

    // 表單數據
    const formData = reactive({
      username: '',
      password: '',
      rememberMe: false
    })

    // 錯誤訊息
    const errors = reactive({
      username: '',
      password: ''
    })

    // 表單驗證
    const validateUsername = () => {
      errors.username = ''
      if (!formData.username) {
        errors.username = '請輸入帳號'
      } else if (formData.username.length < 3) {
        errors.username = '帳號長度至少需要3個字元'
      }
    }

    const validatePassword = () => {
      errors.password = ''
      if (!formData.password) {
        errors.password = '請輸入密碼'
      } else if (formData.password.length < 6) {
        errors.password = '密碼長度至少需要6個字元'
      }
    }

    // 驗證整個表單
    const validateForm = () => {
      validateUsername()
      validatePassword()
      return !errors.username && !errors.password
    }

    // 計算表單是否有效
    const isFormValid = computed(() => {
      return formData.username &&
          formData.password &&
          !errors.username &&
          !errors.password
    })

    // 處理表單提交
    const handleSubmit = async () => {
      if (!validateForm()) return

      try {
        isLoading.value = true
        loginError.value = ''

        await store.dispatch('auth/login', {
          username: formData.username,
          password: formData.password
        })

        if (formData.rememberMe) {
          localStorage.setItem('rememberMe', 'true')
          localStorage.setItem('username', formData.username)
        } else {
          localStorage.removeItem('rememberMe')
          localStorage.removeItem('username')
        }

        router.push('/')
      } catch (error) {
        loginError.value = error.response?.data?.message || '登入失敗，請檢查帳號密碼'
      } finally {
        isLoading.value = false
      }
    }

    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value
    }

    // 檢查是否有記住的帳號
    const checkRememberedUser = () => {
      if (localStorage.getItem('rememberMe') === 'true') {
        formData.username = localStorage.getItem('username') || ''
        formData.rememberMe = true
      }
    }

    // 組件掛載時檢查記住的帳號
    checkRememberedUser()

    return {
      formData,
      errors,
      isLoading,
      loginError,
      showPassword,
      isFormValid,
      handleSubmit,
      togglePasswordVisibility,
      validateUsername,
      validatePassword
    }
  }
}
</script>

<style scoped>
.login-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 1rem;
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

input[type="text"],
input[type="password"] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input.error {
  border-color: #dc3545;
}

.error-text {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #666;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.error-message {
  color: #dc3545;
  margin-bottom: 1rem;
  text-align: center;
  padding: 0.5rem;
  background-color: #f8d7da;
  border-radius: 4px;
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.login-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.additional-options {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}

.additional-options a {
  color: #007bff;
  text-decoration: none;
  font-size: 0.875rem;
}

.additional-options a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .login-container {
    margin: 1rem;
  }
}
</style>
