<template>
  <div class="profile-view">
    <!-- 個人資料卡片 -->
    <div class="profile-card">
      <h2>個人資料</h2>
      <div class="profile-form">
        <!-- 基本資料 -->
        <div class="form-group">
          <label>使用者名稱</label>
          <input
              type="text"
              v-model="userInfo.username"
              disabled
          >
        </div>

        <div class="form-group">
          <label>電子郵件</label>
          <input
              type="email"
              v-model="userInfo.email"
              :disabled="!isEditing"
          >
        </div>

        <div class="form-group">
          <label>姓名</label>
          <input
              type="text"
              v-model="userInfo.fullName"
              :disabled="!isEditing"
          >
        </div>

        <div class="form-group">
          <label>手機號碼</label>
          <input
              type="tel"
              v-model="userInfo.phoneNumber"
              :disabled="!isEditing"
          >
        </div>

        <div class="form-group">
          <label>地址</label>
          <input
              type="text"
              v-model="userInfo.address"
              :disabled="!isEditing"
          >
        </div>

        <!-- 操作按鈕 -->
        <div class="action-buttons">
          <button
              v-if="!isEditing"
              class="edit-btn"
              @click="startEditing"
          >
            編輯資料
          </button>
          <template v-else>
            <button
                class="save-btn"
                @click="saveChanges"
            >
              儲存變更
            </button>
            <button
                class="cancel-btn"
                @click="cancelEditing"
            >
              取消
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- 修改密碼卡片 -->
    <div class="password-card">
      <h2>修改密碼</h2>
      <div class="password-form">
        <div class="form-group">
          <label>目前密碼</label>
          <input
              type="password"
              v-model="passwordForm.oldPassword"
          >
        </div>

        <div class="form-group">
          <label>新密碼</label>
          <input
              type="password"
              v-model="passwordForm.newPassword"
          >
        </div>

        <div class="form-group">
          <label>確認新密碼</label>
          <input
              type="password"
              v-model="passwordForm.confirmPassword"
          >
        </div>

        <button
            class="change-password-btn"
            @click="changePassword"
            :disabled="!canChangePassword"
        >
          修改密碼
        </button>
      </div>
    </div>

    <!-- 訂單歷史記錄 -->
    <div class="order-history">
      <h2>訂單記錄</h2>
      <div class="order-list">
        <div v-for="order in orders"
             :key="order.orderId"
             class="order-item">
          <div class="order-header">
            <span class="order-id">訂單編號: {{ order.orderId }}</span>
            <span class="order-date">{{ formatDate(order.orderDate) }}</span>
            <span class="order-status">{{ order.status }}</span>
          </div>
          <div class="order-details">
            <div v-for="item in order.items"
                 :key="item.productId"
                 class="order-product">
              <img :src="item.imageUrl" :alt="item.name">
              <div class="product-info">
                <h4>{{ item.name }}</h4>
                <p>數量: {{ item.quantity }}</p>
                <p>單價: ${{ formatPrice(item.price) }}</p>
              </div>
            </div>
          </div>
          <div class="order-total">
            總計: ${{ formatPrice(order.totalAmount) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'ProfileView',

  setup() {
    const store = useStore()
    const isEditing = ref(false)
    const userInfo = ref({})
    const originalUserInfo = ref({})
    const orders = ref([])

    const passwordForm = ref({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })

    // 獲取用戶資料
    const fetchUserInfo = async () => {
      try {
        const response = await store.dispatch('user/getUserInfo')
        userInfo.value = response.data
        originalUserInfo.value = { ...response.data }
      } catch (error) {
        console.error('獲取用戶資料失敗:', error)
      }
    }

    // 獲取訂單記錄
    const fetchOrders = async () => {
      try {
        const response = await store.dispatch('order/getUserOrders')
        orders.value = response.data
      } catch (error) {
        console.error('獲取訂單記錄失敗:', error)
      }
    }

    // 開始編輯
    const startEditing = () => {
      isEditing.value = true
    }

    // 儲存變更
    const saveChanges = async () => {
      try {
        await store.dispatch('user/updateUserInfo', userInfo.value)
        isEditing.value = false
        originalUserInfo.value = { ...userInfo.value }
      } catch (error) {
        console.error('更新用戶資料失敗:', error)
      }
    }

    // 取消編輯
    const cancelEditing = () => {
      userInfo.value = { ...originalUserInfo.value }
      isEditing.value = false
    }

    // 修改密碼
    const changePassword = async () => {
      try {
        await store.dispatch('user/changePassword', {
          oldPassword: passwordForm.value.oldPassword,
          newPassword: passwordForm.value.newPassword
        })
        passwordForm.value = {
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        }
      } catch (error) {
        console.error('修改密碼失敗:', error)
      }
    }

    // 檢查是否可以修改密碼
    const canChangePassword = computed(() => {
      return passwordForm.value.oldPassword &&
          passwordForm.value.newPassword &&
          passwordForm.value.confirmPassword &&
          passwordForm.value.newPassword === passwordForm.value.confirmPassword
    })

    // 格式化日期
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('zh-TW')
    }

    // 格式化價格
    const formatPrice = (price) => {
      return price.toLocaleString('zh-TW')
    }

    onMounted(() => {
      fetchUserInfo()
      fetchOrders()
    })

    return {
      isEditing,
      userInfo,
      passwordForm,
      orders,
      canChangePassword,
      startEditing,
      saveChanges,
      cancelEditing,
      changePassword,
      formatDate,
      formatPrice
    }
  }
}
</script>

<style scoped>
.profile-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.profile-card,
.password-card,
.order-history {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h2 {
  color: var(--primary-color);
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group input:disabled {
  background-color: #f5f5f5;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.edit-btn,
.save-btn,
.cancel-btn,
.change-password-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.edit-btn,
.save-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
}

.cancel-btn {
  background-color: white;
  border: 1px solid #ddd;
}

.change-password-btn {
  width: 100%;
  background-color: var(--primary-color);
  color: white;
  border: none;
}

.change-password-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-item {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
}

.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.order-product {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.order-product img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.order-total {
  text-align: right;
  font-weight: 600;
  color: var(--primary-color);
}

@media (max-width: 768px) {
  .profile-view {
    padding: 1rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .order-header {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
