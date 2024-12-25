<template>
  <div class="product-card" :class="{ 'out-of-stock': !product.availableStock }">
    <!-- 商品圖片區塊 -->
    <div class="product-image-container">
      <img
          :src="getProductImageUrl"
          :alt="product.name"
          @error="handleImageError"
          @load="handleImageLoad"
          class="product-image"
          :class="{ 'loading': imageLoading }"
      >
      <div class="product-badges" v-if="showBadges">
        <span v-if="product.isNew" class="badge new">新品</span>
        <span v-if="product.isOnSale" class="badge sale">特價</span>
        <span v-if="product.discount" class="badge discount">
          {{ product.discount }}折
        </span>
      </div>
      <div v-if="imageLoading" class="image-skeleton"></div>
    </div>

    <!-- 商品內容區塊 -->
    <div class="product-content">
      <h3 class="product-title" :title="product.name">
        {{ truncateText(product.name, 20) }}
      </h3>

      <div class="product-meta">
        <span v-if="product.brand" class="brand">
          <i class="fas fa-tag"></i> {{ product.brand }}
        </span>
        <span v-if="product.categoryName" class="category">
          <i class="fas fa-folder"></i> {{ product.categoryName }}
        </span>
      </div>

      <div class="product-price" :class="{ 'has-discount': hasDiscount }">
        <span class="current-price">
          NT$ {{ formatPrice(product.promotionalPrice || product.price) }}
        </span>
        <span v-if="hasDiscount" class="original-price">
          NT$ {{ formatPrice(product.originalPrice) }}
        </span>
      </div>

      <p v-if="product.description" class="product-description">
        {{ truncateText(product.description, 50) }}
      </p>

      <div class="product-stock" :class="stockStatusClass">
        <i :class="stockStatusIcon"></i>
        {{ stockStatusText }}
      </div>

      <div class="product-actions">
        <BaseButton
            class="cart-btn"
            :disabled="!canAddToCart"
            @click="handleAddToCart"
            :loading="addingToCart"
        >
          <i class="fas fa-cart-plus"></i>
          {{ cartButtonText }}
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import BaseButton from '@/components/common/BaseButton.vue'
import { handleError } from '@/utils/errorHandler'

