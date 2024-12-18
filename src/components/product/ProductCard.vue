<template>
  <div class="product-card" :class="{ 'out-of-stock': !product.stock }">
    <!-- 商品圖片區塊 -->
    <div class="product-image">
      <img
          :src="getProductImageUrl"
          :alt="product.name"
          @error="handleImageError"
          class="product-image"
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import BaseButton from '@/components/common/BaseButton.vue'

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
    const imageError = ref(false)

    const getProductImageUrl = computed(() => {
      if (imageError.value || !props.product.imageUrl) {
        return `${import.meta.env.VITE_API_BASE_URL}/api/v1/images/default`
      }
      return `${import.meta.env.VITE_API_BASE_URL}/api/v1/products/${props.product.productId}/image`
    })

    const showBadges = computed(() => props.product.isNew || props.product.isOnSale)

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

    const formatPrice = (price) => {
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

    const handleImageError = (e) => {
      imageError.value = true
      e.target.onerror = null
    }

    const handleAddToCart = async () => {
      if (!props.product.stock) return

      try {
        await store.dispatch('cart/addToCart', {
          productId: props.product.productId,
          quantity: 1
        })

        store.dispatch('app/setSuccess', {
          message: '已加入購物車',
          duration: 3000
        })
      } catch (error) {
        store.dispatch('app/setError', {
          message: '加入購物車失敗',
          duration: 3000
        })
      }
    }

    const handleViewDetail = () => {
      router.push({
        name: 'ProductDetail',
        params: { id: props.product.productId }
      })
    }

    return {
      showBadges,
      stockStatusClass,
      stockStatusText,
      formatPrice,
      truncateText,
      getProductImageUrl,
      handleImageError,
      handleAddToCart,
      handleViewDetail
    }
  }
}
</script>
