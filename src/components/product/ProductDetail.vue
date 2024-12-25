<template>
  <div class="product-detail">
    <div class="container">
      <div class="row">
        <!-- 商品圖片區 -->
        <div class="col-md-6">
          <div class="product-gallery">
            <img
                :src="getMainImageUrl"
                :alt="product.name"
                class="main-image"
                @error="handleImageError"
            >
            <div class="thumbnail-list">
              <img
                  v-for="(image, index) in productImages"
                  :key="index"
                  :src="getImageUrl(image)"
                  :class="{ active: selectedImageIndex === index }"
                  @click="selectImage(index)"
                  @error="handleImageError"
                  class="thumbnail"
              >
            </div>
          </div>
        </div>

        <!-- 商品資訊區 -->
        <div class="col-md-6">
          <div class="product-info">
            <h1 class="product-title">{{ product.name }}</h1>
            <div class="product-price">
              <span class="current-price">NT$ {{ formatPrice(product.promotionalPrice || product.price) }}</span>
              <span v-if="hasDiscount" class="original-price">
                NT$ {{ formatPrice(product.originalPrice) }}
              </span>
            </div>

            <!-- 商品規格選擇 -->
            <div class="product-options">
              <div class="option-group" v-if="product.colors">
                <label>顏色</label>
                <div class="color-options">
                  <button
                      v-for="color in product.colors"
                      :key="color.code"
                      :class="{ active: selectedColor === color.code }"
                      @click="selectColor(color.code)"
                      class="color-option"
                      :style="{ backgroundColor: color.code }"
                  ></button>
                </div>
              </div>

              <div class="option-group" v-if="product.sizes">
                <label>尺寸</label>
                <div class="size-options">
                  <button
                      v-for="size in product.sizes"
                      :key="size"
                      :class="{ active: selectedSize === size }"
                      @click="selectSize(size)"
                      class="size-option"
                  >
                    {{ size }}
                  </button>
                </div>
              </div>

              <!-- 數量選擇 -->
              <div class="quantity-selector">
                <label>數量</label>
                <div class="quantity-controls">
                  <button
                      @click="decreaseQuantity"
                      :disabled="quantity <= 1 || loading"
                  >-</button>
                  <input
                      type="number"
                      v-model.number="quantity"
                      min="1"
                      :max="product.availableStock"
                      :disabled="loading"
                  >
                  <button
                      @click="increaseQuantity"
                      :disabled="quantity >= product.availableStock || loading"
                  >+</button>
                </div>
              </div>
            </div>

            <!-- 加入購物車按鈕 -->
            <div class="action-buttons">
              <button
                  class="btn-add-to-cart"
                  @click="addToCart"
                  :disabled="!canAddToCart || loading"
              >
                {{ loading ? '處理中...' : '加入購物車' }}
              </button>
              <button
                  class="btn-buy-now"
                  @click="buyNow"
                  :disabled="!canAddToCart || loading"
              >
                立即購買
              </button>
            </div>

            <!-- 商品描述 -->
            <div class="product-description">
              <h3>商品描述</h3>
              <div class="description-content">{{ product.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { handleError } from '@/utils/errorHandler'

export default {
  name: 'ProductDetail',

  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()

    const product = ref({})
    const selectedImageIndex = ref(0)
    const selectedColor = ref('')
    const selectedSize = ref('')
    const quantity = ref(1)
    const loading = ref(false)
    const imageError = ref(false)

    // 計算屬性
    const hasDiscount = computed(() =>
        product.value.originalPrice &&
        product.value.originalPrice > product.value.promotionalPrice
    )

    const getMainImageUrl = computed(() => {
      if (!product.value.imageUrl) return '/static/image/no-image.webp'
      const imageName = product.value.imageUrl.split('/').pop()
      return `/static/image/${imageName}`
    })

    const productImages = computed(() => {
      if (!product.value.images) return []
      return product.value.images.map(img => img.split('/').pop())
    })

    const canAddToCart = computed(() => {
      return product.value.availableStock > 0 &&
          (!product.value.colors || selectedColor.value) &&
          (!product.value.sizes || selectedSize.value) &&
          !loading.value
    })

    // 方法
    const fetchProduct = async () => {
      loading.value = true
      try {
        const response = await store.dispatch('product/getProductById', route.params.id)
        product.value = response
        selectedColor.value = product.value.colors?.[0]?.code
        selectedSize.value = product.value.sizes?.[0]
      } catch (error) {
        const errorMessage = handleError(error)
        store.dispatch('app/showNotification', {
          type: 'error',
          message: errorMessage || '獲取商品資訊失敗'
        })
      } finally {
        loading.value = false
      }
    }

    const formatPrice = (price) => {
      return new Intl.NumberFormat('zh-TW', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price)
    }

    const handleImageError = (event) => {
      event.target.src = '/static/image/no-image.webp'
      imageError.value = true
    }

    const getImageUrl = (imageName) => {
      if (!imageName) return '/static/image/no-image.webp'
      return `/static/image/${imageName}`
    }

    const selectImage = (index) => {
      selectedImageIndex.value = index
    }

    const selectColor = (color) => {
      selectedColor.value = color
    }

    const selectSize = (size) => {
      selectedSize.value = size
    }

    const increaseQuantity = () => {
      if (quantity.value < product.value.availableStock) {
        quantity.value++
      }
    }

    const decreaseQuantity = () => {
      if (quantity.value > 1) {
        quantity.value--
      }
    }

    const addToCart = async () => {
      if (!canAddToCart.value) return

      loading.value = true
      try {
        await store.dispatch('cart/addToCart', {
          productId: product.value.productId,
          quantity: quantity.value,
          color: selectedColor.value,
          size: selectedSize.value
        })
        store.dispatch('app/showNotification', {
          type: 'success',
          message: '已加入購物車'
        })
      } catch (error) {
        const errorMessage = handleError(error)
        store.dispatch('app/showNotification', {
          type: 'error',
          message: errorMessage || '加入購物車失敗'
        })
      } finally {
        loading.value = false
      }
    }

    const buyNow = async () => {
      if (!canAddToCart.value) return

      loading.value = true
      try {
        await addToCart()
        router.push('/checkout')
      } catch (error) {
        loading.value = false
      }
    }

    onMounted(() => {
      fetchProduct()
    })

    return {
      product,
      selectedImageIndex,
      selectedColor,
      selectedSize,
      quantity,
      loading,
      hasDiscount,
      canAddToCart,
      getMainImageUrl,
      productImages,
      formatPrice,
      handleImageError,
      getImageUrl,
      selectImage,
      selectColor,
      selectSize,
      increaseQuantity,
      decreaseQuantity,
      addToCart,
      buyNow
    }
  }
}
</script>


<style scoped>
.product-detail {
  padding: 2rem 0;
  background-color: #fff;
}

.product-gallery {
  margin-bottom: 2rem;
}

.main-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.thumbnail-list {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.thumbnail {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
}

.thumbnail.active {
  border-color: var(--primary-color);
}

.product-info {
  padding: 0 1rem;
}

.product-title {
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.product-price {
  margin-bottom: 2rem;
}

.current-price {
  font-size: 2rem;
  font-weight: 600;
  color: var(--primary-color);
}

.original-price {
  font-size: 1.2rem;
  color: #999;
  text-decoration: line-through;
  margin-left: 1rem;
}

.option-group {
  margin-bottom: 1.5rem;
}

.option-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.color-options,
.size-options {
  display: flex;
  gap: 1rem;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #ddd;
  cursor: pointer;
}

.color-option.active {
  border-color: var(--primary-color);
}

.size-option {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: none;
  cursor: pointer;
}

.size-option.active {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.quantity-selector {
  margin-bottom: 2rem;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.quantity-controls button {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  background: none;
  border-radius: 4px;
}

.quantity-controls input {
  width: 60px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.25rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn-add-to-cart,
.btn-buy-now {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  cursor: pointer;
}

.btn-add-to-cart {
  background-color: #fff;
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
}

.btn-buy-now {
  background-color: var(--primary-color);
  color: #fff;
}

.product-description {
  padding-top: 2rem;
  border-top: 1px solid #ddd;
}

@media (max-width: 768px) {
  .product-info {
    padding: 1rem 0;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
