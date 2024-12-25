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
            :disabled="quantity <= 1">
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
            :disabled="quantity >= item.stock">
          <i class="fas fa-plus"></i>
        </button>
      </div>

      <!-- 小計金額 -->
      <div class="subtotal">
        小計: ${{ formatPrice(item.price * quantity) }}
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
      return price.toLocaleString('zh-TW', { style: 'currency', currency: 'TWD' });
    },

    updateQuantity(change) {
      const newQuantity = this.quantity + change;
      if (newQuantity >= 1 && newQuantity <= this.item.stock) {
        this.quantity = newQuantity;
        this.emitUpdate();
      }
    },

    handleQuantityChange() {
      if (this.quantity < 1) {
        this.quantity = 1;
      } else if (this.quantity > this.item.stock) {
        this.quantity = this.item.stock;
      }
      this.emitUpdate();
    },

    emitUpdate() {
      this.$emit('update-quantity', {
        id: this.item.id,
        quantity: this.quantity
      });
    },

    removeItem() {
      this.$emit('remove-item', this.item.id);
    }
  },

  watch: {
    'item.quantity'(newVal) {
      this.quantity = newVal;
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
  font-weight: bold;
}

.item-brand {
  color: #666;
}

.item-price {
  margin-bottom: 1rem;
}

.current-price {
  font-size: 1.2rem;
  font-weight: bold;
}

.original-price {
  font-size: 0.9rem;
  color: #999;
}

.quantity-control {
  display: flex;
}

.quantity-btn {
  width: 32px;
}

.quantity-control input {
  width: auto; /* 自動調整寬度 */
}

.subtotal {
  font-weight: bold;
}

.item-actions {
  display: flex;
}

.remove-btn {
  color: #dc3545; /* Bootstrap danger color */
}
</style>
