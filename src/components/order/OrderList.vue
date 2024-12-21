<template>
  <div class="order-list">
    <!-- 訂單篩選器 -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>訂單狀態：</label>
        <select v-model="filterStatus" @change="handleFilterChange">
          <option value="">全部</option>
          <option value="pending">待付款</option>
          <option value="paid">已付款</option>
          <option value="shipping">配送中</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>
      <div class="filter-group">
        <label>時間範圍：</label>
        <input
            type="date"
            v-model="filterDateRange.start"
            @change="handleFilterChange"
        >
        <span>至</span>
        <input
            type="date"
            v-model="filterDateRange.end"
            @change="handleFilterChange"
        >
      </div>
    </div>

    <!-- 訂單列表 -->
    <div class="orders-container">
      <template v-if="orders.length">
        <div
            v-for="order in orders"
            :key="order.id"
            class="order-card"
            :class="{ 'expanded': expandedOrderId === order.id }"
        >
          <!-- 訂單摘要 -->
          <div class="order-summary" @click="toggleOrderDetails(order.id)">
            <div class="order-header">
              <span class="order-number">訂單編號：{{ order.orderNumber }}</span>
              <span class="order-date">{{ formatDate(order.createdAt) }}</span>
            </div>
            <div class="order-info">
              <span class="order-status" :class="order.status">
                {{ getStatusText(order.status) }}
              </span>
              <span class="order-amount">
                總金額：NT$ {{ formatPrice(order.totalAmount) }}
              </span>
            </div>
          </div>

          <!-- 訂單詳情 -->
          <div v-show="expandedOrderId === order.id" class="order-details">
            <div class="items-list">
              <div
                  v-for="item in order.items"
                  :key="item.id"
                  class="order-item"
              >
                <img :src="item.productImage" :alt="item.productName">
                <div class="item-info">
                  <h4>{{ item.productName }}</h4>
                  <p>數量：{{ item.quantity }}</p>
                  <p>單價：NT$ {{ formatPrice(item.price) }}</p>
                </div>
              </div>
            </div>

            <div class="order-actions">
              <BaseButton
                  v-if="order.status === 'pending'"
                  @click="handlePayment(order.id)"
              >
                前往付款
              </BaseButton>
              <BaseButton
                  variant="outline"
                  @click="viewOrderDetail(order.id)"
              >
                查看詳情
              </BaseButton>
              <BaseButton
                  v-if="canCancel(order.status)"
                  variant="danger"
                  @click="cancelOrder(order.id)"
              >
                取消訂單
              </BaseButton>
            </div>
          </div>
        </div>
      </template>

      <!-- 無訂單時顯示 -->
      <div v-else class="no-orders">
        <p>目前沒有符合條件的訂單</p>
      </div>
    </div>

    <!-- 分頁控制 -->
    <div v-if="totalPages > 1" class="pagination">
      <BaseButton
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
      >
        上一頁
      </BaseButton>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <BaseButton
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
      >
        下一頁
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'

const props = defineProps({
  orders: {
    type: Array,
    required: true,
    default: () => []
  },
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  }
})

const emit = defineEmits([
  'update:currentPage',
  'filter-change',
  'cancel-order',
  'payment'
])

const router = useRouter()
const expandedOrderId = ref(null)
const filterStatus = ref('')
const filterDateRange = ref({
  start: '',
  end: ''
})

// 展開/收合訂單詳情
const toggleOrderDetails = (orderId) => {
  expandedOrderId.value = expandedOrderId.value === orderId ? null : orderId
}

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化價格
const formatPrice = (price) => {
  return price.toLocaleString()
}

// 取得狀態文字
const getStatusText = (status) => {
  const statusMap = {
    pending: '待付款',
    paid: '已付款',
    shipping: '配送中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

// 判斷是否可以取消訂單
const canCancel = (status) => {
  return ['pending', 'paid'].includes(status)
}

// 處理篩選變更
const handleFilterChange = () => {
  emit('filter-change', {
    status: filterStatus.value,
    dateRange: filterDateRange.value
  })
}

// 切換頁面
const changePage = (page) => {
  emit('update:currentPage', page)
}

// 查看訂單詳情
const viewOrderDetail = (orderId) => {
  router.push(`/order/${orderId}`)
}

// 取消訂單
const cancelOrder = (orderId) => {
  emit('cancel-order', orderId)
}

// 處理付款
const handlePayment = (orderId) => {
  emit('payment', orderId)
}
</script>

<style scoped>
.order-list {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.filter-bar {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.order-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
}

.order-card.expanded {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.order-summary {
  padding: 15px;
  cursor: pointer;
}

.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.order-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.order-status.pending { background: #fff3cd; }
.order-status.paid { background: #d1e7dd; }
.order-status.shipping { background: #cfe2ff; }
.order-status.completed { background: #d1e7dd; }
.order-status.cancelled { background: #f8d7da; }

.order-details {
  border-top: 1px solid #e0e0e0;
  padding: 15px;
}

.items-list {
  display: grid;
  gap: 15px;
  margin-bottom: 15px;
}

.order-item {
  display: flex;
  gap: 15px;
}

.order-item img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.item-info {
  flex: 1;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.no-orders {
  text-align: center;
  padding: 40px;
  background: #f5f5f5;
  border-radius: 8px;
}
</style>
