<template>
  <div class="product-card" :class="{ 'out-of-stock': product.stock === 0 }">
    <!-- 商品圖片 -->
    <div class="product-image">
      <img :src="product.imageUrl" :alt="product.name">
      <div class="product-tags" v-if="product.isNew || product.isOnSale">
        <span class="tag new-tag" v-if="product.isNew">新品</span>
        <span class="tag sale-tag" v-if="product.isOnSale">特價</span>
      </div>
    </div>

    <!-- 商品資訊 -->
    <div class="product-info">
      <h3 class="product-name">{{ product.name }}</h3>
      <div class="product-brand">{{ product.brand }}</div>

      <!-- 價格區 -->
      <div class="product-price">
        <span class="current-price">${{ formatPrice(product.price) }}</span>
        <span class="original-price" v-if="product.originalPrice">
          ${{ formatPrice(product.originalPrice) }}
        </span>
      </div>

      <!-- 商品描述 -->
      <p class="product-description">{{ truncateDescription(product.description) }}</p>

      <!-- 庫存狀態 -->
      <div class="stock-status" :class="{ 'out-of-stock': product.stock === 0 }">
        {{ product.stock > 0 ? `庫存: ${product.stock}` : '已售完' }}
      </div>

      <!-- 操作按鈕 -->
      <div class="product-actions">
        <b-button
            variant="primary"
            class="add-to-cart-btn"
            @click="addToCart"
            :disabled="product.stock === 0"
        >
          <i class="fas fa-shopping-cart"></i>
          加入購物車
        </b-button>
        <b-button
            variant="outline-secondary"
            class="details-btn"
            @click="viewDetails"
        >
          查看詳情
        </b-button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductCard',

  props: {
    product: {
      type: Object,
      required: true,
      validator: function(product) {
        return product.hasOwnProperty('id') &&
            product.hasOwnProperty('name') &&
            product.hasOwnProperty('price') &&
            product.hasOwnProperty('stock')
      }
    }
  },

  methods: {
    formatPrice(price) {
      return price.toLocaleString('zh-TW')
    },

    truncateDescription(description) {
      return description.length > 100
          ? `${description.substring(0, 100)}...`
          : description
    },

    addToCart() {
      if (this.product.stock > 0) {
        this.$emit('add-to-cart', {
          productId: this.product.id,
          quantity: 1
        })
      }
    },

    viewDetails() {
      this.$router.push(`/products/${this.product.id}`)
    }
  }
}
</script>

<style scoped>
.product-card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  overflow: hidden;
  margin: 1rem;
  max-width: 300px;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.product-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-tags {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 0.5rem;
}

.tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.new-tag {
  background-color: var(--primary-color);
  color: white;
}

.sale-tag {
  background-color: var(--danger-color);
  color: white;
}

.product-info {
  padding: 1rem;
}

.product-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.product-brand {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.current-price {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--primary-color);
}

.original-price {
  font-size: 0.9rem;
  color: #999;
  text-decoration: line-through;
}

.product-description {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
}

.stock-status {
  font-size: 0.9rem;
  color: #28a745;
  margin-bottom: 1rem;
}

.stock-status.out-of-stock {
  color: var(--danger-color);
}

.product-actions {
  display: flex;
  gap: 0.5rem;
}

.add-to-cart-btn,
.details-btn {
  flex: 1;
  padding: 0.5rem;
  font-size: 0.9rem;
}

.out-of-stock .add-to-cart-btn {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .product-card {
    max-width: 100%;
  }

  .product-actions {
    flex-direction: column;
  }
}
</style>
