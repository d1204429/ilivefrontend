<template>
  <div class="profile-container">
    <div class="profile-card">
      <!-- 頁面標題和操作按鈕 -->
      <div class="profile-header">
        <h2 class="title">個人資料</h2>
        <div class="action-buttons">
          <button
              v-if="!isEditing"
              @click="startEditing"
              class="btn btn-edit"
              :disabled="loading"
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

      <!-- 錯誤提示 -->
      <div v-if="globalError" class="error-banner">
        {{ globalError }}
      </div>

      <!-- 個人資料表單 -->
      <div class="profile-content">
        <div v-if="loading" class="loading-wrapper">
          <BaseLoading message="載入中..." />
        </div>
        <form v-else class="profile-form" @submit.prevent="handleSave">
          <!-- 使用者名稱 -->
          <div class="form-group">
            <label>使用者名稱</label>
            <div class="input-wrapper">
              <input
                  v-if="isEditing"
                  v-model.trim="editedProfile.username"
                  type="text"
                  class="form-input"
                  :class="{ 'has-error': errors.username }"
                  @blur="validateField('username')"
              />
              <span v-else class="form-text">{{ currentUser?.username || '-' }}</span>
            </div>
            <span v-if="errors.username" class="error-text">{{ errors.username }}</span>
          </div>

          <!-- 電子信箱 -->
          <div class="form-group">
            <label>電子信箱</label>
            <div class="input-wrapper">
              <input
                  v-if="isEditing"
                  v-model.trim="editedProfile.email"
                  type="email"
                  class="form-input"
                  :class="{ 'has-error': errors.email }"
                  @blur="validateField('email')"
              />
              <span v-else class="form-text">{{ currentUser?.email || '-' }}</span>
            </div>
            <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
          </div>

          <!-- 全名 -->
          <div class="form-group">
            <label>全名</label>
            <div class="input-wrapper">
              <input
                  v-if="isEditing"
                  v-model.trim="editedProfile.fullName"
                  type="text"
                  class="form-input"
                  :class="{ 'has-error': errors.fullName }"
                  @blur="validateField('fullName')"
              />
              <span v-else class="form-text">{{ currentUser?.fullName || '-' }}</span>
            </div>
            <span v-if="errors.fullName" class="error-text">{{ errors.fullName }}</span>
          </div>

          <!-- 電話號碼 -->
          <div class="form-group">
            <label>電話號碼</label>
            <div class="input-wrapper">
              <input
                  v-if="isEditing"
                  v-model.trim="editedProfile.phoneNumber"
                  type="tel"
                  class="form-input"
                  :class="{ 'has-error': errors.phoneNumber }"
                  @blur="validateField('phoneNumber')"
              />
              <span v-else class="form-text">{{ currentUser?.phoneNumber || '-' }}</span>
            </div>
            <span v-if="errors.phoneNumber" class="error-text">{{ errors.phoneNumber }}</span>
          </div>

          <!-- 地址 -->
          <div class="form-group">
            <label>地址</label>
            <div class="input-wrapper">
              <textarea
                  v-if="isEditing"
                  v-model.trim="editedProfile.address"
                  class="form-textarea"
                  :class="{ 'has-error': errors.address }"
                  @blur="validateField('address')"
              ></textarea>
              <span v-else class="form-text">{{ currentUser?.address || '-' }}</span>
            </div>
            <span v-if="errors.address" class="error-text">{{ errors.address }}</span>
          </div>
        </form>
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

export default {
  name: 'ProfileView',
  components: {
    BaseLoading
  },

  setup() {
    const store = useStore()
    const router = useRouter()

    // Reactive State
    const isEditing = ref(false)
    const loading = ref(false)
    const editedProfile = ref({})
    const errors = ref({})
    const originalProfile = ref({})
    const globalError = ref('')
    const validationFields = ['username', 'email', 'fullName', 'phoneNumber', 'address']

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
        return validationMap[field] ? validationMap[field]() : null
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
        validationFields.forEach(field => {
          if (editedProfile.value[field]) {
            const error = validation.getValidationError(field, editedProfile.value[field])
            if (error) newErrors[field] = error
          }
        })
        errors.value = newErrors
        return Object.keys(newErrors).length === 0
      }
    }

    // Data Management
    const fetchUserProfile = async () => {
      try {
        loading.value = true
        globalError.value = ''
        await store.dispatch('auth/getProfile')
        originalProfile.value = { ...currentUser.value }
        editedProfile.value = { ...currentUser.value }
      } catch (error) {
        handleError('獲取用戶資料失敗，請稍後再試')
      } finally {
        loading.value = false
      }
    }

    const handleError = (message) => {
      globalError.value = message
      if (store.hasModule('app')) {
        store.dispatch('app/setError', {
          message,
          type: 'error',
          duration: 3000
        }).catch(err => {
          console.error('Error handling failed:', err)
        })
      } else {
        console.error(message)
      }
    }


    // Form Actions
    const handleSave = async (e) => {
      e.preventDefault()
      if (!validation.validateForm() || !hasChanges.value) return

      try {
        loading.value = true
        globalError.value = ''
        await store.dispatch('auth/updateProfile', editedProfile.value)
        await fetchUserProfile()
        isEditing.value = false
        store.dispatch('app/setSuccess', {
          message: '個人資料更新成功',
          duration: 2000
        })
      } catch (error) {
        const errorMessage = error.response?.data?.message || '更新個人資料失敗，請稍後再試'
        handleError(errorMessage)
      } finally {
        loading.value = false
      }
    }

    const handleCancel = () => {
      if (hasChanges.value) {
        if (confirm('確定要取消編輯？未儲存的變更將會遺失。')) {
          resetForm()
        }
      } else {
        resetForm()
      }
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
      if (!isAuthenticated.value) {
        router.push({
          name: '/Login',
          query: { redirect: router.currentRoute.value.fullPath }
        })
        return
      }try{await fetchUserProfile()
      }catch (error) {handleError('載入資料失敗')
      }}

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
    onMounted(checkAuthAndLoadData)

    return {
      // State
      isEditing,
      loading,
      currentUser,
      editedProfile,
      errors,
      globalError,
      isFormValid,
      hasChanges,
      // Methods
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
