<template>
  <div class="register-view">
    <div class="register-container">
      <h2 class="register-title">會員註冊</h2>

      <div v-if="globalError" class="error-message">
        {{ globalError }}
      </div>

      <form class="register-form" @submit.prevent="handleRegister">
        <!-- 用戶名欄位 -->
        <div class="form-group">
          <label for="username">用戶名</label>
          <BaseInput
              id="username"
              v-model="formData.username"
              type="text"
              placeholder="請輸入用戶名"
              :error="validationErrors.username"
              @blur="validateField('username')"
          />
        </div>

        <!-- 電子郵件欄位 -->
        <div class="form-group">
          <label for="email">電子郵件</label>
          <BaseInput
              id="email"
              v-model="formData.email"
              type="email"
              placeholder="請輸入電子郵件"
              :error="validationErrors.email"
              @blur="validateField('email')"
          />
        </div>

        <!-- 全名欄位 -->
        <div class="form-group">
          <label for="fullName">全名</label>
          <BaseInput
              id="fullName"
              v-model="formData.fullName"
              type="text"
              placeholder="請輸入全名"
              :error="validationErrors.fullName"
              @blur="validateField('fullName')"
          />
        </div>

        <!-- 手機號碼欄位 -->
        <div class="form-group">
          <label for="phoneNumber">手機號碼</label>
          <BaseInput
              id="phoneNumber"
              v-model="formData.phoneNumber"
              type="tel"
              placeholder="請輸入手機號碼"
              :error="validationErrors.phoneNumber"
              @blur="validateField('phoneNumber')"
          />
        </div>

        <!-- 地址欄位 -->
        <div class="form-group">
          <label for="address">地址</label>
          <BaseInput
              id="address"
              v-model="formData.address"
              type="text"
              placeholder="請輸入地址"
              :error="validationErrors.address"
              @blur="validateField('address')"
          />
        </div>

        <!-- 密碼欄位 -->
        <div class="form-group">
          <label for="password">密碼</label>
          <BaseInput
              id="password"
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
          <label for="confirmPassword">確認密碼</label>
          <BaseInput
              id="confirmPassword"
              v-model="formData.confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              placeholder="請再次輸入密碼"
              :error="validationErrors.confirmPassword"
              @blur="validateField('confirmPassword')"
          />
        </div>

        <BaseButton
            type="submit"
            :disabled="!isFormValid || isLoading"
            class="register-button"
        >
          {{ isLoading ? '註冊中...' : '註冊' }}
        </BaseButton>

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
import authService from '@/services/auth.service'

export default {
  name: 'RegisterView',
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
        v => /^[a-zA-Z0-9_]+$/.test(v) || '用戶名只能包含字母、數字和底線'
      ],
      email: [
        v => !!v || '請輸入電子郵件',
        v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || '請輸入有效的電子郵件'
      ],
      fullName: [
        v => !!v || '請輸入全名',
        v => v.length >= 2 || '全名至少需要2個字元'
      ],
      phoneNumber: [
        v => !!v || '請輸入手機號碼',
        v => /^09\d{8}$/.test(v) || '請輸入有效的手機號碼'
      ],
      address: [
        v => !!v || '請輸入地址'
      ],
      password: [
        v => !!v || '請輸入密碼',
        v => v.length >= 6 || '密碼長度至少需要6個字元',
        v => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(v) || '密碼必須包含字母和數字'
      ],
      confirmPassword: [
        v => !!v || '請確認密碼',
        v => v === formData.password || '兩次輸入的密碼不一致'
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

        const userData = {
          username: formData.username,
          password: formData.password,
          email: formData.email,
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          address: formData.address
        }

        const response = await authService.register(userData)

        store.dispatch('app/setSuccess', '註冊成功，請登入')
        router.push('/login')
      } catch (error) {
        const errorMessage = error.response?.data || error.message
        globalError.value = errorMessage || '註冊失敗，請稍後再試'

        if (errorMessage.includes('用戶名已存在')) {
          validationErrors.username = '此用戶名已被使用'
        } else if (errorMessage.includes('電子郵件已存在')) {
          validationErrors.email = '此電子郵件已被註冊'
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

.register-title {
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

.register-button {
  width: 100%;
  margin-top: 1rem;
}

.login-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.login-link a {
  color: #4299e1;
  text-decoration: none;
  transition: color 0.3s ease;
}

.login-link a:hover {
  color: #3182ce;
  text-decoration: underline;
}

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
