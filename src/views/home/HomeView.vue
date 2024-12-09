<template>
  <div class="home">
    <!-- 輪播圖區域 -->
    <div class="carousel-section">
      <b-carousel
          v-model="currentSlide"
          :interval="4000"
          controls
          indicators
          background="#ababab"
          @sliding-start="onSlideStart"
          @sliding-end="onSlideEnd"
      >
        <b-carousel-slide
            v-for="(slide, index) in carouselSlides"
            :key="index"
            :img-src="slide.image"
            :caption="slide.caption"
        />
      </b-carousel>
    </div>

    <!-- 熱門商品區 -->
    <section class="featured-products">
      <h2 class="section-title">熱門商品</h2>
      <div class="products-grid">
        <ProductCard
            v-for="product in featuredProducts"
            :key="product.productId"
            :product="product"
            @add-to-cart="addToCart"
        />
      </div>
    </section>

    <!-- 商品分類區 -->
    <section class="categories-section">
      <h2 class="section-title">商品分類</h2>
      <div class="categories-grid">
        <div
            v-for="category in categories"
            :key="category.categoryId"
            class="category-card"
            @click="goToCategory(category.categoryId)"
        >
          <img :src="category.imageUrl" :alt="category.name">
          <h3>{{ category.name }}</h3>
        </div>
      </div>
    </section>

    <!-- 最新商品區 -->
    <section class="new-arrivals">
      <h2 class="section-title">最新商品</h2>
      <div class="products-grid">
        <ProductCard
            v-for="product in newProducts"
            :key="product.productId"
            :product="product"
            @add-to-cart="addToCart"
        />
      </div>
    </section>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import ProductCard from '@/components/product/ProductCard.vue'

export default {
  name: 'HomeView',

  components: {
    ProductCard
  },

  setup() {
    const router = useRouter()
    const store = useStore()

    // 輪播圖數據
    const currentSlide = ref(0)
    const carouselSlides = ref([
      {
        image: '/carousel/slide1.jpg',
        caption: '新品上市'
      },
      {
        image: '/carousel/slide2.jpg',
        caption: '限時特惠'
      },
      {
        image: '/carousel/slide3.jpg',
        caption: '熱銷推薦'
      }
    ])

    // 商品數據
    const featuredProducts = ref([])
    const newProducts = ref([])
    const categories = ref([])

    // 獲取熱門商品
    const fetchFeaturedProducts = async () => {
      try {
        const response = await store.dispatch('product/getFeaturedProducts')
        featuredProducts.value = response.data
      } catch (error) {
        console.error('獲取熱門商品失敗:', error)
      }
    }

    // 獲取最新商品
    const fetchNewProducts = async () => {
      try {
        const response = await store.dispatch('product/getNewProducts')
        newProducts.value = response.data
      } catch (error) {
        console.error('獲取最新商品失敗:', error)
      }
    }

    // 獲取商品分類
    const fetchCategories = async () => {
      try {
        const response = await store.dispatch('product/getCategories')
        categories.value = response.data
      } catch (error) {
        console.error('獲取商品分類失敗:', error)
      }
    }

    // 加入購物車
    const addToCart = async (product) => {
      try {
        await store.dispatch('cart/addToCart', {
          productId: product.productId,
          quantity: 1
        })
      } catch (error) {
        console.error('加入購物車失敗:', error)
      }
    }

    // 前往分類頁面
    const goToCategory = (categoryId) => {
      router.push(`/category/${categoryId}`)
    }

    // 輪播圖事件處理
    const onSlideStart = () => {
      // 輪播開始時的處理邏輯
    }

    const onSlideEnd = () => {
      // 輪播結束時的處理邏輯
    }

    onMounted(() => {
      fetchFeaturedProducts()
      fetchNewProducts()
      fetchCategories()
    })

    return {
      currentSlide,
      carouselSlides,
      featuredProducts,
      newProducts,
      categories,
      addToCart,
      goToCategory,
      onSlideStart,
      onSlideEnd
    }
  }
}
</script>

<style scoped>
.home {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.carousel-section {
  margin-bottom: 3rem;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.8rem;
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  padding-bottom: 0.5rem;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background-color: var(--primary-color);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.category-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.category-card img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.category-card:hover img {
  transform: scale(1.05);
}

.category-card h3 {
  padding: 1rem;
  margin: 0;
  text-align: center;
  font-size: 1.1rem;
  color: var(--text-color);
}

@media (max-width: 768px) {
  .home {
    padding: 1rem;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .categories-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .section-title {
    font-size: 1.5rem;
  }
}
</style>
