<template>
  <div class="cart-list">
    <!-- 購物車標題區 -->
    <div class="cart-header">
      <h2>購物車</h2>
      <button
          v-if="cartItems.length > 0"
          class="clear-cart-btn"
          @click="clearCart"
      >
        清空購物車
      </button>
    </div>

    <!-- 購物車為空提示 -->
    <div v-if="cartItems.length === 0" class="empty-cart">
      <i class="fas fa-shopping-cart"></i>
      <p>購物車是空的</p>
      <router-link to="/products" class="continue-shopping">
        繼續購物
      </router-link>
    </div>

    <!-- 購物車商品列表 -->
    <div v-else class="cart-items">
      <div v-for="item in cartItems"
           :key="item.cartItemId"
           class="cart-item">
        <!-- 商品圖片 -->
        <div class="item-image">
          <img :src="item.product.imageUrl" :alt="item.product.name">
        </div>

        <!-- 商品資訊 -->
        <div class="item-info">
          <h3>{{ item.product.name }}</h3>
          <p class="item-brand">{{ item.product.brand }}</p>
          <p class="item-price">${{ formatPrice(item.product.price) }}</p>
        </div>

        <!-- 數量控制 -->
        <div class="quantity-control">
          <button
              @click="updateQuantity(item, -1)"
              :disabled="item.quantity <= 1"
          >
            -
          </button>
          <span>{{ item.quantity }}</span>
          <button
              @click="updateQuantity(item, 1)"
              :disabled="item.quantity >= item.product.stock"
          >
            +
          </button>
        </div>

        <!-- 小計 -->
        <div class="item-subtotal">
          ${{ formatPrice(calculateSubtotal(item)) }}
        </div>

        <!-- 刪除按鈕 -->
        <button
            class="remove-item"
            @click="removeItem(item.cartItemId)"
        >
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>

    <!-- 購物車總結 -->
    <div v-if="cartItems.length > 0" class="cart-summary">
      <div class="summary-row">
        <span>商品總數:</span>
        <span>{{ totalItems }} 件</span>
      </div>
      <div class="summary-row">
        <span>總金額:</span>
        <span class="total-amount">${{ formatPrice(totalAmount) }}</span>
      </div>
      <button
          class="checkout-btn"
          @click="goToCheckout"
          :disabled="!canCheckout"
      >
        前往結帳
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

export default {
  name: 'CartList',

  setup() {
    const store = useStore()
    const router = useRouter()
    const cartItems = ref([])
    const loading = ref(true)

    // 計算屬性
    const totalItems = computed(() => {
      return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
    })

    const totalAmount = computed(() => {
      return cartItems.value.reduce((sum, item) =>
          sum + (item.quantity * item.product.price), 0
      )
    })

    const canCheckout = computed(() => {
      return cartItems.value.length > 0 &&
          cartItems.value.every(item => item.quantity <= item.product.stock)
    })

    // 方法
    const fetchCartItems = async () => {
      try {
        const response = await store.dispatch('cart/fetchCartItems')
        cartItems.value = response.data
      } catch (error) {
        console.error('獲取購物車失敗:', error)
      } finally {
        loading.value = false
      }
    }

    const updateQuantity = async (item, change) => {
      const newQuantity = item.quantity + change
      if (newQuantity > 0 && newQuantity <= item.product.stock) {
        try {
          await store.dispatch('cart/updateCartItem', {
            cartItemId: item.cartItemId,
            quantity: newQuantity
          })
          await fetchCartItems()
        } catch (error) {
          console.error('更新數量失敗:', error)
        }
      }
    }

    const removeItem = async (cartItemId) => {
      try {
        await store.dispatch('cart/removeCartItem', cartItemId)
        await fetchCartItems()
      } catch (error) {
        console.error('移除商品失敗:', error)
      }
    }

    const clearCart = async () => {
      try {
        await store.dispatch('cart/clearCart')
        await fetchCartItems()
      } catch (error) {
        console.error('清空購物車失敗:', error)
      }
    }

    const goToCheckout = () => {
      router.push('/checkout')
    }

    const formatPrice = (price) => {
      return price.toLocaleString('zh-TW')
    }

    const calculateSubtotal = (item) => {
      return item.quantity * item.product.price
    }

    onMounted(() => {
      fetchCartItems()
    })

    return {
      cartItems,
      loading,
      totalItems,
      totalAmount,
      canCheckout,
      updateQuantity,
      removeItem,
      clearCart,
      goToCheckout,
      formatPrice,
      calculateSubtotal
    }
  }
}
</script>

<style scoped>
.cart-list {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.empty-cart {
  text-align: center;
  padding: 3rem;
}

.empty-cart i {
  font-size: 4rem;
  color: #ccc;
  margin-bottom: 1rem;
}

.continue-shopping {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: var(--primary-color);
  color: white;
  text-decoration: none;
  border-radius: 4px;
  margin-top: 1rem;
}

.cart-item {
  display: grid;
  grid-template-columns: auto 2fr 1fr 1fr auto;
  gap: 2rem;
  align-items: center;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.item-image {
  width: 100px;
  height: 100px;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.quantity-control button {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
}

.item-subtotal {
  font-weight: 600;
  color: var(--primary-color);
}

.cart-summary {
  margin-top: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.total-amount {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-color);
}

.checkout-btn {
  width: 100%;
  padding: 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  cursor: pointer;
}

.checkout-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .cart-item {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .item-image {
    width: 100%;
    height: 200px;
  }
}
</style>
