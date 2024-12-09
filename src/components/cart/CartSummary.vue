<template>
  <div class="cart-summary">
    <!-- 購物車標題 -->
    <div class="summary-header">
      <h2>購物車摘要</h2>
      <span class="item-count">{{ totalItems }} 件商品</span>
    </div>

    <!-- 價格明細 -->
    <div class="price-details">
      <div class="price-row">
        <span>商品總額</span>
        <span>${{ formatPrice(subtotal) }}</span>
      </div>

      <!-- 折扣區塊 -->
      <div class="discount-section" v-if="discount > 0">
        <div class="price-row discount">
          <span>折扣金額</span>
          <span>-${{ formatPrice(discount) }}</span>
        </div>
      </div>

      <!-- 運費計算 -->
      <div class="shipping-section">
        <div class="price-row">
          <span>運費</span>
          <span v-if="shipping === 0">免運費</span>
          <span v-else>${{ formatPrice(shipping) }}</span>
        </div>
        <div class="shipping-note" v-if="remainingForFreeShipping > 0">
          再購買 ${{ formatPrice(remainingForFreeShipping) }} 即可享免運優惠
        </div>
      </div>

      <!-- 優惠碼輸入 -->
      <div class="coupon-section">
        <div class="coupon-input">
          <input
              type="text"
              v-model="couponCode"
              placeholder="請輸入優惠碼"
              :disabled="appliedCoupon"
          >
          <button
              @click="applyCoupon"
              :disabled="!couponCode || appliedCoupon"
          >
            {{ appliedCoupon ? '已套用' : '套用' }}
          </button>
        </div>
        <div class="coupon-message" v-if="couponMessage">
          {{ couponMessage }}
        </div>
      </div>

      <!-- 總計金額 -->
      <div class="total-section">
        <div class="price-row total">
          <span>總計</span>
          <span>${{ formatPrice(total) }}</span>
        </div>
      </div>
    </div>

    <!-- 結帳按鈕 -->
    <div class="checkout-actions">
      <button
          class="checkout-button"
          @click="proceedToCheckout"
          :disabled="totalItems === 0"
      >
        前往結帳
      </button>
      <button
          class="continue-shopping"
          @click="continueShopping"
      >
        繼續購物
      </button>
    </div>

    <!-- 付款方式提示 -->
    <div class="payment-methods">
      <h3>付款方式</h3>
      <div class="payment-icons">
        <i class="fab fa-cc-visa"></i>
        <i class="fab fa-cc-mastercard"></i>
        <i class="fab fa-cc-jcb"></i>
        <i class="fab fa-apple-pay"></i>
        <i class="fab fa-google-pay"></i>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

export default {
  name: 'CartSummary',

  setup() {
    const router = useRouter()
    const store = useStore()
    const couponCode = ref('')
    const couponMessage = ref('')
    const appliedCoupon = ref(false)

    // 計算屬性
    const subtotal = computed(() => store.getters['cart/cartSubtotal'])
    const discount = computed(() => store.getters['cart/cartDiscount'])
    const shipping = computed(() => {
      return subtotal.value >= 1000 ? 0 : 60
    })
    const total = computed(() => {
      return subtotal.value - discount.value + shipping.value
    })
    const totalItems = computed(() => store.getters['cart/cartItemCount'])
    const remainingForFreeShipping = computed(() => {
      return subtotal.value >= 1000 ? 0 : 1000 - subtotal.value
    })

    // 方法
    const formatPrice = (price) => {
      return price.toLocaleString('zh-TW')
    }

    const applyCoupon = async () => {
      try {
        const result = await store.dispatch('cart/applyCoupon', couponCode.value)
        if (result.success) {
          appliedCoupon.value = true
          couponMessage.value = '優惠碼套用成功！'
        } else {
          couponMessage.value = result.message || '優惠碼無效'
        }
      } catch (error) {
        couponMessage.value = '優惠碼套用失敗，請稍後再試'
      }
    }

    const proceedToCheckout = () => {
      if (totalItems.value > 0) {
        router.push('/checkout')
      }
    }

    const continueShopping = () => {
      router.push('/products')
    }

    return {
      couponCode,
      couponMessage,
      appliedCoupon,
      subtotal,
      discount,
      shipping,
      total,
      totalItems,
      remainingForFreeShipping,
      formatPrice,
      applyCoupon,
      proceedToCheckout,
      continueShopping
    }
  }
}
</script>

<style scoped>
.cart-summary {
  background: #ffffff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.summary-header h2 {
  font-size: 1.5rem;
  margin: 0;
}

.item-count {
  color: #666;
}

.price-details {
  margin-bottom: 1.5rem;
}

.price-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.discount {
  color: #e53935;
}

.shipping-section {
  padding: 1rem 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.shipping-note {
  font-size: 0.9rem;
  color: #2196f3;
  margin-top: 0.5rem;
}

.coupon-section {
  margin: 1rem 0;
}

.coupon-input {
  display: flex;
  gap: 0.5rem;
}

.coupon-input input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.coupon-input button {
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.coupon-input button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.coupon-message {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #4caf50;
}

.total-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.total {
  font-size: 1.2rem;
  font-weight: bold;
}

.checkout-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
}

.checkout-button,
.continue-shopping {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.checkout-button {
  background: var(--primary-color);
  color: white;
}

.checkout-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.continue-shopping {
  background: white;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}

.payment-methods {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.payment-methods h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
}

.payment-icons {
  display: flex;
  gap: 1rem;
  color: #666;
}

.payment-icons i {
  font-size: 2rem;
}

@media (max-width: 768px) {
  .cart-summary {
    margin: 1rem;
  }
}
</style>
