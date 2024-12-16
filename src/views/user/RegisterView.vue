<template>
  <div class="register-view">
    <div class="register-container">
      <h2 class="register-title">會員註冊</h2>

      <!-- 全局錯誤訊息 -->
      <div v-if="globalError" class="error-message">
        {{ globalError }}
      </div>

      <form class="register-form" @submit.prevent="handleRegister">
        <!-- 用戶名欄位 -->
        <div class="form-group">
          <label for="username-input">用戶名</label>
          <BaseInput
              id="username-input"
              v-model="formData.username"
              type="text"
              placeholder="請輸入用戶名"
              :error="validationErrors.username"
              @blur="validateField('username')"
          />
        </div>

        <!-- 電子郵件欄位 -->
        <div class="form-group">
          <label for="email-input">電子郵件</label>
          <BaseInput
              id="email-input"
              v-model="formData.email"
              type="email"
              placeholder="請輸入電子郵件"
              :error="validationErrors.email"
              @blur="validateField('email')"
          />
        </div>

        <!-- 全名欄位 -->
        <div class="form-group">
          <label for="fullname-input">全名</label>
          <BaseInput
              id="fullname-input"
              v-model="formData.fullName"
              type="text"
              placeholder="請輸入全名"
              :error="validationErrors.fullName"
              @blur="validateField('fullName')"
          />
        </div>

        <!-- 手機號碼欄位 -->
        <div class="form-group">
          <label for="phone-input">手機號碼</label>
          <BaseInput
              id="phone-input"
              v-model="formData.phoneNumber"
              type="tel"
              placeholder="請輸入手機號碼"
              :error="validationErrors.phoneNumber"
              @blur="validateField('phoneNumber')"
          />
        </div>

        <!-- 地址欄位 -->
        <div class="form-group">
          <label for="address-input">地址</label>
          <BaseInput
              id="address-input"
              v-model="formData.address"
              type="text"
              placeholder="請輸入地址"
              :error="validationErrors.address"
              @blur="validateField('address')"
          />
        </div>

        <!-- 密碼欄位 -->
        <div class="form-group">
          <label for="password-input">密碼</label>
          <BaseInput
              id="password-input"
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="請輸入密碼"
              :error="validationErrors.password"
              @blur="validateField('password')"
          >
            <template #append>
              <i
                  class="password-toggle"
                  :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"
                  @click="togglePasswordVisibility"
              ></i>
            </template>
          </BaseInput>
        </div>

        <!-- 確認密碼欄位 -->
        <div class="form-group">
          <label for="confirm-password-input">確認密碼</label>
          <BaseInput
              id="confirm-password-input"
              v-model="formData.confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              placeholder="請再次輸入密碼"
              :error="validationErrors.confirmPassword"
              @blur="validateField('confirmPassword')"
          />
        </div>

        <!-- 註冊按鈕 -->
        <BaseButton
            type="submit"
            :disabled="!isFormValid || isLoading"
            class="register-button"
        >
          {{ isLoading ? '註冊中...' : '註冊' }}
        </BaseButton>

        <!-- 登入連結 -->
        <div class="login-link">
          已有帳號？
          <router-link to="/login">立即登入</router-link>
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
import { userApi } from '@/utils/axios'

export default {
  name: 'RegisterView',

  components: {
    BaseInput,
    BaseButton
  },

  setup() {
    const router = useRouter()
    const store = useStore()
    const isLoading = ref(false)
    const showPassword = ref(false)
    const globalError = ref('')
    const validationErrors = reactive({})

    const formData = reactive({
      username: '',
      email: '',
      fullName: '',
      phoneNumber: '',
      address: '',
      password: '',
      confirmPassword: ''
    })

    const validationRules = {
      username: [
        v => !!v || '請輸入用戶名',
        v => v.length >= 3 || '用戶名至少需要3個字元',
        v => v.length <= 20 || '用戶名不能超過20個字元'
      ],
      email: [
        v => !!v || '請輸入電子郵件',
        v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || '請輸入有效的電子郵件'
      ],
      fullName: [
        v => !!v || '請輸入全名',
        v => v.length >= 2 || '全名至少需要2個字元',
        v => v.length <= 50 || '全名不能超過50個字元'
      ],
      phoneNumber: [
        v => !!v || '請輸入手機號碼',
        v => /^09\d{8}$/.test(v) || '請輸入有效的手機號碼'
      ],
      address: [
        v => !!v || '請輸入地址',
        v => v.length >= 5 || '地址至少需要5個字元'
      ],
      password: [
        v => !!v || '請輸入密碼',
        v => v.length >= 6 || '密碼長度至少6個字元',
        v => /[A-Z]/.test(v) || '密碼需包含至少一個大寫字母',
        v => /[a-z]/.test(v) || '密碼需包含至少一個小寫字母',
        v => /[0-9]/.test(v) || '密碼需包含至少一個數字'
      ],
      confirmPassword: [
        v => !!v || '請確認密碼',
        v => v === formData.password || '密碼不一致'
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
      for (const field in validationRules) {
        if (!validateField(field)) {
          isValid = false
        }
      }
      return isValid
    }

    const isFormValid = computed(() => {
      return Object.keys(formData).every(field => !!formData[field]) &&
          Object.keys(validationErrors).length === 0
    })

    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value
    }

    const handleRegister = async () => {
      if (!validateForm()) return

      try {
        isLoading.value = true
        globalError.value = ''

        const response = await userApi.register({
          username: formData.username,
          email: formData.email,
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          password: formData.password
        })

        await store.dispatch('user/setUser', response.data)

        // 註冊成功後自動登入
        const loginResponse = await userApi.login({
          username: formData.username,
          password: formData.password
        })

        await store.dispatch('user/setToken', loginResponse.data.accessToken)

        router.push('/')
      } catch (error) {
        if (error.response?.data?.errors) {
          Object.assign(validationErrors, error.response.data.errors)
        } else {
          globalError.value = error.response?.data?.message || '註冊失敗，請稍後再試'
        }
      } finally {
        isLoading.value = false
      }
    }

    return {
      formData,
      validationErrors,
      isLoading,
      showPassword,
      globalError,
      isFormValid,
      handleRegister,
      validateField,
      togglePasswordVisibility
    }
  }
}
</script>

<style scoped>
/* 將 .register-view 和 .register-container 使用登入頁面的樣式 */
.register-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
  padding: 1rem;
}

.register-container {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* 標題樣式 */
.register-title {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
  font-weight: 600;
}

/* 表單群組樣式 */
.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
}

/* 輸入框樣式 */
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

/* 密碼輸入框樣式 */
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

/* 錯誤訊息樣式 */
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

/* 註冊按鈕樣式 */
.register-button {
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

.register-button:hover:not(:disabled) {
  background-color: #3182ce;
  transform: translateY(-1px);
}

.register-button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
  transform: none;
}

/* 登入連結樣式 */
.login-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.login-link a {
  color: #4299e1;
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.3s ease;
}

.login-link a:hover {
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

/* 響應式設計 */
@media (max-width: 640px) {
  .register-container {
    margin: 1rem;
    padding: 1.5rem;
  }

  .register-title {
    font-size: 1.5rem;
  }
}
</style>
