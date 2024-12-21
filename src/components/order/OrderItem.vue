<template>
  <div class="order-item">
    <!-- 訂單標題區 -->
    <div class="order-item__header">
      <div class="order-item__header-left">
        <span class="order-number">訂單編號：{{ order.orderNumber }}</span>
        <span class="order-date">{{ formatDate(order.createdAt) }}</span>
      </div>
      <div class="order-item__header-right">
        <span class="order-status" :class="statusClass">
          {{ getStatusText(order.status) }}
        </span>
      </div>
    </div>

    <!-- 訂單內容區 -->
    <div class="order-item__content">
      <!-- 商品資訊 -->
      <div class="product-info" v-for="item in order.items" :key="item.id">
        <div class="product-image">
          <img :src="item.productImage" :alt="item.productName">
        </div>
        <div class="product-details">
          <h4>{{ item.productName }}</h4>
          <p class="product-spec" v-if="item.specification">
            規格：{{ item.specification }}
          </p>
          <div class="product-price-qty">
            <span class="price">${{ formatPrice(item.price) }}</span>
            <span class="quantity">x {{ item.quantity }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 訂單摘要區 -->
    <div class="order-item__footer">
      <div class="order-summary">
        <span class="total-items">共 {{ getTotalItems }} 件商品</span>
        <span class="total-amount">
          訂單金額：
          <strong>${{ formatPrice(order.totalAmount) }}</strong>
        </span>
      </div>

      <!-- 操作按鈕區 -->
      <div class="order-actions">
        <BaseButton
            v-if="showTrackButton"
            variant="outline"
            @click="handleTrackOrder"
        >
          物流追蹤
        </BaseButton>

        <BaseButton
            variant="primary"
            @click="handleViewDetail"
        >
          查看詳情
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'

const props = defineProps({
  order: {
    type: Object,
    required: true,
    validator: (order) => {
      return order.orderNumber &&
          order.items &&
          Array.isArray(order.items) &&
          order.totalAmount !== undefined
    }
  }
})

const router = useRouter()

// 計算訂單總商品數量
const getTotalItems = computed(() => {
  return props.order.items.reduce((total, item) => total + item.quantity, 0)
})

// 根據訂單狀態決定是否顯示物流追蹤按鈕
const showTrackButton = computed(() => {
  return ['shipped', 'delivering'].includes(props.order.status)
})

// 訂單狀態樣式
const statusClass = computed(() => {
  const statusMap = {
    pending: 'status-pending',
    paid: 'status-paid',
    shipped: 'status-shipped',
    delivering: 'status-delivering',
    completed: 'status-completed',
    cancelled: 'status-cancelled'
  }
  return statusMap[props.order.status] || 'status-default'
})

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化價格
const formatPrice = (price) => {
  return price.toLocaleString('zh-TW')
}

// 獲取狀態文字
const getStatusText = (status) => {
  const statusTextMap = {
    pending: '待付款',
    paid: '已付款',
    shipped: '已出貨',
    delivering: '配送中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusTextMap[status] || status
}

// 處理查看詳情
const handleViewDetail = () => {
  router.push(`/order/${props.order.orderNumber}`)
}

// 處理物流追蹤
const handleTrackOrder = () => {
  // 實作物流追蹤邏輯
  console.log('追蹤訂單:', props.order.orderNumber)
}
</script>

<style scoped>
.order-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 16px;
  background-color: #fff;
}

.order-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.order-item__header-left {
  display: flex;
  gap: 16px;
}

.order-number {
  font-weight: 600;
}

.order-date {
  color: #666;
}

.order-status {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.9em;
}

.status-pending { background-color: #fff3e0; color: #ff9800; }
.status-paid { background-color: #e3f2fd; color: #2196f3; }
.status-shipped { background-color: #e8f5e9; color: #4caf50; }
.status-delivering { background-color: #f3e5f5; color: #9c27b0; }
.status-completed { background-color: #e8f5e9; color: #4caf50; }
.status-cancelled { background-color: #fafafa; color: #9e9e9e; }

.order-item__content {
  padding: 16px;
}

.product-info {
  display: flex;
  gap: 16px;
  padding: 8px 0;
}

.product-image img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.product-details {
  flex: 1;
}

.product-details h4 {
  margin: 0 0 8px 0;
  font-size: 1em;
}

.product-spec {
  color: #666;
  font-size: 0.9em;
  margin: 4px 0;
}

.product-price-qty {
  display: flex;
  gap: 12px;
  align-items: center;
}

.price {
  color: #f44336;
  font-weight: 600;
}

.quantity {
  color: #666;
}

.order-item__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  background-color: #fafafa;
}

.order-summary {
  display: flex;
  gap: 16px;
  align-items: center;
}

.total-items {
  color: #666;
}

.total-amount {
  font-size: 1.1em;
}

.order-actions {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  .order-item__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .order-item__footer {
    flex-direction: column;
    gap: 16px;
  }

  .order-summary {
    width: 100%;
    justify-content: space-between;
  }

  .order-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
