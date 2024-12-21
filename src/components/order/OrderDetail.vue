<template>
  <div class="order-detail">
    <!-- 訂單狀態追蹤 -->
    <div class="order-status-tracker">
      <div class="status-timeline">
        <div
            v-for="(status, index) in orderStatuses"
            :key="status.value"
            class="status-point"
            :class="{
            'active': isStatusActive(status.value),
            'completed': isStatusCompleted(status.value, index)
          }"
        >
          <div class="status-icon">
            <i :class="status.icon"></i>
          </div>
          <div class="status-label">{{ status.label }}</div>
          <div class="status-date" v-if="status.date">
            {{ formatDate(status.date) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 訂單基本資訊 -->
    <div class="order-info-section">
      <h3>訂單資訊</h3>
      <div class="info-grid">
        <div class="info-item">
          <label>訂單編號</label>
          <span>{{ orderDetail.orderNumber }}</span>
        </div>
        <div class="info-item">
          <label>訂購日期</label>
          <span>{{ formatDate(orderDetail.createdAt) }}</span>
        </div>
        <div class="info-item">
          <label>付款方式</label>
          <span>{{ orderDetail.paymentMethod }}</span>
        </div>
        <div class="info-item">
          <label>付款狀態</label>
          <span :class="'payment-status-' + orderDetail.paymentStatus">
            {{ getPaymentStatusText(orderDetail.paymentStatus) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 收件人資訊 -->
    <div class="shipping-info-section">
      <h3>收件資訊</h3>
      <div class="info-grid">
        <div class="info-item">
          <label>收件人</label>
          <span>{{ orderDetail.recipient.name }}</span>
        </div>
        <div class="info-item">
          <label>聯絡電話</label>
          <span>{{ orderDetail.recipient.phone }}</span>
        </div>
        <div class="info-item full-width">
          <label>收件地址</label>
          <span>{{ orderDetail.recipient.address }}</span>
        </div>
        <div class="info-item full-width" v-if="orderDetail.recipient.note">
          <label>備註</label>
          <span>{{ orderDetail.recipient.note }}</span>
        </div>
      </div>
    </div>

    <!-- 商品清單 -->
    <div class="order-items-section">
      <h3>商品明細</h3>
      <div class="items-table">
        <table>
          <thead>
          <tr>
            <th>商品資訊</th>
            <th>單價</th>
            <th>數量</th>
            <th>小計</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="item in orderDetail.items" :key="item.id">
            <td class="product-info">
              <img :src="item.image" :alt="item.name">
              <div class="product-details">
                <h4>{{ item.name }}</h4>
                <p v-if="item.specification">{{ item.specification }}</p>
              </div>
            </td>
            <td>${{ formatPrice(item.price) }}</td>
            <td>{{ item.quantity }}</td>
            <td>${{ formatPrice(item.price * item.quantity) }}</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 金額明細 -->
    <div class="order-summary-section">
      <div class="summary-items">
        <div class="summary-item">
          <span>商品總額</span>
          <span>${{ formatPrice(orderDetail.subtotal) }}</span>
        </div>
        <div class="summary-item">
          <span>運費</span>
          <span>${{ formatPrice(orderDetail.shippingFee) }}</span>
        </div>
        <div class="summary-item" v-if="orderDetail.discount">
          <span>優惠折扣</span>
          <span>-${{ formatPrice(orderDetail.discount) }}</span>
        </div>
        <div class="summary-item total">
          <span>訂單總額</span>
          <span>${{ formatPrice(orderDetail.totalAmount) }}</span>
        </div>
      </div>
    </div>

    <!-- 操作按鈕 -->
    <div class="order-actions" v-if="showActions">
      <BaseButton
          v-if="canCancel"
          variant="danger"
          @click="handleCancelOrder"
      >
        取消訂單
      </BaseButton>
      <BaseButton
          v-if="canPay"
          variant="primary"
          @click="handlePayment"
      >
        前往付款
      </BaseButton>
      <BaseButton
          v-if="showTrackingButton"
          variant="outline"
          @click="handleTrackShipment"
      >
        物流追蹤
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'

const props = defineProps({
  orderDetail: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['cancel', 'pay', 'track'])

// 訂單狀態定義
const orderStatuses = [
  { value: 'pending', label: '待付款', icon: 'fas fa-clock' },
  { value: 'paid', label: '已付款', icon: 'fas fa-check-circle' },
  { value: 'shipped', label: '已出貨', icon: 'fas fa-shipping-fast' },
  { value: 'delivered', label: '已送達', icon: 'fas fa-box-open' },
  { value: 'completed', label: '已完成', icon: 'fas fa-flag-checkered' }
]

// 判斷狀態是否啟用
const isStatusActive = (status) => {
  return props.orderDetail.status === status
}

// 判斷狀態是否完成
const isStatusCompleted = (status, index) => {
  const currentStatusIndex = orderStatuses.findIndex(
      s => s.value === props.orderDetail.status
  )
  return index < currentStatusIndex
}

// 計算是否可以取消訂單
const canCancel = computed(() => {
  return ['pending', 'paid'].includes(props.orderDetail.status)
})

// 計算是否可以付款
const canPay = computed(() => {
  return props.orderDetail.status === 'pending' &&
      props.orderDetail.paymentStatus === 'unpaid'
})

// 計算是否顯示物流追蹤按鈕
const showTrackingButton = computed(() => {
  return ['shipped', 'delivering'].includes(props.orderDetail.status)
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

// 取得付款狀態文字
const getPaymentStatusText = (status) => {
  const statusMap = {
    unpaid: '未付款',
    paid: '已付款',
    refunded: '已退款'
  }
  return statusMap[status] || status
}

// 處理取消訂單
const handleCancelOrder = () => {
  emit('cancel', props.orderDetail.id)
}

// 處理付款
const handlePayment = () => {
  emit('pay', props.orderDetail.id)
}

// 處理物流追蹤
const handleTrackShipment = () => {
  emit('track', props.orderDetail.id)
}
</script>

<style scoped>
.order-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.order-status-tracker {
  margin-bottom: 40px;
}

.status-timeline {
  display: flex;
  justify-content: space-between;
  position: relative;
  padding: 20px 0;
}

.status-timeline::before {
  content: '';
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  height: 2px;
  background: #e0e0e0;
  z-index: 1;
}

.status-point {
  position: relative;
  z-index: 2;
  text-align: center;
  flex: 1;
}

.status-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.status-point.active .status-icon {
  border-color: #4caf50;
  color: #4caf50;
}

.status-point.completed .status-icon {
  background: #4caf50;
  border-color: #4caf50;
  color: #fff;
}

.status-label {
  margin-top: 8px;
  font-size: 0.9em;
}

.status-date {
  font-size: 0.8em;
  color: #666;
  margin-top: 4px;
}

.info-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item.full-width {
  grid-column: span 2;
}

.info-item label {
  color: #666;
  margin-bottom: 5px;
}

.items-table {
  margin-top: 15px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.product-info img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.summary-items {
  margin-top: 20px;
  border-top: 1px solid #e0e0e0;
  padding-top: 20px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.summary-item.total {
  font-size: 1.2em;
  font-weight: bold;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-item.full-width {
    grid-column: auto;
  }

  .status-timeline {
    flex-direction: column;
    gap: 20px;
  }

  .status-timeline::before {
    width: 2px;
    height: 100%;
    top: 0;
    left: 19px;
    right: auto;
  }

  .status-point {
    display: flex;
    align-items: center;
    gap: 15px;
    text-align: left;
  }

  .status-label, .status-date {
    margin: 0;
  }
}
</style>
