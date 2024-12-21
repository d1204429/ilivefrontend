<template>
  <div class="profile-container">
    <div class="profile-header">
      <h2>個人資料</h2>
      <button v-if="!isEditing" @click="startEditing" class="edit-btn">
        編輯資料
      </button>
      <div v-else class="action-buttons">
        <button @click="saveProfile" class="save-btn" :disabled="loading">儲存</button>
        <button @click="cancelEditing" class="cancel-btn" :disabled="loading">取消</button>
      </div>
    </div>

    <div class="profile-content">
      <div v-if="loading" class="loading-spinner">
        <BaseLoading message="載入中..." />
      </div>
      <div v-else class="profile-info">
        <div class="info-group">
          <label>使用者名稱</label>
          <input
              v-if="isEditing"
              v-model="editedProfile.username"
              type="text"
              :disabled="loading"
          />
          <span v-else>{{ userProfile?.username || '-' }}</span>
        </div>
        <div class="info-group">
          <label>電子信箱</label>
          <input
              v-if="isEditing"
              v-model="editedProfile.email"
              type="email"
              :disabled="loading"
          />
          <span v-else>{{ userProfile?.email || '-' }}</span>
        </div>
        <div class="info-group">
          <label>全名</label>
          <input
              v-if="isEditing"
              v-model="editedProfile.fullName"
              type="text"
              :disabled="loading"
          />
          <span v-else>{{ userProfile?.fullName || '-' }}</span>
        </div>
        <div class="info-group">
          <label>電話號碼</label>
          <input
              v-if="isEditing"
              v-model="editedProfile.phoneNumber"
              type="tel"
              :disabled="loading"
          />
          <span v-else>{{ userProfile?.phoneNumber || '-' }}</span>
        </div>
        <div class="info-group">
          <label>地址</label>
          <textarea
              v-if="isEditing"
              v-model="editedProfile.address"
              :disabled="loading"
          ></textarea>
          <span v-else>{{ userProfile?.address || '-' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import BaseLoading from '@/components/common/BaseLoading.vue'

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

    // 從 store 獲取用戶資料
    const userProfile = computed(() => store.state.user.userInfo)
    const isAuthenticated = computed(() => store.getters['auth/isAuthenticated'])

    const fetchUserProfile = async () => {
      if (!isAuthenticated.value) {
        router.push('/login')
        return
      }

      try {
        loading.value = true
        await store.dispatch('user/fetchProfile')
      } catch (error) {
        console.error('獲取用戶資料失敗:', error)
        store.dispatch('app/setError', {
          message: '獲取用戶資料失敗，請稍後再試',
          type: 'error'
        })
      } finally {
        loading.value = false
      }
    }

    const startEditing = () => {
      editedProfile.value = { ...userProfile.value }
      isEditing.value = true
    }

    const saveProfile = async () => {
      try {
        loading.value = true
        await store.dispatch('user/updateProfile', editedProfile.value)
        isEditing.value = false
        store.dispatch('app/setSuccess', {
          message: '個人資料更新成功',
          duration: 2000
        })
      } catch (error) {
        console.error('更新個人資料失敗:', error)
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
    }

    onMounted(() => {
      fetchUserProfile()
    })

    return {
      isEditing,
      loading,
      userProfile,
      editedProfile,
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
  padding: 20px;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.profile-content {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.info-group {
  margin-bottom: 20px;
}

.info-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.info-group input,
.info-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.info-group input:disabled,
.info-group textarea:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.edit-btn,
.save-btn,
.cancel-btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: opacity 0.3s;
}

.edit-btn:disabled,
.save-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.edit-btn {
  background: #4CAF50;
  color: white;
}

.save-btn {
  background: #2196F3;
  color: white;
}

.cancel-btn {
  background: #f44336;
  color: white;
}

.loading-spinner {
  text-align: center;
  padding: 20px;
  color: #666;
}
</style>
