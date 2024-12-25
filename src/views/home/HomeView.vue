<template>
  <div class="home-view">
    <!-- 輪播圖部分 -->
    <div class="carousel">
      <button class="carousel-control left" @click="prevSlide">
        <i class="fas fa-chevron-left"></i>
      </button>
      <div class="carousel-inner2" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
        <div v-for="(slide, index) in carouselSlides" :key="index" class="carousel-slide">
          <img :src="slide.image" :alt="slide.caption">
          <div class="carousel-caption">{{ slide.caption }}</div>
        </div>
      </div>
      <button class="carousel-control right" @click="nextSlide">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <!-- 促銷活動區域 -->
    <section class="promotions-section">
      <h2>當前促銷活動</h2>
      <div class="promotions-grid">
        <div v-for="promotion in activePromotions"
             :key="promotion.PromotionID"
             class="promotion-card">
          <div class="promotion-content">
            <h3>{{ promotion.Title }}</h3>
            <p class="promotion-description">{{ promotion.Description }}</p>
            <div class="promotion-details">
              <span class="discount-badge" :class="promotion.DiscountType.toLowerCase()">
                {{ formatDiscount(promotion.DiscountType, promotion.DiscountValue) }}
              </span>
              <div class="promotion-period">
                <p>活動期間：</p>
                <p>{{ formatDate(promotion.StartDate) }} - {{ formatDate(promotion.EndDate) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 熱門商品區域 -->
    <section class="hot-products-section">
      <h2>熱門商品優惠</h2>
      <div class="products-grid">
        <div v-for="promotion in productPromotions"
             :key="promotion.ProductPromotionID"
             class="product-promotion-card">
          <ProductCard
              :product="getProductDetails(promotion.ProductID)"
              :promotional-price="promotion.PromotionalPrice"
              @add-to-cart="addToCart"
          />
          <div class="promotion-tag">
            特惠價格
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import ProductCard from '@/components/product/ProductCard.vue'
import { promotionApi } from '@/services/api'

export default {
  name: 'HomeView',
  components: {
    ProductCard
  },

  setup() {
    const router = useRouter()
    const store = useStore()

    // 輪播圖相關
    const currentSlide = ref(0)
    const carouselSlides = ref([
      {
        image: '/public/carousel/ilive1.webp',
        caption: '新品上市'
      },
      {
        image: '/public/carousel/ilive2.webp',
        caption: '限時特惠'
      },
      {
        image: '/public/carousel/login.webp',
        caption: '立即登入'
      }
    ])

    // 促銷活動和商品相關
    const activePromotions = ref([])
    const productPromotions = ref([])

    // 獲取促銷活動和商品資料
    const getPromotionsData = async () => {
      try {
        const [promotionsRes, productPromotionsRes] = await Promise.all([
          promotionApi.getActivePromotions(),
          promotionApi.getProductPromotions()
        ])

        activePromotions.value = promotionsRes.filter(promo =>
            promo.IsActive && new Date(promo.EndDate) > new Date()
        )

        productPromotions.value = productPromotionsRes
      } catch (error) {
        console.error('獲取促銷資料失敗:', error)
        store.dispatch('app/setError', error.message || '獲取促銷資料失敗')
      }
    }

    // 格式化日期
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('zh-TW')
    }

    // 格式化折扣顯示
    const formatDiscount = (type, value) => {
      return type === 'PERCENTAGE' ? `${value}% OFF` : `$${value} 折扣`
    }

    // 取得商品詳細資訊
    const getProductDetails = (productId) => {
      return store.getters['product/getProductById'](productId)
    }

    // 輪播控制
    const prevSlide = () => {
      currentSlide.value = (currentSlide.value - 1 + carouselSlides.value.length) % carouselSlides.value.length
    }

    const nextSlide = () => {
      currentSlide.value = (currentSlide.value + 1) % carouselSlides.value.length
    }

    // 加入購物車
    const addToCart = async (product) => {
      try {
        await store.dispatch('cart/addToCart', {
          productId: product.productId,
          quantity: 1
        })
        store.dispatch('app/setSuccess', '成功加入購物車')
      } catch (error) {
        store.dispatch('app/setError', '加入購物車失敗')
      }
    }

    onMounted(() => {
      getPromotionsData()
    })

    return {
      currentSlide,
      carouselSlides,
      activePromotions,
      productPromotions,
      formatDate,
      formatDiscount,
      getProductDetails,
      prevSlide,
      nextSlide,
      addToCart
    }
  }
}
</script>
<style scoped>
.home-view {
  padding: 0rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* 輪播圖樣式 */
.carousel {
  position: relative;
  margin: 0 calc(-50vw + 50%);
  width: 100vw;
  overflow: hidden;
}

.carousel-inner2 {
  display: flex;
  transition: transform 0.5s ease-in-out;
  width: 100%;
}

.carousel-slide {
  min-width: 100%;
  position: relative;
  flex-shrink: 0;
  height: auto;
}

.carousel-slide img {
  width: 100%;
  height: 400px;
  object-fit: cover;
}

.carousel-caption {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  text-align: center;
  color: white;
  background: rgba(0, 0, 0, 0.5);
  padding: 1rem;
}

.carousel-control {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  font-size: 1.5rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  z-index: 10;
}

.carousel-control.left {
  left: 10px;
}

.carousel-control.right {
  right: 10px;
}

.carousel-control:hover {
  background: rgba(0, 0, 0, 0.7);
}

/* 促銷活動區域樣式 */
.promotions-section {
  margin: 2rem 0;
  padding: 1rem;
}

.promotions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.promotion-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s;
}

.promotion-card:hover {
  transform: translateY(-4px);
}

.promotion-content {
  padding: 1.5rem;
}

.promotion-description {
  color: #666;
  margin: 0.5rem 0;
}

.promotion-details {
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.discount-badge {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: bold;
  color: white;
}

.discount-badge.percentage {
  background-color: #ff4757;
}

.discount-badge.fixed_amount {
  background-color: #2ed573;
}

.promotion-period {
  font-size: 0.9rem;
  color: #777;
}

/* 熱門商品區域樣式 */
.hot-products-section {
  margin: 2rem 0;
  padding: 1rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.product-promotion-card {
  position: relative;
}

.promotion-tag {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #ff4757;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
  z-index: 1;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .carousel-slide img {
    height: 300px;
  }

  .promotions-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }

  .promotion-content {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .carousel-slide img {
    height: 200px;
  }

  .carousel-caption {
    padding: 0.5rem;
    font-size: 0.9rem;
  }

  .promotion-card {
    margin: 0 0.5rem;
  }
}
</style>
