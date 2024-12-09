<template>
  <div class="register-view">
    <!-- 註冊表單區域 -->
    <div class="register-container">
      <h2 class="register-title">會員註冊</h2>

      <form class="register-form" @submit.prevent="handleRegister">
        <!-- 姓名欄位 -->
        <div class="form-group">
          <label>姓名</label>
          <BaseInput
              v-model="formData.name"
              type="text"
              placeholder="請輸入姓名"
              :error="errors.name"
          />
        </div>

        <!-- 電子郵件欄位 -->
        <div class="form-group">
          <label>電子郵件</label>
          <BaseInput
              v-model="formData.email"
              type="email"
              placeholder="請輸入電子郵件"
              :error="errors.email"
          />
        </div>

        <!-- 手機號碼欄位 -->
        <div class="form-group">
          <label>手機號碼</label>
          <BaseInput
              v-model="formData.phone"
              type="tel"
              placeholder="請輸入手機號碼"
              :error="errors.phone"
          />
        </div>

        <!-- 密碼欄位 -->
        <div class="form-group">
          <label>密碼</label>
          <BaseInput
              v-model="formData.password"
              type="password"
              placeholder="請輸入密碼"
              :error="errors.password"
          />
        </div>

        <!-- 確認密碼欄位 -->
        <div class="form-group">
          <label>確認密碼</label>
          <BaseInput
              v-model="formData.confirmPassword"
              type="password"
              placeholder="請再次輸入密碼"
              :error="errors.confirmPassword"
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
import { ref, computed } from 'vue'
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
    const errors = ref({})

    // 表單資料
    const formData = ref({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    })

    // 表單驗證
    const validateForm = () => {
      const newErrors = {}

      if (!formData.value.name) {
        newErrors.name = '請輸入姓名'
      }

      if (!formData.value.email) {
        newErrors.email = '請輸入電子郵件'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
        newErrors.email = '請輸入有效的電子郵件'
      }

      if (!formData.value.phone) {
        newErrors.phone = '請輸入手機號碼'
      } else if (!/^09\d{8}$/.test(formData.value.phone)) {
        newErrors.phone = '請輸入有效的手機號碼'
      }

      if (!formData.value.password) {
        newErrors.password = '請輸入密碼'
      } else if (formData.value.password.length < 6) {
        newErrors.password = '密碼長度至少6個字元'
      }

      if (!formData.value.confirmPassword) {
        newErrors.confirmPassword = '請確認密碼'
      } else if (formData.value.password !== formData.value.confirmPassword) {
        newErrors.confirmPassword = '密碼不一致'
      }

      errors.value = newErrors
      return Object.keys(newErrors).length === 0
    }

    // 表單是否有效
    const isFormValid = computed(() => {
      return formData.value.name &&
          formData.value.email &&
          formData.value.phone &&
          formData.value.password &&
          formData.value.confirmPassword &&
          Object.keys(errors.value).length === 0
    })

    // 處理註冊
    const handleRegister = async () => {
      if (!validateForm()) return

      try {
        isLoading.value = true
        await store.dispatch('auth/register', {
          name: formData.value.name,
          email: formData.value.email,
          phone: formData.value.phone,
          password: formData.value.password
        })
        router.push('/login')
      } catch (error) {
        if (error.response?.data?.errors) {
          errors.value = error.response.data.errors
        } else {
          errors.value.general = '註冊失敗，請稍後再試'
        }
      } finally {
        isLoading.value = false
      }
    }

    return {
      formData,
      errors,
      isLoading,
      isFormValid,
      handleRegister
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
