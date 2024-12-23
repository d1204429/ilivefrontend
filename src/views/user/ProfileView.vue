<template>
  <div class="profile-container">
    <div class="profile-card">
      <!-- Header Section -->
      <div class="profile-header">
        <h2 class="title">個人資料</h2>
        <div class="action-buttons">
          <button
              v-if="!isEditing"
              @click="startEditing"
              class="btn btn-edit"
              :disabled="loading || !isAuthenticated"
          >
            編輯
          </button>
          <template v-else>
            <button
                @click="handleSave"
                class="btn btn-save"
                :disabled="loading || !isFormValid"
            >
              {{ loading ? '儲存中...' : '儲存' }}
            </button>
            <button
                @click="handleCancel"
                class="btn btn-cancel"
                :disabled="loading"
            >
              取消
            </button>
          </template>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="globalError" class="error-banner">
        {{ globalError }}
      </div>

      <!-- Main Content -->
      <div class="profile-content">
        <div v-if="loading" class="loading-wrapper">
          <BaseLoading message="載入中..." />
        </div>
        <form v-else-if="currentUser" class="profile-form" @submit.prevent="handleSave">
          <div class="form-group" v-for="field in formFields" :key="field.name">
            <label>{{ field.label }}</label>
            <div class="input-wrapper">
              <template v-if="isEditing">
                <input
                    v-if="field.type !== 'textarea'"
                    v-model.trim="editedProfile[field.name]"
                    :type="field.type"
                    class="form-input"
                    :class="{ 'has-error': errors[field.name] }"
                    @blur="validateField(field.name)"
                    :disabled="loading"
                />
                <textarea
                    v-else
                    v-model.trim="editedProfile[field.name]"
                    class="form-textarea"
                    :class="{ 'has-error': errors[field.name] }"
                    @blur="validateField(field.name)"
                    :disabled="loading"
                ></textarea>
              </template>
              <span v-else class="form-text">
                {{ currentUser[field.name] || '-' }}
              </span>
            </div>
            <span v-if="errors[field.name]" class="error-text">
              {{ errors[field.name] }}
            </span>
          </div>
        </form>
        <div v-else class="error-message">
          無法載入用戶資料
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import BaseLoading from '@/components/common/BaseLoading.vue'
import { fullName, email, phoneNumber, address } from '@/utils/validators'
import { apiService } from '@/utils/axios'

