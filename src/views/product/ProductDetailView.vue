<template>
  <div class="product-detail-view">
    <div class="container">
      <div class="row">
        <!-- 商品圖片區 -->
        <div class="col-md-6">
          <div class="product-gallery">
            <div class="main-image">
              <img :src="getImageUrl(currentImage)" :alt="product.name">
            </div>
            <div class="thumbnail-list">
              <div
                  v-for="(image, index) in product.images"
                  :key="index"
                  class="thumbnail"
                  :class="{ active: currentImageIndex === index }"
                  @click="selectImage(index)"
              >
                <img :src="getImageUrl(image)" :alt="product.name">
              </div>
            </div>
          </div>
        </div>

        <!-- 商品資訊區 -->
        <div class="col-md-6">
          <div class="product-info">
            <h1 class="product-title">{{ product.name }}</h1>
            <div class="product-brand">{{ product.brand }}</div>

            <!-- 價格區 -->
            <div class="price-section">
              <div class="current-price">${{ formatPrice(product.price) }}</div>
              <div v-if="product.originalPrice" class="original-price">
                原價: ${{ formatPrice(product.originalPrice) }}
              </div>
            </div>

            <!-- 商品規格選擇 -->
            <div class="product-options">
              <!-- 顏色選擇 -->
              <div v-if="product.colors?.length" class="color-selection">
                <label>顏色</label>
                <div class="color-options">
                  <div
                      v-for="color in product.colors"
                      :key="color.code"
                      class="color-option"
                      :class="{ active: selectedColor === color.code }"
                      :style="{ backgroundColor: color.code }"
                      @click="selectColor(color.code)"
                  ></div>
                </div>
              </div>

              <!-- 尺寸選擇 -->
              <div v-if="product.sizes?.length" class="size-selection">
                <label>尺寸</label>
                <div class="size-options">
                  <button
                      v-for="size in product.sizes"
                      :key="size"
                      class="size-option"
                      :class="{ active: selectedSize === size }"
                      @click="selectSize(size)"
                  >
                    {{ size }}
                  </button>
                </div>
              </div>

              <!-- 數量選擇 -->
              <div class="quantity-selection">
                <label>數量</label>
                <div class="quantity-control">
                  <button
                      @click="decreaseQuantity"
                      :disabled="quantity <= 1"
                  >-</button>
                  <input
                      type="number"
                      v-model.number="quantity"
                      min="1"
                      :max="product.stock"
                  >
                  <button
                      @click="increaseQuantity"
                      :disabled="quantity >= product.stock"
                  >+</button>
                </div>
                <div class="stock-info">
                  庫存: {{ product.stock }}
                </div>
              </div>
            </div>

            <!-- 購買按鈕 -->
            <div class="purchase-actions">
              <button
                  class="add-to-cart"
                  @click="addToCart"
                  :disabled="!canAddToCart"
              >
                加入購物車
              </button>
              <button
                  class="buy-now"
                  @click="buyNow"
                  :disabled="!canAddToCart"
              >
                立即購買
              </button>
            </div>

            <!-- 商品描述 -->
            <div class="product-description">
              <h2>商品描述</h2>
              <div class="description-content" v-html="product.description"></div>
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
import axios from 'axios'

