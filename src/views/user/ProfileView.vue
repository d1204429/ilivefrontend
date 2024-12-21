<template>
  <div class="profile-container">
    <div class="profile-header">
      <h2>個人資料</h2>
      <button v-if="!isEditing" @click="startEditing" class="edit-btn">
        編輯資料
      </button>
      <div v-else class="action-buttons">
        <button @click="saveProfile" class="save-btn">儲存</button>
        <button @click="cancelEditing" class="cancel-btn">取消</button>
      </div>
    </div>

    <div class="profile-content">
      <div class="profile-info">
        <div class="info-group">
          <label>使用者名稱</label>
          <input v-if="isEditing" v-model="editedProfile.username" type="text" />
          <span v-else>{{ userProfile.username }}</span>
        </div>
        <div class="info-group">
          <label>電子信箱</label>
          <input v-if="isEditing" v-model="editedProfile.email" type="email" />
          <span v-else>{{ userProfile.email }}</span>
        </div>
        <div class="info-group">
          <label>全名</label>
          <input v-if="isEditing" v-model="editedProfile.fullName" type="text" />
          <span v-else>{{ userProfile.fullName }}</span>
        </div>
        <div class="info-group">
          <label>電話號碼</label>
          <input v-if="isEditing" v-model="editedProfile.phoneNumber" type="tel" />
          <span v-else>{{ userProfile.phoneNumber }}</span>
        </div>
        <div class="info-group">
          <label>地址</label>
          <textarea v-if="isEditing" v-model="editedProfile.address"></textarea>
          <span v-else>{{ userProfile.address }}</span>
        </div>
      </div>
    </div>

    <div class="orders-section">
      <h3>訂單記錄</h3>
      <div class="orders-list">
        <div v-if="orders.length === 0" class="no-orders">
          尚無訂單記錄
        </div>
        <div v-else v-for="order in orders" :key="order.orderId" class="order-item">
          <div class="order-header">
            <span>訂單編號: {{ order.orderId }}</span>
            <span>訂購日期: {{ formatDate(order.createdAt) }}</span>
          </div>
          <div class="order-details">
            <span>總金額: ${{ order.totalAmount }}</span>
            <span>狀態: {{ getOrderStatus(order.status) }}</span>
          </div>
          <button @click="viewOrderDetail(order.orderId)" class="detail-btn">
            查看詳情
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ProfileView',
  data() {
    return {
      isEditing: false,
      userProfile: {
        username: '',
        email: '',
        fullName: '',
        phoneNumber: '',
        address: ''
      },
      editedProfile: {},
      orders: []
    };
  },
  created() {
    this.fetchUserProfile();
    this.fetchOrders();
  },
  methods: {
    async fetchUserProfile() {
      try {
        const response = await axios.get('/api/user/profile', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        this.userProfile = response.data;
      } catch (error) {
        console.error('獲取用戶資料失敗:', error);
      }
    },
    async fetchOrders() {
      try {
        const response = await axios.get('/api/orders/user', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        this.orders = response.data;
      } catch (error) {
        console.error('獲取訂單記錄失敗:', error);
      }
    },
    startEditing() {
      this.editedProfile = { ...this.userProfile };
      this.isEditing = true;
    },
    async saveProfile() {
      try {
        const response = await axios.put('/api/user/profile', this.editedProfile, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        this.userProfile = response.data;
        this.isEditing = false;
        this.$message.success('個人資料更新成功');
      } catch (error) {
        console.error('更新個人資料失敗:', error);
        this.$message.error('更新失敗，請稍後再試');
      }
    },
    cancelEditing() {
      this.isEditing = false;
      this.editedProfile = {};
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('zh-TW');
    },
    getOrderStatus(status) {
      const statusMap = {
        'PENDING': '處理中',
        'SHIPPED': '已出貨',
        'DELIVERED': '已送達',
        'CANCELLED': '已取消'
      };
      return statusMap[status] || status;
    },
    viewOrderDetail(orderId) {
      this.$router.push(`/order/${orderId}`);
    }
  }
};
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
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

.action-buttons {
  display: flex;
  gap: 10px;
}

.edit-btn,
.save-btn,
.cancel-btn,
.detail-btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
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

.orders-section {
  margin-top: 30px;
}

.order-item {
  background: #fff;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.order-details {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.detail-btn {
  background: #607D8B;
  color: white;
}

.no-orders {
  text-align: center;
  padding: 20px;
  color: #666;
}
</style>
