<template>
  <div class="register-view">
    <div class="register-container">
      <h2 class="register-title">會員註冊</h2>

      <div v-if="globalError" class="error-message">
        {{ globalError }}
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
        <div class="countdown">{{ countdown }} 秒後自動跳轉到登入頁面</div>
      </div>

      <form class="register-form" @submit.prevent="handleRegister">
        <!-- Form fields remain the same -->
        <div class="form-group" v-for="field in formFields" :key="field.id">
          <label :for="field.id">{{ field.label }}</label>
          <BaseInput
              :id="field.id"
              v-model="formData[field.id]"
              :type="field.type || 'text'"
              :placeholder="field.placeholder"
              :error="validationErrors[field.id]"
              @blur="validateField(field.id)"
          >
            <template #append v-if="field.id === 'password' || field.id === 'confirmPassword'">
              <i
                  class="password-toggle"
                  :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"
                  @click="togglePasswordVisibility"
              ></i>
            </template>
          </BaseInput>
        </div>

        <BaseButton
            type="submit"
            :disabled="!isFormValid || isLoading"
            class="register-button"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
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

export default {
  name: 'RegisterView',
  components: { BaseInput, BaseButton },

  setup() {
    const router = useRouter()
    const store = useStore()
    const isLoading = ref(false)
    const showPassword = ref(false)
    const globalError = ref('')
    const countdown = ref(5)
    const successMessage = ref('')
    const validationErrors = reactive({})

    const formFields = [
      { id: 'username', label: '用戶名', placeholder: '請輸入用戶名' },
      { id: 'email', label: '電子郵件', type: 'email', placeholder: '請輸入電子郵件' },
      { id: 'fullName', label: '全名', placeholder: '請輸入全名' },
      { id: 'phoneNumber', label: '手機號碼', type: 'tel', placeholder: '請輸入手機號碼' },
      { id: 'address', label: '地址', placeholder: '請輸入地址' },
      { id: 'password', label: '密碼', type: 'password', placeholder: '請輸入密碼' },
      { id: 'confirmPassword', label: '確認密碼', type: 'password', placeholder: '請再次輸入密碼' }
    ]

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
        v => v.length <= 20 || '用戶名不能超過20個字元',
        v => /^[a-zA-Z0-9_]+$/.test(v) || '用戶名只能包含字母、數字和底線',
        v => !/^\d+$/.test(v) || '用戶名不能全為數字'
      ],
      email: [
        v => !!v || '請輸入電子郵件',
        v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || '請輸入有效的電子郵件',
        v => v.length <= 50 || '電子郵件長度不能超過50個字元'
      ],
      fullName: [
        v => !!v || '請輸入全名',
        v => v.length >= 2 || '全名至少需要2個字元',
        v => v.length <= 50 || '全名不能超過50個字元',
        v => /^[\u4e00-\u9fa5a-zA-Z\s]+$/.test(v) || '全名只能包含中文、英文和空格'
      ],
      phoneNumber: [
        v => !!v || '請輸入手機號碼',
        v => /^09\d{8}$/.test(v) || '請輸入有效的台灣手機號碼'
      ],
      address: [
        v => !!v || '請輸入地址',
        v => v.length >= 5 || '地址至少需要5個字元',
        v => v.length <= 100 || '地址不能超過100個字元'
      ],
      password: [
        v => !!v || '請輸入密碼',
        v => v.length >= 8 || '密碼長度至少需要8個字元',
        v => v.length <= 20 || '密碼長度不能超過20個字元',
        v => /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/.test(v) ||
            '密碼必須包含大小寫字母、數字和特殊符號'
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

    const startCountdown = () => {
      successMessage.value = `註冊成功！${countdown.value}秒後自動跳轉到登入頁面...`
      const timer = setInterval(() => {
        countdown.value--
        successMessage.value = `註冊成功！${countdown.value}秒後自動跳轉到登入頁面...`
        if (countdown.value <= 0) {
          clearInterval(timer)
          router.push('/login')
        }
      }, 1000)
    }

    const handleRegistrationError = (error) => {
      const errorMessage = error.response?.data?.message || error.message
      console.error('註冊失敗:', error)

      const errorMap = {
        'username': '此用戶名已被使用',
        'email': '此電子郵件已被註冊',
        'phoneNumber': '此手機號碼已被註冊'
      }

      for (const [field, message] of Object.entries(errorMap)) {
        if (errorMessage.includes(field)) {
          validationErrors[field] = message
          return
        }
      }

      globalError.value = errorMessage || '註冊失敗，請稍後再試'
    }

    const handleRegister = async () => {
      if (!validateForm()) return

      try {
        isLoading.value = true
        globalError.value = ''

        const userData = {
          username: formData.username.trim(),
          password: formData.password,
          email: formData.email.trim(),
          fullName: formData.fullName.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          address: formData.address.trim()
        }

        await store.dispatch('auth/register', userData)
        startCountdown()

      } catch (error) {
        handleRegistrationError(error)
      } finally {
        isLoading.value = false
      }
    }

    return {
      formFields,
      formData,
      validationErrors,
      isLoading,
      showPassword,
      globalError,
      countdown,
      successMessage,
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

.success-message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #48bb78;
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  z-index: 1000;
}

.countdown {
  font-size: 0.875rem;
  margin-top: 0.5rem;
  opacity: 0.9;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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
