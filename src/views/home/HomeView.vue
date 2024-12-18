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

    <!-- 商品分類導航 -->
    <nav class="category-nav">
      <ul>
        <li v-for="category in categories"
            :key="category.categoryId"
            @click="goToCategory(category.categoryId)">
          {{ category.name }}
        </li>
      </ul>
    </nav>

    <!-- 熱門商品區 -->
    <section class="featured-products">
      <div class="section-header">
        <h2>熱門商品</h2>
        <router-link to="/products" class="view-all">查看全部</router-link>
      </div>
      <div class="products-grid">
        <ProductCard
            v-for="product in featuredProducts"
            :key="product.productId"
            :product="product"
            @add-to-cart="addToCart"
        />
      </div>
    </section>

    <!-- 最新商品區 -->
    <section class="new-arrivals">
      <div class="section-header">
        <h2>最新商品</h2>
        <router-link to="/products?sort=newest" class="view-all">查看全部</router-link>
      </div>
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
import { productApi, cartApi } from '@/utils/axios'

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
        image: '/images/carousel/slide1.jpg',
        caption: '新品上市'
      },
      {
        image: '/images/carousel/slide2.jpg',
        caption: '限時特惠'
      }
    ])

    // 商品分類
    const categories = ref([])
    const featuredProducts = ref([])
    const newProducts = ref([])

    // 輪播事件處理
    const onSlideStart = () => {
      // 輪播開始事件處理
    }

    const onSlideEnd = () => {
      // 輪播結束事件處理
    }

    // 跳轉到分類頁面
    const goToCategory = (categoryId) => {
      router.push(`/products/category/${categoryId}`)
    }
    const getProducts = async () => {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          productApi.getCategories(),
          productApi.getList({ featured: true })
        ])
        categories.value = categoriesRes
        featuredProducts.value = productsRes
      } catch (error) {
        store.dispatch('app/setError', {
          message: '獲取數據失敗',
          type: 'error'
        })
      }
    }

    // 加入購物車
    const addToCart = async (product) => {
      try {
        await cartApi.addToCart({
          productId: product.productId,
          quantity: 1
        })
        store.dispatch('cart/updateCartCount')
        store.dispatch('app/showNotification', {
          type: 'success',
          message: '成功加入購物車'
        })
      } catch (error) {
        store.dispatch('app/showNotification', {
          type: 'error',
          message: '加入購物車失敗'
        })
      }
    }

    // 初始化數據
    onMounted(async () => {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          productApi.getCategories(),
          productApi.getProducts({ featured: true })
        ])

        categories.value = categoriesRes.data
        featuredProducts.value = productsRes.data
      } catch (error) {
        console.error('獲取數據失敗:', error)
      }
    })


    return {
      currentSlide,
      carouselSlides,
      categories,
      featuredProducts,
      newProducts,
      onSlideStart,
      onSlideEnd,
      goToCategory,
      addToCart,
      getProducts
    }
  }
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.carousel-section {
  margin: 1rem 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.category-nav {
  background: #fff;
  padding: 1rem 0;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border-radius: 8px;
}

.category-nav ul {
  display: flex;
  justify-content: center;
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;
  flex-wrap: wrap;
}

.category-nav li {
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.category-nav li:hover {
  background: var(--primary-color);
  color: white;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--primary-color);
}

.section-header h2 {
  font-size: 1.5rem;
  margin: 0;
  color: var(--primary-color);
  font-weight: 600;
}

.view-all {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.view-all:hover {
  color: var(--primary-dark);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

@media (max-width: 768px) {
  .category-nav ul {
    gap: 1rem;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1rem;
  }

  .section-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}
</style>
