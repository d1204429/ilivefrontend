<template>
  <div class="cart-view">
    <!-- 購物車標題 -->
    <div class="cart-header">
      <h1>購物車</h1>
    </div>

    <!-- 購物車內容區 -->
    <div class="cart-container">
      <div class="cart-content">
        <!-- 購物車列表 -->
        <div class="cart-list">
          <CartList
              v-if="!loading && cartItems.length > 0"
              :cart-items="cartItems"
              @update-quantity="updateQuantity"
              @remove-item="removeItem"
          />

          <!-- 空購物車提示 -->
          <div v-else-if="!loading && cartItems.length === 0" class="empty-cart">
            <i class="fas fa-shopping-cart"></i>
            <p>您的購物車是空的</p>
            <router-link to="/products" class="continue-shopping">
              繼續購物
            </router-link>
          </div>

          <!-- 載入中提示 -->
          <div v-else class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            載入中...
          </div>
        </div>

        <!-- 購物車摘要 -->
        <div class="cart-summary-container" v-if="cartItems.length > 0">
          <CartSummary
              :cart-items="cartItems"
              :total="calculateTotal"
              @checkout="proceedToCheckout"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import CartList from '@/components/cart/CartList.vue'
import CartSummary from '@/components/cart/CartSummary.vue'

export default {
  name: 'CartView',

  components: {
    CartList,
    CartSummary
  },

  setup() {
    const router = useRouter()
    const store = useStore()
    const loading = ref(true)
    const cartItems = ref([])

    // 計算總金額
    const calculateTotal = computed(() => {
      return cartItems.value.reduce((total, item) => {
        return total + (item.price * item.quantity)
      }, 0)
    })

    // 獲取購物車商品
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

    // 更新商品數量
    const updateQuantity = async (item) => {
      try {
        await store.dispatch('cart/updateCartItem', {
          cartItemId: item.id,
          quantity: item.quantity
        })
        await fetchCartItems()
      } catch (error) {
        console.error('更新數量失敗:', error)
      }
    }

    // 移除商品
    const removeItem = async (itemId) => {
      try {
        await store.dispatch('cart/removeCartItem', itemId)
        await fetchCartItems()
      } catch (error) {
        console.error('移除商品失敗:', error)
      }
    }

    // 前往結帳
    const proceedToCheckout = () => {
      router.push('/checkout')
    }

    onMounted(() => {
      fetchCartItems()
    })

    return {
      loading,
      cartItems,
      calculateTotal,
      updateQuantity,
      removeItem,
      proceedToCheckout
    }
  }
}
</script>

<style scoped>
.cart-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.cart-header {
  margin-bottom: 2rem;
}

.cart-header h1 {
  font-size: 2rem;
  color: var(--primary-color);
}

.cart-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.cart-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  padding: 2rem;
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

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.loading i {
  margin-right: 0.5rem;
}

@media (max-width: 768px) {
  .cart-view {
    padding: 1rem;
  }

  .cart-content {
    grid-template-columns: 1fr;
  }

  .cart-summary-container {
    position: sticky;
    bottom: 0;
    background: white;
    padding: 1rem;
    box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
  }
}
</style>