export default {
  name: 'ProductCard',
  components: { BaseButton },
  props: {
    product: {
      type: Object,
      required: true,
      validator(product) {
        return product.productId && product.name && typeof product.price === 'number'
      }
    }
  },
  setup(props) {
    const router = useRouter()
    const store = useStore()

    const imageLoading = ref(true)
    const addingToCart = ref(false)
    const imageError = ref(false)

    // 計算屬性
    const getProductImageUrl = computed(() => {
      if (imageError.value || !props.product.imageUrl) {
        return '/static/image/no-image.webp'
      }
      const imageUrl = props.product.imageUrl
      if (imageUrl.startsWith('http')) {
        const urlParts = imageUrl.split('/')
        return `/static/image/${urlParts[urlParts.length - 1]}`
      }
      return `/static/image/${imageUrl}`
    })

    const showBadges = computed(() => props.product.isNew || props.product.isOnSale || props.product.discount)

    const hasDiscount = computed(() => props.product.originalPrice && props.product.originalPrice > props.product.price)

    const stockStatusClass = computed(() => ({
      'in-stock': props.product.availableStock > 10,
      'low-stock': props.product.availableStock > 0 && props.product.availableStock <= 10,
      'out-of-stock': !props.product.availableStock
    }))

    const stockStatusIcon = computed(() => {
      if (!props.product.availableStock) return 'fas fa-times-circle'
      if (props.product.availableStock <= 10) return 'fas fa-exclamation-circle'
      return 'fas fa-check-circle'
    })

    const stockStatusText = computed(() => {
      if (!props.product.availableStock) return '已售完'
      if (props.product.availableStock <= 10) return `剩餘 ${props.product.availableStock} 件`
      return '現貨充足'
    })

    const cartButtonText = computed(() => {
      if (addingToCart.value) return '處理中...'
      if (!props.product.availableStock) return '已售完'
      return '加入購物車'
    })

    const canAddToCart = computed(() => props.product.availableStock > 0 && !addingToCart.value)

    // 方法
    const formatPrice = (price) => {
      if (!price) return '0'
      return new Intl.NumberFormat('zh-TW', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price)
    }

    const truncateText = (text, length) => {
      if (!text) return ''
      return text.length > length ? `${text.substring(0, length)}...` : text
    }

    const handleImageLoad = () => {
      imageLoading.value = false
    }

    const handleImageError = (event) => {
      console.error('Image load failed:', event)
      imageError.value = true
      imageLoading.value = false
      event.target.src = '/static/image/no-image.webp'
    }

    const handleAddToCart = async () => {
      if (!canAddToCart.value) return
      addingToCart.value = true
      try {
        await store.dispatch('cart/addToCart', { productId: props.product.productId, quantity: 1 })
        store.dispatch('app/showNotification', { type: 'success', message: '已加入購物車', duration: 3000 })
      } catch (error) {
        const errorMessage = handleError(error)
        store.dispatch('app/showNotification', { type: 'error', message: errorMessage || '加入購物車失敗', duration: 3000 })
      } finally {
        addingToCart.value = false
      }
    }

    const handleViewDetail = () => {
      router.push({ name: 'ProductDetail', params: { id: props.product.productId } })
    }

    return {
      imageLoading,
      addingToCart,
      getProductImageUrl,
      showBadges,
      hasDiscount,
      stockStatusClass,
      stockStatusIcon,
      stockStatusText,
      cartButtonText,
      canAddToCart,
      formatPrice,
      truncateText,
      handleImageLoad,
      handleImageError,
      handleAddToCart,
      handleViewDetail
    }
  }
}
</script>
<style scoped>
.product-card {
  position: relative;
  background: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.product-image-container {
  position: relative;
  padding-top: 100%;
  overflow: hidden;
  background: #f5f5f5;
}

.product-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.product-image.loading {
  opacity: 0;
}

.image-skeleton {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.product-badges {
  position: absolute;
  top: 8px;
  left: 8px;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
}

.badge.new {
  background-color: var(--primary-color);
}

.badge.sale {
  background-color: var(--danger-color);
}

.badge.discount {
  background-color: var(--warning-color);
}

.product-content {
  padding: 1rem;
}

.product-title {
  font-size:1.1rem;
  font-weight:bold;
  margin-bottom:.5rem;
  color:variables(--text-primary);
  line-height:1.4;
}

.product-meta {
  display:flex;
  gap:.5rem;
  margin-bottom:.5rem;
  font-size:.9rem;
  color:variables(--text-secondary);
}

.product-meta i {
  margin-right:.25rem;
}

.product-price {
  margin-bottom:.5rem;
}

.current-price {
  font-size:1.2rem;
  font-weight:bold;
  color:variables(--primary-color);
}

.original-price {
  font-size:.9rem;
  text-decoration:line-through;
  color:variables(--text-muted);
  margin-left:.25rem;
}

.product-description {
  font-size:.9rem;
  color:variables(--text-secondary);
  margin-bottom:.5rem;
  line-height:1.5;
}

.product-stock {
  font-size:.9rem;
  margin-bottom:1rem;
  display:flex;
  align-items:center;
}

.product-stock i {
  margin-right:.25rem;
}

.product-stock.in-stock { color:variables(--success-color); }
.product-stock.low-stock { color:variables(--warning-color); }
.product-stock.out-of-stock { color:variables(--danger-color); }

.product-actions { display:flex; gap:.5rem; }

.product-actions button { flex:1; min-height:36px; }

@keyframes loading {
  from { background-position:200% }
  to { background-position:-200% }
}

@media (max-width:768px) {
  .product-card { font-size:.9rem; }
  .product-title { font-size:1rem; }
  .current-price { font-size:1.1rem; }
  .product-actions { flex-direction:column; }
}
</style>
