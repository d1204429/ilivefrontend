<template>
  <div class="profile-container">
    <div class="profile-card">
      <!-- 頁面標題和操作按鈕 -->
      <div class="profile-header">
        <h2 class="title">個人資料</h2>
        <div class="action-buttons">
          <button v-if="!isEditing" @click="startEditing" class="btn btn-edit">
            編輯
          </button>
          <template v-else>
            <button @click="saveProfile" class="btn btn-save" :disabled="loading || !isFormValid">
              儲存
            </button>
            <button @click="cancelEditing" class="btn btn-cancel" :disabled="loading">
              取消
            </button>
          </template>
        </div>
      </div>

      <!-- 個人資料表單 -->
      <div class="profile-content">
        <div v-if="loading" class="loading-wrapper">
          <BaseLoading message="載入中..." />
        </div>
        <form v-else class="profile-form" @submit.prevent="saveProfile">
          <!-- 使用者名稱 -->
          <div class="form-group">
            <label>使用者名稱</label>
            <input
                v-if="isEditing"
                v-model="editedProfile.username"
                type="text"
                class="form-input"
                :class="{ 'has-error': errors.username }"
            />
            <span v-else class="form-text">{{ currentUser?.username || '-' }}</span>
            <span v-if="errors.username" class="error-text">{{ errors.username }}</span>
          </div>

          <!-- 電子信箱 -->
          <div class="form-group">
            <label>電子信箱</label>
            <input
                v-if="isEditing"
                v-model="editedProfile.email"
                type="email"
                class="form-input"
                :class="{ 'has-error': errors.email }"
            />
            <span v-else class="form-text">{{ currentUser?.email || '-' }}</span>
            <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
          </div>

          <!-- 全名 -->
          <div class="form-group">
            <label>全名</label>
            <input
                v-if="isEditing"
                v-model="editedProfile.fullName"
                type="text"
                class="form-input"
                :class="{ 'has-error': errors.fullName }"
            />
            <span v-else class="form-text">{{ currentUser?.fullName || '-' }}</span>
            <span v-if="errors.fullName" class="error-text">{{ errors.fullName }}</span>
          </div>

          <!-- 電話號碼 -->
          <div class="form-group">
            <label>電話號碼</label>
            <input
                v-if="isEditing"
                v-model="editedProfile.phoneNumber"
                type="tel"
                class="form-input"
                :class="{ 'has-error': errors.phoneNumber }"
            />
            <span v-else class="form-text">{{ currentUser?.phoneNumber || '-' }}</span>
            <span v-if="errors.phoneNumber" class="error-text">{{ errors.phoneNumber }}</span>
          </div>

          <!-- 地址 -->
          <div class="form-group">
            <label>地址</label>
            <textarea
                v-if="isEditing"
                v-model="editedProfile.address"
                class="form-textarea"
                :class="{ 'has-error': errors.address }"
            ></textarea>
            <span v-else class="form-text">{{ currentUser?.address || '-' }}</span>
            <span v-if="errors.address" class="error-text">{{ errors.address }}</span>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
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
    const isEditing = ref(false)
    const loading = ref(false)
    const editedProfile = ref({})
    const errors = ref({})

    const currentUser = computed(() => store.getters['auth/currentUser'])
    const isAuthenticated = computed(() => store.getters['auth/isAuthenticated'])
    const isFormValid = computed(() => {
      return Object.keys(errors.value).length === 0 &&
          Object.keys(editedProfile.value).length > 0
    })

    const validateForm = () => {
      const newErrors = {}

      if (editedProfile.value.email && !email(editedProfile.value.email)) {
        newErrors.email = '請輸入有效的電子郵件'
      }
      if (editedProfile.value.fullName && !fullName(editedProfile.value.fullName)) {
        newErrors.fullName = '請輸入有效的全名'
      }
      if (editedProfile.value.phoneNumber && !phoneNumber(editedProfile.value.phoneNumber)) {
        newErrors.phoneNumber = '請輸入有效的電話號碼'
      }
      if (editedProfile.value.address && !address(editedProfile.value.address)) {
        newErrors.address = '請輸入有效的地址'
      }

      errors.value = newErrors
      return Object.keys(newErrors).length === 0
    }

    const fetchUserProfile = async () => {
      if (!isAuthenticated.value) {
        router.push('/login')
        return
      }

      try {
        loading.value = true
        await store.dispatch('auth/fetchUserInfo')
      } catch (error) {
        store.dispatch('app/setError', {
          message: '獲取用戶資料失敗，請稍後再試',
          type: 'error'
        })
      } finally {
        loading.value = false
      }
    }

    const startEditing = () => {
      editedProfile.value = { ...currentUser.value }
      isEditing.value = true
      errors.value = {}
    }

    const saveProfile = async () => {
      if (!validateForm()) return

      try {
        loading.value = true
        await store.dispatch('auth/updateUserProfile', editedProfile.value)
        await store.dispatch('auth/fetchUserInfo')
        isEditing.value = false
        store.dispatch('app/setSuccess', {
          message: '個人資料更新成功',
          duration: 2000
        })
      } catch (error) {
        store.dispatch('app/setError', {
          message: '更新個人資料失敗，請稍後再試',
          type: 'error'
        })
      } finally {
        loading.value = false
      }
    }

    const cancelEditing = () => {
      isEditing.value = false
      editedProfile.value = {}
      errors.value = {}
    }

    onMounted(async () => {
      if (isAuthenticated.value) {
        await fetchUserProfile()
      } else {
        router.push('/login')
      }
    })

    return {
      isEditing,
      loading,
      currentUser,
      editedProfile,
      errors,
      isFormValid,
      startEditing,
      saveProfile,
      cancelEditing
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.title {
  font-size: 1.25rem;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.profile-content {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #4299e1;
  outline: none;
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.form-text {
  display: block;
  padding: 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #333;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-edit {
  background: #4299e1;
  color: white;
}

.btn-save {
  background: #48bb78;
  color: white;
}

.btn-cancel {
  background: #f56565;
  color: white;
  margin-left: 0.5rem;
}

.loading-wrapper {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

.has-error {
  border-color: #f56565;
}

.error-text {
  color: #f56565;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

/* RWD */
@media (max-width: 768px) {
  .profile-container {
    padding: 0.5rem;
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
    gap: 0.5rem;
  }

  .btn {
    flex: 1;
    max-width: 120px;
  }
}

@media (max-width: 480px) {
  .profile-header {
    padding: 0.75rem;
  }

  .profile-content {
    padding: 0.75rem;
  }

  .btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.813rem;
  }
}
</style>
