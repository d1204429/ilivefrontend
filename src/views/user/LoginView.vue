<template>
  <div class="login-view">
    <div class="login-container">
      <h2>登入 iLive</h2>
      <form @submit.prevent="handleSubmit" class="login-form">
        <!-- 帳號輸入 -->
        <div class="form-group">
          <label for="username">帳號</label>
          <input
              id="username"
              type="text"
              v-model.trim="formData.username"
              :class="{ 'error': v$.username.$error }"
              @blur="v$.username.$touch()"
              placeholder="請輸入帳號"
              autocomplete="username"
          >
          <span class="error-text" v-if="v$.username.$error">
            {{ v$.username.$errors[0].$message }}
          </span>
        </div>

        <!-- 密碼輸入 -->
        <div class="form-group">
          <label for="password">密碼</label>
          <div class="password-input">
            <input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                v-model="formData.password"
                :class="{ 'error': v$.password.$error }"
                @blur="v$.password.$touch()"
                placeholder="請輸入密碼"
                autocomplete="current-password"
            >
            <button
                type="button"
                class="password-toggle"
                @click="togglePasswordVisibility"
                :aria-label="showPassword ? '隱藏密碼' : '顯示密碼'"
            >
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
          <span class="error-text" v-if="v$.password.$error">
            {{ v$.password.$errors[0].$message }}
          </span>
        </div>

        <!-- 記住我選項 -->
        <div class="remember-me-container">
          <label class="remember-me-label">
            <input
                type="checkbox"
                v-model="formData.rememberMe"
                class="remember-me-checkbox"
            >
            <span class="remember-me-text">記住我</span>
          </label>
        </div>

        <!-- 錯誤訊息顯示 -->
        <TransitionGroup name="fade">
          <div v-if="authError" class="error-message" key="error">
            {{ authError }}
          </div>
        </TransitionGroup>

        <!-- 登入按鈕 -->
        <button
            type="submit"
            class="login-btn"
            :disabled="isLoading || v$.$invalid"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          {{ isLoading ? '登入中...' : '登入' }}
        </button>

        <!-- 其他選項 -->
        <div class="additional-options">
          <router-link to="/forgot-password" class="forgot-password">
            忘記密碼？
          </router-link>
          <router-link to="/register" class="register">
            註冊新帳號
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useVuelidate } from '@vuelidate/core'
import { required, minLength, helpers } from '@vuelidate/validators'
import { userApi } from '@/utils/axios'

export default {
  name: 'LoginView',

  setup() {
    const router = useRouter()
    const store = useStore()
    const isLoading = ref(false)
    const showPassword = ref(false)

    const formData = reactive({
      username: '',
      password: '',
      rememberMe: false
    })

    const rules = {
      username: {
        required: helpers.withMessage('請輸入帳號', required),
        minLength: helpers.withMessage('帳號長度至少需要3個字元', minLength(3))
      },
      password: {
        required: helpers.withMessage('請輸入密碼', required),
        minLength: helpers.withMessage('密碼長度至少需要6個字元', minLength(6))
      }
    }

    const v$ = useVuelidate(rules, formData)
    const authError = computed(() => store.state.user.error)

    const handleSubmit = async () => {
      try {
        const isFormValid = await v$.value.$validate()
        if (!isFormValid) return

        isLoading.value = true
        const response = await userApi.login({
          username: formData.username,
          password: formData.password
        })

        if (response.accessToken) {
          localStorage.setItem('accessToken', response.accessToken)
          if (response.refreshToken) {
            localStorage.setItem('refreshToken', response.refreshToken)
          }

          if (formData.rememberMe) {
            localStorage.setItem('rememberedUsername', formData.username)
          } else {
            localStorage.removeItem('rememberedUsername')
          }

          await store.dispatch('user/setUserInfo', response.user)
          router.push('/')
        }
      } catch (error) {
        console.error('登入失敗:', error)
        store.commit('user/SET_ERROR', error.message || '登入失敗，請稍後再試')
      } finally {
        isLoading.value = false
      }
    }

    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value
    }

    onMounted(() => {
      const rememberedUsername = localStorage.getItem('rememberedUsername')
      if (rememberedUsername) {
        formData.username = rememberedUsername
        formData.rememberMe = true
      }
    })

    return {
      formData,
      v$,
      isLoading,
      authError,
      showPassword,
      handleSubmit,
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
  background-color: #f8f9fa;
  padding: 1rem;
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
}

input.error {
  border-color: #e53e3e;
}

.error-text {
  color: #e53e3e;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  padding: 0.25rem;
}

.password-toggle:hover {
  color: #4a5568;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.error-message {
  background-color: #fff5f5;
  border: 1px solid #feb2b2;
  color: #c53030;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
  position: relative;
}

.login-btn:hover:not(:disabled) {
  background-color: #3182ce;
}

.login-btn:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid #fff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

.additional-options {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
}

.additional-options a {
  color: #4299e1;
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.3s ease;
}

.additional-options a:hover {
  color: #3182ce;
  text-decoration: underline;
}

/* 動畫效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .login-container {
    margin: 1rem;
    padding: 1.5rem;
  }

  h2 {
    font-size: 1.5rem;
  }

  .additional-options {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
}


.remember-me-container {
  margin-bottom: 1.5rem;
}

.remember-me-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.remember-me-checkbox {
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid #4299e1;
  border-radius: 4px;
  margin-right: 8px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remember-me-checkbox:checked {
  background-color: #4299e1;
}

.remember-me-checkbox:checked::after {
  content: '✓';
  position: absolute;
  color: white;
  font-size: 12px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.remember-me-checkbox:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
}

.remember-me-text {
  color: #2c3e50;
  font-size: 0.875rem;
}

/* 更新錯誤訊息樣式 */
.error-message {
  background-color: #fff5f5;
  border: 1px solid #feb2b2;
  color: #c53030;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.875rem;
}

/* 更新按鈕樣式 */
.login-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-btn:hover:not(:disabled) {
  background-color: #3182ce;
  transform: translateY(-1px);
}

.login-btn:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
  transform: none;
}

</style>
