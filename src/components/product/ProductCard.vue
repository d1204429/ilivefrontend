<template>
  <div class="product-card" :class="{ 'out-of-stock': !product.stock }">
    <!-- 商品圖片區塊 -->
    <div class="product-image">
      <img
          :src="product.imageUrl || '/images/placeholder.png'"
          :alt="product.name"
          @error="handleImageError"
      >
      <div class="product-badges" v-if="showBadges">
        <span v-if="product.isNew" class="badge new">新品</span>
        <span v-if="product.isOnSale" class="badge sale">特價</span>
      </div>
    </div>

    <!-- 商品內容區塊 -->
    <div class="product-content">
      <h3 class="product-title">{{ product.name }}</h3>

      <div class="product-meta">
        <span class="brand">{{ product.brand }}</span>
        <span class="category">{{ product.categoryName }}</span>
      </div>

      <div class="product-price">
        <span class="current-price">NT$ {{ formatPrice(product.price) }}</span>
        <span v-if="product.originalPrice" class="original-price">
          NT$ {{ formatPrice(product.originalPrice) }}
        </span>
      </div>

      <p class="product-description">
        {{ truncateText(product.description, 50) }}
      </p>

      <div class="product-stock" :class="stockStatusClass">
        {{ stockStatusText }}
      </div>

      <div class="product-actions">
        <BaseButton
            class="cart-btn"
            :disabled="!product.stock"
            @click="handleAddToCart"
        >
          <i class="fas fa-cart-plus"></i>
          {{ product.stock ? '加入購物車' : '已售完' }}
        </BaseButton>

        <BaseButton
            class="detail-btn"
            variant="outline"
            @click="handleViewDetail"
        >
          <i class="fas fa-info-circle"></i>
          商品詳情
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import BaseButton from '@/components/common/BaseButton.vue'

export default {
  name: 'ProductCard',

  components: {
    BaseButton
  },

  props: {
    product: {
      type: Object,
      required: true,
      validator(product) {
        return product.id &&
            product.name &&
            typeof product.price === 'number'
      }
    }
  },

  setup(props) {
    const router = useRouter()
    const store = useStore()

    // 計算屬性
    const showBadges = computed(() =>
        props.product.isNew || props.product.isOnSale
    )

    const stockStatusClass = computed(() => ({
      'in-stock': props.product.stock > 10,
      'low-stock': props.product.stock > 0 && props.product.stock <= 10,
      'out-of-stock': !props.product.stock
    }))

    const stockStatusText = computed(() => {
      if (!props.product.stock) return '已售完'
      if (props.product.stock <= 10) return `剩餘 ${props.product.stock} 件`
      return '現貨充足'
    })

    // 方法
    const formatPrice = (price) => {
      return price.toLocaleString('zh-TW')
    }

    const truncateText = (text, length) => {
      if (!text) return ''
      return text.length > length
          ? `${text.substring(0, length)}...`
          : text
    }

    const handleImageError = (e) => {
      e.target.src = '/images/placeholder.png'
    }

    const handleAddToCart = async () => {
      try {
        await store.dispatch('cart/addToCart', {
          productId: props.product.id,
          quantity: 1
        })
        store.dispatch('app/showNotification', {
          type: 'success',
          message: '已加入購物車'
        })
      } catch (error) {
        store.dispatch('app/showNotification', {
          type: 'error',
          message: '加入購物車失敗'
        })
      }
    }

    const handleViewDetail = () => {
      router.push(`/products/${props.product.id}`)
    }

    return {
      showBadges,
      stockStatusClass,
      stockStatusText,
      formatPrice,
      truncateText,
      handleImageError,
      handleAddToCart,
      handleViewDetail
    }
  }
}
</script>

<style scoped>
.product-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  overflow: hidden;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.product-image {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-image:hover img {
  transform: scale(1.05);
}

.product-badges {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 4px;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.badge.new {
  background: #4CAF50;
  color: white;
}

.badge.sale {
  background: #f44336;
  color: white;
}

.product-content {
  padding: 16px;
}

.product-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
}

.product-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.product-price {
  margin-bottom: 12px;
}

.current-price {
  font-size: 18px;
  font-weight: 600;
  color: #f44336;
}

.original-price {
  margin-left: 8px;
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
}

.product-description {
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.product-stock {
  margin-bottom: 16px;
  font-size: 14px;
}

.in-stock {
  color: #4CAF50;
}

.low-stock {
  color: #FF9800;
}

.out-of-stock {
  color: #f44336;
}

.product-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.cart-btn,
.detail-btn {
  width: 100%;
  padding: 8px;
  font-size: 14px;
}

.cart-btn i,
.detail-btn i {
  margin-right: 4px;
}

@media (max-width: 768px) {
  .product-actions {
    grid-template-columns: 1fr;
  }
}
</style>
