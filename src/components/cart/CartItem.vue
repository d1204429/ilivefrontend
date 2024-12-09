<template>
  <div class="cart-item" :class="{ 'out-of-stock': !item.stock }">
    <!-- 商品圖片 -->
    <div class="item-image">
      <img :src="item.imageUrl" :alt="item.name">
    </div>

    <!-- 商品資訊 -->
    <div class="item-info">
      <h3 class="item-name">{{ item.name }}</h3>
      <p class="item-brand">{{ item.brand }}</p>

      <!-- 價格資訊 -->
      <div class="item-price">
        <span class="current-price">${{ formatPrice(item.price) }}</span>
        <span v-if="item.originalPrice" class="original-price">
          ${{ formatPrice(item.originalPrice) }}
        </span>
      </div>

      <!-- 數量控制 -->
      <div class="quantity-control">
        <button
            class="quantity-btn"
            @click="updateQuantity(-1)"
            :disabled="item.quantity <= 1">
          <i class="fas fa-minus"></i>
        </button>
        <input
            type="number"
            v-model.number="quantity"
            :min="1"
            :max="item.stock"
            @change="handleQuantityChange"
        >
        <button
            class="quantity-btn"
            @click="updateQuantity(1)"
            :disabled="item.quantity >= item.stock">
          <i class="fas fa-plus"></i>
        </button>
      </div>

      <!-- 小計金額 -->
      <div class="subtotal">
        小計: ${{ formatPrice(item.price * item.quantity) }}
      </div>
    </div>

    <!-- 操作按鈕 -->
    <div class="item-actions">
      <button class="remove-btn" @click="removeItem">
        <i class="fas fa-trash"></i>
        移除
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CartItem',

  props: {
    item: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      quantity: this.item.quantity
    }
  },

  methods: {
    formatPrice(price) {
      return price.toLocaleString('zh-TW')
    },

    updateQuantity(change) {
      const newQuantity = this.quantity + change
      if (newQuantity >= 1 && newQuantity <= this.item.stock) {
        this.quantity = newQuantity
        this.emitUpdate()
      }
    },

    handleQuantityChange() {
      if (this.quantity < 1) {
        this.quantity = 1
      } else if (this.quantity > this.item.stock) {
        this.quantity = this.item.stock
      }
      this.emitUpdate()
    },

    emitUpdate() {
      this.$emit('update-quantity', {
        id: this.item.id,
        quantity: this.quantity
      })
    },

    removeItem() {
      this.$emit('remove-item', this.item.id)
    }
  },

  watch: {
    'item.quantity'(newVal) {
      this.quantity = newVal
    }
  }
}
</script>

<style scoped>
.cart-item {
  display: flex;
  padding: 1rem;
  border-bottom: 1px solid #eee;
  background: #fff;
}

.item-image {
  width: 120px;
  height: 120px;
  margin-right: 1rem;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.item-info {
  flex: 1;
  padding: 0 1rem;
}

.item-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.item-brand {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.item-price {
  margin-bottom: 1rem;
}

.current-price {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--primary-color);
}

.original-price {
  font-size: 0.9rem;
  color: #999;
  text-decoration: line-through;
  margin-left: 0.5rem;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.quantity-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  background: none;
  border-radius: 4px;
  cursor: pointer;
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-control input {
  width: 60px;
  text-align: center;
  padding: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.subtotal {
  font-weight: 600;
  color: var(--primary-color);
}

.item-actions {
  display: flex;
  align-items: flex-start;
  padding: 0 1rem;
}

.remove-btn {
  padding: 0.5rem 1rem;
  background: none;
  border: 1px solid #dc3545;
  color: #dc3545;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.remove-btn:hover {
  background: #dc3545;
  color: #fff;
}

.out-of-stock {
  opacity: 0.7;
}

@media (max-width: 768px) {
  .cart-item {
    flex-direction: column;
  }

  .item-image {
    width: 100%;
    height: 200px;
    margin-bottom: 1rem;
  }

  .item-actions {
    margin-top: 1rem;
    justify-content: flex-end;
  }
}
</style>
