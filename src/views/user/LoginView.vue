<template>
  <div class="login-view">
    <div class="login-container">
      <h2>登入 iLive</h2>

      <form @submit.prevent="handleSubmit" class="login-form">
        <!-- Username Input -->
        <div class="form-group">
          <label for="username">帳號</label>
          <BaseInput
              id="username"
              v-model="formData.username"
              type="text"
              placeholder="請輸入帳號 (至少3個字元)"
              :error="validationErrors.username"
              @blur="validateField('username')"
              autocomplete="username"
          />
        </div>

        <!-- Password Input -->
        <div class="form-group">
          <label for="password">密碼</label>
          <div class="password-input">
            <BaseInput
                id="password"
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="請輸入密碼 (至少8個字元)"
                :error="validationErrors.password"
                @blur="validateField('password')"
                autocomplete="current-password"
            >
              <template #append>
                <button
                    type="button"
                    class="password-toggle"
                    @click="togglePasswordVisibility"
                    aria-label="Toggle password visibility"
                >
                  <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </template>
            </BaseInput>
          </div>
          <small class="password-hint" v-if="formData.password">
            密碼必須包含大小寫字母、數字，長度至少8個字元
          </small>
        </div>

        <!-- Remember Me Checkbox -->
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

        <!-- Error Message -->
        <div v-if="globalError" class="error-message" role="alert">
          {{ globalError }}
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="success-message" role="status">
          {{ successMessage }}
          <button @click="redirectToHome" class="home-link">
            立即回首頁
          </button>
        </div>

        <!-- Submit Button -->
        <BaseButton
            type="submit"
            :disabled="!isFormValid || isLoading"
            class="login-btn"
        >
          <span v-if="isLoading" class="loading-spinner" aria-hidden="true"></span>
          {{ isLoading ? '登入中...' : '登入' }}
        </BaseButton>

        <!-- Additional Options -->
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
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'

export default {
  name: 'LoginView',
  components: { BaseInput, BaseButton },

  setup() {
    const router = useRouter()
    const store = useStore()
    const isLoading = ref(false)
    const showPassword = ref(false)
    const globalError = ref('')
    const successMessage = ref('')
    const validationErrors = reactive({})
    const countdown = ref(5)
    let countdownTimer = null
    let successTimer = null

    const formData = reactive({
      username: '',
      password: '',
      rememberMe: false
    })

    const validationRules = {
      username: [
        v => !!v || '請輸入帳號',
        v => v.length >= 3 || '帳號長度至少需要3個字元',
        v => /^[a-zA-Z0-9_]+$/.test(v) || '帳號只能包含字母、數字和底線'
      ],
      password: [
        v => !!v || '請輸入密碼',
        v => v.length >= 8 || '密碼長度至少需要8個字元',
        v => /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/.test(v) ||
            '密碼必須包含大小寫字母、數字和特殊符號'
      ]
    }

    const validateField = (fieldName) => {
      const rules = validationRules[fieldName]
      const value = formData[fieldName]

      for (const rule of rules) {
        const result = rule(value)
        if (result !== true) {
          validationErrors[fieldName] = result
          return false
        }
      }

      delete validationErrors[fieldName]
      return true
    }

    const validateForm = () => {
      let isValid = true
      Object.keys(validationRules).forEach(field => {
        if (!validateField(field)) {
          isValid = false
        }
      })
      return isValid
    }

    const isFormValid = computed(() => {
      return formData.username &&
          formData.password &&
          Object.keys(validationErrors).length === 0
    })

    const startSuccessCountdown = () => {
      countdown.value = 5
      successMessage.value = `登入成功！${countdown.value}秒後自動跳轉到首頁，或點擊立即回首頁`

      if (successTimer) {
        clearInterval(successTimer)
      }

      successTimer = setInterval(() => {
        countdown.value--
        successMessage.value = `登入成功！${countdown.value}秒後自動跳轉到首頁，或點擊立即回首頁`

        if (countdown.value <= 0) {
          clearInterval(successTimer)
          router.push('/')
        }
      }, 1000)
    }

    const startRedirectCountdown = () => {
      countdown.value = 5
      globalError.value = `無此帳號請註冊帳號，${countdown.value}秒後自動跳轉到註冊頁面...`

      if (countdownTimer) {
        clearInterval(countdownTimer)
      }

      countdownTimer = setInterval(() => {
        countdown.value--
        globalError.value = `無此帳號請註冊帳號，${countdown.value}秒後自動跳轉到註冊頁面...`

        if (countdown.value <= 0) {
          clearInterval(countdownTimer)
          router.push('/register')
        }
      }, 1000)
    }

    const redirectToHome = () => {
      if (successTimer) {
        clearInterval(successTimer)
      }
      router.push('/')
    }

    const handleSubmit = async () => {
      try {
        if (!validateForm()) return

        if (countdownTimer) {
          clearInterval(countdownTimer)
        }
        if (successTimer) {
          clearInterval(successTimer)
        }

        isLoading.value = true
        globalError.value = ''
        successMessage.value = ''

        await store.dispatch('auth/login', {
          username: formData.username.trim(),
          password: formData.password
        })

        if (formData.rememberMe) {
          localStorage.setItem('rememberedUsername', formData.username)
        } else {
          localStorage.removeItem('rememberedUsername')
        }

        startSuccessCountdown()

      } catch (error) {
        console.error('登入失敗:', error)
        const errorMessage = error.response?.data?.message || ''

        if (errorMessage.includes('用戶不存在') || errorMessage.includes('找不到用戶')) {
          startRedirectCountdown()
        } else if (errorMessage.includes('密碼錯誤')) {
          globalError.value = '密碼錯誤，請重新輸入'
        } else {
          globalError.value = errorMessage || '登入失敗，請檢查帳號密碼是否正確'
        }
      } finally {
        isLoading.value = false
      }
    }

    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value
    }

    const initializeForm = () => {
      const rememberedUsername = localStorage.getItem('rememberedUsername')
      if (rememberedUsername) {
        formData.username = rememberedUsername
        formData.rememberMe = true
      }
    }

    initializeForm()

    return {
      formData,
      validationErrors,
      isLoading,
      showPassword,
      globalError,
      successMessage,
      countdown,
      isFormValid,
      handleSubmit,
      validateField,
      togglePasswordVisibility,
      redirectToHome
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

.password-input {
  position: relative;
}

.password-hint {
  color: #718096;
  font-size: 0.75rem;
  margin-top: 0.25rem;
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
  transition: color 0.3s ease;
}

.password-toggle:hover {
  color: #4a5568;
}

.error-message {
  background-color: #fff5f5;
  border: 1px solid #feb2b2;
  color: #c53030;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.875rem;
  animation: fadeIn 0.3s ease;
}

.success-message {
  background-color: #f0fff4;
  border: 1px solid #9ae6b4;
  color: #2f855a;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.875rem;
  animation: fadeIn 0.3s ease;
}

.remember-me-container {
  margin-bottom: 1.5rem;
}

.remember-me-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  color: #4a5568;
  font-size: 0.875rem;
}

.remember-me-checkbox {
  margin-right: 0.5rem;
  cursor: pointer;
}

.login-btn {
  width: 100%;
  position: relative;
  transition: all 0.3s ease;
}

.login-btn:disabled {
  opacity: 0.7;
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

.home-link {
  margin-left: 1rem;
  color: #1c1c1c;
  text-decoration: underline;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.home-link:hover {
  color: #e2e8f0;
  background: #173e21;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
</style>

