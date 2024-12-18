<template>
  <div class="login-view">
    <div class="login-container">
      <h2>登入 iLive</h2>

      <form @submit.prevent="handleSubmit" class="login-form">
        <!-- 帳號輸入 -->
        <div class="form-group">
          <label for="username">帳號</label>
          <BaseInput
              id="username"
              v-model="formData.username"
              type="text"
              placeholder="請輸入帳號"
              :error="validationErrors.username"
              @blur="validateField('username')"
          />
        </div>

        <!-- 密碼輸入 -->
        <div class="form-group">
          <label for="password">密碼</label>
          <div class="password-input">
            <BaseInput
                id="password"
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="請輸入密碼"
                :error="validationErrors.password"
                @blur="validateField('password')"
            >
              <template #append>
                <button
                    type="button"
                    class="password-toggle"
                    @click="togglePasswordVisibility"
                >
                  <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </template>
            </BaseInput>
          </div>
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
        <div v-if="globalError" class="error-message">
          {{ globalError }}
        </div>

        <!-- 登入按鈕 -->
        <BaseButton
            type="submit"
            :disabled="!isFormValid || isLoading"
            class="login-btn"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          {{ isLoading ? '登入中...' : '登入' }}
        </BaseButton>

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
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import authService from '@/services/auth.service'

export default {
  name: 'LoginView',
  components: { BaseInput, BaseButton },

  setup() {
    const router = useRouter()
    const store = useStore()
    const isLoading = ref(false)
    const showPassword = ref(false)
    const globalError = ref('')
    const validationErrors = reactive({})

    const formData = reactive({
      username: '',
      password: '',
      rememberMe: false
    })

    // 更新驗證規則以符合後端要求
    const validationRules = {
      username: [
        v => !!v || '請輸入帳號',
        v => v.length >= 3 || '帳號長度至少需要3個字元',
        v => /^[a-zA-Z0-9_]+$/.test(v) || '帳號只能包含字母、數字和底線'
      ],
      password: [
        v => !!v || '請輸入密碼',
        v => v.length >= 6 || '密碼長度至少需要6個字元',
        v => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(v) || '密碼必須包含至少一個字母和一個數字'
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

    const handleSubmit = async () => {
      try {
        if (!validateForm()) return

        isLoading.value = true
        globalError.value = ''

        // 調整為符合後端 API 的請求格式
        const response = await authService.login({
          username: formData.username,
          password: formData.password
        })

        if (response.accessToken) {
          if (formData.rememberMe) {
            localStorage.setItem('rememberedUsername', formData.username)
          } else {
            localStorage.removeItem('rememberedUsername')
          }

          // 更新 store 中的認證狀態
          await store.dispatch('auth/login', {
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            user: response.user
          })

          const redirect = router.currentRoute.value.query.redirect || '/'
          router.push(redirect)
        } else {
          throw new Error('登入失敗：未收到有效的認證Token')
        }
      } catch (error) {
        console.error('登入失敗:', error)
        globalError.value = error.message || '登入失敗，請檢查帳號密碼是否正確'
        store.dispatch('app/setError', {
          message: error.message,
          type: 'error'
        })
      } finally {
        isLoading.value = false
      }
    }

    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value
    }

    // 初始化表單
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
      isFormValid,
      handleSubmit,
      validateField,
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
  margin-right: 0.5rem;
}

.login-btn {
  width: 100%;
  position: relative;
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
</style>
