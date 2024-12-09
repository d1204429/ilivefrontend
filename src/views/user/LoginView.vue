<template>
  <div class="login-view">
    <div class="login-container">
      <h2>登入</h2>
      <form @submit.prevent="handleLogin">
        <!-- 帳號輸入 -->
        <div class="form-group">
          <label>帳號</label>
          <input
              type="text"
              v-model="loginForm.username"
              placeholder="請輸入帳號"
              required
          >
        </div>

        <!-- 密碼輸入 -->
        <div class="form-group">
          <label>密碼</label>
          <div class="password-input">
            <input
                :type="showPassword ? 'text' : 'password'"
                v-model="loginForm.password"
                placeholder="請輸入密碼"
                required
            >
            <i
                class="password-toggle"
                :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"
                @click="togglePasswordVisibility"
            ></i>
          </div>
        </div>

        <!-- 記住我選項 -->
        <div class="remember-me">
          <input
              type="checkbox"
              v-model="loginForm.rememberMe"
              id="remember-me"
          >
          <label for="remember-me">記住我</label>
        </div>

        <!-- 錯誤訊息顯示 -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- 登入按鈕 -->
        <button
            type="submit"
            class="login-btn"
            :disabled="loading"
        >
          {{ loading ? '登入中...' : '登入' }}
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

export default {
  name: 'LoginView',

  setup() {
    const router = useRouter()
    const store = useStore()
    const loading = ref(false)
    const errorMessage = ref('')
    const showPassword = ref(false)

    const loginForm = reactive({
      username: '',
      password: '',
      rememberMe: false
    })

    const handleLogin = async () => {
      try {
        loading.value = true
        errorMessage.value = ''

        const response = await store.dispatch('auth/login', {
          username: loginForm.username,
          password: loginForm.password
        })

        if (loginForm.rememberMe) {
          localStorage.setItem('rememberMe', 'true')
          localStorage.setItem('username', loginForm.username)
        } else {
          localStorage.removeItem('rememberMe')
          localStorage.removeItem('username')
        }

        router.push('/')
      } catch (error) {
        errorMessage.value = error.message || '登入失敗，請檢查帳號密碼'
      } finally {
        loading.value = false
      }
    }

    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value
    }

    return {
      loginForm,
      loading,
      errorMessage,
      showPassword,
      handleLogin,
      togglePasswordVisibility
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
  color: var(--primary-color);
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

input[type="text"],
input[type="password"] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
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
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
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
  color: var(--primary-color);
  text-decoration: none;
}

@media (max-width: 768px) {
  .login-container {
    margin: 1rem;
  }
}
</style>