export default {
  name: 'ProductDetailView',

  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1988'

    // 響應式狀態
    const product = ref({})
    const currentImageIndex = ref(0)
    const selectedColor = ref('')
    const selectedSize = ref('')
    const quantity = ref(1)
    const loading = ref(true)

    // 計算屬性
    const currentImage = computed(() => {
      return product.value.images?.[currentImageIndex.value] || product.value.imageUrl
    })

    const canAddToCart = computed(() => {
      return product.value.stock > 0 &&
          (!product.value.colors?.length || selectedColor.value) &&
          (!product.value.sizes?.length || selectedSize.value)
    })

    // 圖片處理方法
    const getImageUrl = (imagePath) => {
      if (!imagePath) return ''
      if (imagePath.startsWith('http')) return imagePath
      if (imagePath.startsWith('/')) {
        return `${baseUrl}${imagePath}`
      }
      return `${baseUrl}/static/images/${imagePath}`
    }

    // API 方法
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`/api/v1/products/${route.params.id}`)
        product.value = response.data

        // 初始化選項
        if (product.value.colors?.length) {
          selectedColor.value = product.value.colors[0].code
        }
        if (product.value.sizes?.length) {
          selectedSize.value = product.value.sizes[0]
        }
      } catch (error) {
        console.error('獲取商品資訊失敗:', error)
      } finally {
        loading.value = false
      }
    }
    // UI 互動方法
    const selectImage = (index) => {
      currentImageIndex.value = index
    }

    const selectColor = (color) => {
      selectedColor.value = color
    }

    const selectSize = (size) => {
      selectedSize.value = size
    }

    const increaseQuantity = () => {
      if (quantity.value < product.value.stock) {
        quantity.value++
      }
    }

    const decreaseQuantity = () => {
      if (quantity.value > 1) {
        quantity.value--
      }
    }

    const formatPrice = (price) => {
      return price?.toLocaleString('zh-TW') || '0'
    }

    // 購物車相關方法
    const addToCart = async () => {
      if (!canAddToCart.value) return

      try {
        const cartItem = {
          productId: product.value.id,
          quantity: quantity.value,
          color: selectedColor.value,
          size: selectedSize.value,
          price: product.value.price,
          name: product.value.name,
          image: getImageUrl(product.value.images?.[0])
        }

        await store.dispatch('cart/addToCart', cartItem)
        store.dispatch('showMessage', {
          type: 'success',
          message: '成功加入購物車'
        })
      } catch (error) {
        console.error('加入購物車失敗:', error)
        store.dispatch('showMessage', {
          type: 'error',
          message: '加入購物車失敗'
        })
      }
    }

    const buyNow = async () => {
      try {
        await addToCart()
        router.push('/checkout')
      } catch (error) {
        console.error('立即購買失敗:', error)
      }
    }

    // 生命週期鉤子
    onMounted(() => {
      fetchProduct()
    })

    return {
      // 狀態
      product,
      currentImage,
      currentImageIndex,
      selectedColor,
      selectedSize,
      quantity,
      loading,
      canAddToCart,

      // 方法
      getImageUrl,
      selectImage,
      selectColor,
      selectSize,
      increaseQuantity,
      decreaseQuantity,
      formatPrice,
      addToCart,
      buyNow
    }
  }
}
</script>


<style scoped>
.product-detail-view {
  padding: 2rem 0;
  background-color: #fff;
}

.product-gallery {
  margin-bottom: 2rem;
}

.main-image {
  width: 100%;
  height: 400px;
  overflow: hidden;
  border-radius: 8px;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-list {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
}

.thumbnail.active {
  border-color: var(--primary-color);
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 0 1rem;
}

.product-title {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.product-brand {
  color: #666;
  margin-bottom: 1rem;
}

.price-section {
  margin-bottom: 2rem;
}

.current-price {
  font-size: 2rem;
  font-weight: 600;
  color: var(--primary-color);
}

.original-price {
  color: #999;
  text-decoration: line-through;
}

.product-options {
  margin-bottom: 2rem;
}

.color-selection,
.size-selection,
.quantity-selection {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.color-options {
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

.size-options {
  display: flex;
  gap: 0.5rem;
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

.quantity-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quantity-control button {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  background: none;
  border-radius: 4px;
}

.quantity-control input {
  width: 60px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.25rem;
}

.stock-info {
  margin-top: 0.5rem;
  color: #666;
}

.purchase-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.add-to-cart,
.buy-now {
  flex: 1;
  padding: 1rem;
  border-radius: 4px;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
}

.add-to-cart {
  background-color: #fff;
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
}

.buy-now {
  background-color: var(--primary-color);
  color: #fff;
}

.product-description {
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

@media (max-width: 768px) {
  .product-info {
    padding: 1rem 0;
  }

  .purchase-actions {
    flex-direction: column;
  }

  .main-image {
    height: 300px;
  }
}
</style>