export default {
  name: 'ProfileView',
  components: { BaseLoading },

  setup() {
    const store = useStore()
    const router = useRouter()

    // Form Fields Configuration
    const formFields = [
      { name: 'username', label: '使用者名稱', type: 'text' },
      { name: 'email', label: '電子信箱', type: 'email' },
      { name: 'fullName', label: '全名', type: 'text' },
      { name: 'phoneNumber', label: '電話號碼', type: 'tel' },
      { name: 'address', label: '地址', type: 'textarea' }
    ]

    // Reactive State
    const isEditing = ref(false)
    const loading = ref(false)
    const editedProfile = ref({})
    const errors = ref({})
    const originalProfile = ref({})
    const globalError = ref('')
    const retryCount = ref(0)
    const MAX_RETRIES = 3

    // Computed Properties
    const currentUser = computed(() => store.getters['auth/currentUser'])
    const isAuthenticated = computed(() => store.getters['auth/isAuthenticated'])
    const isFormValid = computed(() => {
      return !Object.keys(errors.value).length &&
          Object.keys(editedProfile.value).length > 0 &&
          hasChanges.value
    })
    const hasChanges = computed(() => {
      return Object.keys(editedProfile.value).some(key =>
          editedProfile.value[key] !== originalProfile.value[key]
      )
    })

    // Validation Functions
    const validation = {
      getValidationError: (field, value) => {
        const validationMap = {
          username: () => value?.length >= 3 ? null : '使用者名稱至少需要3個字元',
          email: () => email(value) === true ? null : '請輸入有效的電子郵件',
          fullName: () => fullName(value) === true ? null : '請輸入有效的全名',
          phoneNumber: () => phoneNumber(value) === true ? null : '請輸入有效的電話號碼',
          address: () => address(value) === true ? null : '請輸入有效的地址'
        }
        return validationMap[field]?.() || null
      },
      validateField: (field) => {
        if (!field || !editedProfile.value[field]) return
        const error = validation.getValidationError(field, editedProfile.value[field])
        if (error) {
          errors.value = { ...errors.value, [field]: error }
        } else {
          const { [field]: removed, ...rest } = errors.value
          errors.value = rest
        }
      },
      validateForm: () => {
        const newErrors = {}
        formFields.forEach(({ name }) => {
          if (editedProfile.value[name]) {
            const error = validation.getValidationError(name, editedProfile.value[name])
            if (error) newErrors[name] = error
          }
        })
        errors.value = newErrors
        return Object.keys(newErrors).length === 0
      }
    }

    // Error Handling
    const handleAuthError = async (error) => {
      if (error.response?.status === 401) {
        try {
          const refreshed = await store.dispatch('auth/refreshToken')
          if (refreshed) {
            return true
          }
          return false
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          return false
        }
      }
      return false
    }

    const handleError = async (error) => {
      const message = error.response?.data?.message || '操作失敗，請稍後再試'
      globalError.value = message
      await store.dispatch('app/setError', {
        message,
        type: 'error',
        duration: 3000
      })
    }

    // Data Management
    const fetchUserProfile = async () => {
      try {
        loading.value = true
        globalError.value = ''

        if (!isAuthenticated.value) {
          const authChecked = await store.dispatch('auth/checkAuth')
          if (!authChecked) {
            throw new Error('未登入或登入已過期')
          }
        }

        const response = await store.dispatch('auth/getProfile')
        if (response) {
          originalProfile.value = { ...response }
          editedProfile.value = { ...response }
          retryCount.value = 0
        }
      } catch (error) {
        if (error.response?.status === 401) {
          const refreshed = await handleAuthError(error)
          if (refreshed && retryCount.value < MAX_RETRIES) {
            retryCount.value++
            return fetchUserProfile()
          }
        }
        handleError(error)
      } finally {
        loading.value = false
      }
    }

    // Form Actions
    const handleSave = async (e) => {
      e.preventDefault()
      if (!validation.validateForm() || !hasChanges.value) return

      try {
        loading.value = true
        globalError.value = ''
        const response = await store.dispatch('auth/updateProfile', editedProfile.value)
        if (response) {
          await fetchUserProfile()
          isEditing.value = false
          store.dispatch('app/setSuccess', {
            message: '個人資料更新成功',
            duration: 2000
          })
        }
      } catch (error) {
        if (!(await handleAuthError(error))) {
          handleError(error)
        }
      } finally {
        loading.value = false
      }
    }

    const handleCancel = () => {
      if (hasChanges.value && !confirm('確定要取消編輯？未儲存的變更將會遺失。')) {
        return
      }
      resetForm()
    }

    const startEditing = () => {
      editedProfile.value = { ...currentUser.value }
      originalProfile.value = { ...currentUser.value }
      isEditing.value = true
      errors.value = {}
      globalError.value = ''
    }

    const resetForm = () => {
      isEditing.value = false
      editedProfile.value = { ...originalProfile.value }
      errors.value = {}
      globalError.value = ''
    }

    // Auth Check & Initial Data Load
    const checkAuthAndLoadData = async () => {
      try {
        if (!isAuthenticated.value) {
          const authChecked = await store.dispatch('auth/checkAuth')
          if (!authChecked) {
            router.push({
              name: 'login',
              query: { redirect: router.currentRoute.value.fullPath }
            })
            return
          }
        }
        await fetchUserProfile()
      } catch (error) {
        console.error('Auth check failed:', error)
        handleError(error)
      }
    }

    // Watchers
    watch(() => editedProfile.value, (newValue) => {
      if (isEditing.value) {
        const changedField = Object.keys(newValue).find(key =>
            newValue[key] !== originalProfile.value[key]
        )
        if (changedField) validation.validateField(changedField)
      }
    }, { deep: true })

    // Lifecycle Hooks
    onMounted(async () => {
      await checkAuthAndLoadData()
    })

    return {
      isEditing,
      loading,
      currentUser,
      editedProfile,
      errors,
      globalError,
      isFormValid,
      hasChanges,
      formFields,
      isAuthenticated,
      startEditing,
      handleSave,
      handleCancel,
      validateField: validation.validateField
    }
  }
}
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.profile-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid #eee;
}

.error-banner {
  background-color: #fff5f5;
  color: #e53e3e;
  padding: 0.75rem 1rem;
  margin: 0.5rem;
  border-radius: 4px;
  border: 1px solid #feb2b2;
}

.title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.profile-content {
  padding: 1.25rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 0.5rem;
}

.input-wrapper {
  position: relative;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background-color: #fff;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  outline: none;
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
}

.form-text {
  display: block;
  padding: 0.625rem;
  background: #f7fafc;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #4a5568;
  border: 1px solid #edf2f7;
}

.btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn:not(:disabled):hover {
  transform: translateY(-1px);
}

.btn-edit {
  background: #4299e1;
  color: white;
}

.btn-edit:not(:disabled):hover {
  background: #3182ce;
}

.btn-save {
  background: #48bb78;
  color: white;
}

.btn-save:not(:disabled):hover {
  background: #38a169;
}

.btn-cancel {
  background: #f56565;
  color: white;
  margin-left: 0.75rem;
}

.btn-cancel:not(:disabled):hover {
  background: #e53e3e;
}

.loading-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.has-error {
  border-color: #f56565;
}

.error-text {
  color: #e53e3e;
  font-size: 0.75rem;
  margin-top: 0.375rem;
  display: block;
}

/* RWD */
@media (max-width: 768px) {
  .profile-container {
    padding: 0.75rem;
  }

  .profile-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .action-buttons {
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 0.75rem;
  }

  .btn {
    flex: 1;
    max-width: 130px;
  }

  .btn-cancel {
    margin-left: 0;
  }
}

@media (max-width: 480px) {
  .profile-header {
    padding: 1rem;
  }

  .profile-content {
    padding: 1rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    font-size: 0.813rem;
  }
}
</style>
