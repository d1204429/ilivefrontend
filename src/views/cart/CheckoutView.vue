<template>
  <div class="checkout-view">
    <!-- 結帳流程進度條 -->
    <div class="checkout-steps">
      <div class="step" :class="{ active: currentStep >= 1 }">購物車確認</div>
      <div class="step" :class="{ active: currentStep >= 2 }">填寫資料</div>
      <div class="step" :class="{ active: currentStep >= 3 }">付款方式</div>
    </div>

    <!-- 購買人資訊 -->
    <div class="checkout-section" v-if="currentStep === 1">
      <h2>購買人資訊</h2>
      <div class="form-group">
        <label>姓名</label>
        <input v-model="buyerInfo.name" type="text" required>
      </div>
      <div class="form-group">
        <label>手機</label>
        <input v-model="buyerInfo.phone" type="tel" required>
      </div>
      <div class="form-group">
        <label>市話(選填)</label>
        <input v-model="buyerInfo.tel" type="tel">
      </div>
      <div class="form-group">
        <label>地址</label>
        <div class="address-inputs">
          <select v-model="buyerInfo.city">
            <option value="">請選擇縣市</option>
            <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
          </select>
          <select v-model="buyerInfo.district">
            <option value="">請選擇地區</option>
            <option v-for="district in districts" :key="district" :value="district">{{ district }}</option>
          </select>
          <input v-model="buyerInfo.address" type="text" placeholder="詳細地址">
        </div>
      </div>
    </div>

    <!-- 寄送方式 -->
    <div class="checkout-section" v-if="currentStep === 2">
      <h2>寄送方式</h2>
      <div class="shipping-options">
        <div v-for="method in shippingMethods"
             :key="method.id"
             class="shipping-option"
             :class="{ active: selectedShipping === method.id }"
             @click="selectShipping(method.id)">
          <div class="method-info">
            <h3>{{ method.name }}</h3>
            <p>{{ method.description }}</p>
          </div>
          <div class="method-price">
            {{ method.price === 0 ? '免運費' : `$${method.price}` }}
          </div>
        </div>
      </div>
    </div>

    <!-- 付款方式 -->
    <div class="checkout-section" v-if="currentStep === 3">
      <h2>付款方式</h2>
      <div class="payment-methods">
        <div v-for="method in paymentMethods"
             :key="method.id"
             class="payment-method"
             :class="{ active: selectedPayment === method.id }"
             @click="selectPayment(method.id)">
          <i :class="method.icon"></i>
          <div class="method-details">
            <h3>{{ method.name }}</h3>
            <p>{{ method.description }}</p>
          </div>
        </div>
      </div>

      <!-- 信用卡表單 -->
      <div class="credit-card-form" v-if="selectedPayment === 'credit'">
        <div class="form-group">
          <label>卡號</label>
          <input type="text" v-model="cardInfo.number" placeholder="1234 5678 9012 3456">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>有效期限</label>
            <input type="text" v-model="cardInfo.expiry" placeholder="MM/YY">
          </div>
          <div class="form-group">
            <label>CVV</label>
            <input type="text" v-model="cardInfo.cvv" placeholder="123">
          </div>
        </div>
      </div>
    </div>

    <!-- 訂單摘要 -->
    <div class="order-summary">
      <h2>訂單摘要</h2>
      <div class="summary-items">
        <div v-for="item in cartItems" :key="item.id" class="summary-item">
          <img :src="item.imageUrl" :alt="item.name">
          <div class="item-details">
            <h3>{{ item.name }}</h3>
            <p>數量: {{ item.quantity }}</p>
            <p class="item-price">${{ formatPrice(item.price * item.quantity) }}</p>
          </div>
        </div>
      </div>
      <div class="summary-total">
        <div class="total-row">
          <span>小計</span>
          <span>${{ formatPrice(subtotal) }}</span>
        </div>
        <div class="total-row">
          <span>運費</span>
          <span>${{ formatPrice(shippingFee) }}</span>
        </div>
        <div class="total-row grand-total">
          <span>總計</span>
          <span>${{ formatPrice(total) }}</span>
        </div>
      </div>
    </div>

    <!-- 操作按鈕 -->
    <div class="checkout-actions">
      <button
          v-if="currentStep > 1"
          class="btn-back"
          @click="previousStep"
      >
        上一步
      </button>
      <button
          class="btn-next"
          @click="nextStep"
          :disabled="!canProceed"
      >
        {{ currentStep === 3 ? '確認付款' : '下一步' }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

export default {
  name: 'CheckoutView',

  setup() {
    const router = useRouter()
    const store = useStore()
    const currentStep = ref(1)

    // 購買人資訊
    const buyerInfo = ref({
      name: '',
      phone: '',
      tel: '',
      city: '',
      district: '',
      address: ''
    })

    // 運送方式
    const shippingMethods = [
      { id: 'home', name: '宅配到府', description: '2-3 個工作天到貨', price: 60 },
      { id: 'store', name: '超商取貨', description: '2-3 個工作天到店', price: 60 },
      { id: 'free', name: '免運宅配', description: '消費滿 1000 元免運費', price: 0 }
    ]
    const selectedShipping = ref('')

    // 付款方式
    const paymentMethods = [
      { id: 'credit', name: '信用卡', description: '支援 VISA, Master, JCB', icon: 'fas fa-credit-card' },
      { id: 'transfer', name: 'ATM轉帳', description: '請於訂單成立後 3 天內完成付款', icon: 'fas fa-university' }
    ]
    const selectedPayment = ref('')

    // 信用卡資訊
    const cardInfo = ref({
      number: '',
      expiry: '',
      cvv: ''
    })

    // 購物車商品
    const cartItems = computed(() => store.state.cart.items)

    // 計算金額
    const subtotal = computed(() => {
      return cartItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    })

    const shippingFee = computed(() => {
      if (selectedShipping.value === 'free' || subtotal.value >= 1000) return 0
      return 60
    })

    const total = computed(() => subtotal.value + shippingFee.value)

    // 檢查是否可以進行下一步
    const canProceed = computed(() => {
      if (currentStep.value === 1) {
        return buyerInfo.value.name &&
            buyerInfo.value.phone &&
            buyerInfo.value.city &&
            buyerInfo.value.district &&
            buyerInfo.value.address
      }
      if (currentStep.value === 2) {
        return selectedShipping.value
      }
      if (currentStep.value === 3) {
        return selectedPayment.value &&
            (selectedPayment.value !== 'credit' ||
                (cardInfo.value.number && cardInfo.value.expiry && cardInfo.value.cvv))
      }
      return false
    })

    // 方法
    const nextStep = async () => {
      if (currentStep.value < 3) {
        currentStep.value++
      } else {
        await processPayment()
      }
    }

    const previousStep = () => {
      if (currentStep.value > 1) {
        currentStep.value--
      }
    }

    const selectShipping = (methodId) => {
      selectedShipping.value = methodId
    }

    const selectPayment = (methodId) => {
      selectedPayment.value = methodId
    }

    const formatPrice = (price) => {
      return price.toLocaleString('zh-TW')
    }

    const processPayment = async () => {
      try {
        const orderData = {
          items: cartItems.value,
          buyerInfo: buyerInfo.value,
          shipping: {
            method: selectedShipping.value,
            fee: shippingFee.value
          },
          payment: {
            method: selectedPayment.value,
            cardInfo: selectedPayment.value === 'credit' ? cardInfo.value : null
          },
          total: total.value
        }

        await store.dispatch('order/createOrder', orderData)
        router.push('/order/success')
      } catch (error) {
        console.error('付款失敗:', error)
      }
    }

    return {
      currentStep,
      buyerInfo,
      shippingMethods,
      selectedShipping,
      paymentMethods,
      selectedPayment,
      cardInfo,
      cartItems,
      subtotal,
      shippingFee,
      total,
      canProceed,
      nextStep,
      previousStep,
      selectShipping,
      selectPayment,
      formatPrice
    }
  }
}
</script>

<style scoped>
.checkout-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.checkout-steps {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.step {
  padding: 1rem 2rem;
  margin: 0 1rem;
  background: #f5f5f5;
  border-radius: 4px;
  color: #666;
}

.step.active {
  background: var(--primary-color);
  color: white;
}

.checkout-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
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

.address-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 1rem;
}

.shipping-options,
.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.shipping-option,
.payment-method {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.shipping-option.active,
.payment-method.active {
  border-color: var(--primary-color);
  background: #f8f9ff;
}

.credit-card-form {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.order-summary {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.summary-items {
  margin-bottom: 2rem;
}

.summary-item {
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
}

.summary-item img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.grand-total {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--primary-color);
  border-top: 1px solid #eee;
  padding-top: 1rem;
}

.checkout-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-back,
.btn-next {
  padding: 0.75rem 2rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.btn-back {
  background: white;
  border: 1px solid #ddd;
}

.btn-next {
  background: var(--primary-color);
  color: white;
  border: none;
}

.btn-next:disabled {
  background: #ccc;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .checkout-view {
    padding: 1rem;
  }

  .address-inputs {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
