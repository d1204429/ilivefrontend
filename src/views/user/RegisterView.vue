<template>
  <div class="register-view">
    <div class="register-container">
      <h2 class="register-title">會員註冊</h2>

      <!-- 全局錯誤訊息 -->
      <div v-if="globalError" class="error-message">
        {{ globalError }}
      </div>

      <form class="register-form" @submit.prevent="handleRegister">
        <!-- 姓名欄位 -->
        <div class="form-group">
          <label>姓名</label>
          <BaseInput
              v-model="formData.name"
              type="text"
              placeholder="請輸入姓名"
              :error="validationErrors.name"
              @blur="validateField('name')"
          />
        </div>

        <!-- 電子郵件欄位 -->
        <div class="form-group">
          <label>電子郵件</label>
          <BaseInput
              v-model="formData.email"
              type="email"
              placeholder="請輸入電子郵件"
              :error="validationErrors.email"
              @blur="validateField('email')"
          />
        </div>

        <!-- 手機號碼欄位 -->
        <div class="form-group">
          <label>手機號碼</label>
          <BaseInput
              v-model="formData.phone"
              type="tel"
              placeholder="請輸入手機號碼"
              :error="validationErrors.phone"
              @blur="validateField('phone')"
          />
        </div>

        <!-- 密碼欄位 -->
        <div class="form-group">
          <label>密碼</label>
          <BaseInput
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
          <label>確認密碼</label>
          <BaseInput
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

    // 表單資料
    const formData = reactive({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    })

    // 驗證規則
    const validationRules = {
      name: [
        v => !!v || '請輸入姓名',
        v => v.length >= 2 || '姓名至少需要2個字元',
        v => v.length <= 20 || '姓名不能超過20個字元'
      ],
      email: [
        v => !!v || '請輸入電子郵件',
        v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || '請輸入有效的電子郵件'
      ],
      phone: [
        v => !!v || '請輸入手機號碼',
        v => /^09\d{8}$/.test(v) || '請輸入有效的手機號碼'
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

    // 驗證單個欄位
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

    // 驗證整個表單
    const validateForm = () => {
      let isValid = true
      for (const field in validationRules) {
        if (!validateField(field)) {
          isValid = false
        }
      }
      return isValid
    }

    // 表單是否有效
    const isFormValid = computed(() => {
      return Object.keys(formData).every(field => !!formData[field]) &&
          Object.keys(validationErrors).length === 0
    })

    // 切換密碼可見性
    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value
    }

    // 處理註冊
    const handleRegister = async () => {
      if (!validateForm()) return

      try {
        isLoading.value = true
        globalError.value = ''

        await store.dispatch('auth/register', {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        })

        // 註冊成功後自動登入
        await store.dispatch('auth/login', {
          email: formData.email,
          password: formData.password
        })

        router.push('/')
      } catch (error) {
        if (error.response?.data?.errors) {
          // 處理後端返回的具體錯誤
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
.register-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 2rem;
}

.register-container {
  width: 100%;
  max-width: 400px;
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.register-title {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 2rem;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.register-button {
  margin-top: 1rem;
  width: 100%;
}

.login-link {
  text-align: center;
  margin-top: 1rem;
  color: #666;
}

.login-link a {
  color: var(--primary-color);
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .register-container {
    padding: 1.5rem;
  }
}
</style>
