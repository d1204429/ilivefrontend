<template>
  <div class="home-view">
    <!-- 輪播圖部分 -->
    <div class="carousel">
      <div class="carousel-inner" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
        <div v-for="(slide, index) in carouselSlides"
             :key="index"
             class="carousel-slide">
          <img :src="slide.image" :alt="slide.caption">
          <div class="carousel-caption">{{ slide.caption }}</div>
        </div>
      </div>
    </div>

    <!-- 商品分類 -->
    <section class="categories-section">
      <h2>商品分類</h2>
      <div class="categories-grid">
        <div v-for="category in categories"
             :key="category.categoryId"
             class="category-card"
             @click="goToCategory(category.categoryId)">
          <h3>{{ category.name }}</h3>
          <p>{{ category.description }}</p>
        </div>
      </div>
    </section>

    <!-- 精選商品 -->
    <section class="featured-section">
      <h2>精選商品</h2>
      <div class="products-grid">
        <ProductCard
            v-for="product in featuredProducts"
            :key="product.productId"
            :product="product"
            @add-to-cart="addToCart"
        />
      </div>
    </section>

    <!-- 新品上市 -->
    <section class="new-products-section">
      <h2>新品上市</h2>
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
import { productApi, cartApi } from '@/services/api'

export default {
  name: 'HomeView',
  components: {
    ProductCard
  },

  setup() {
    const router = useRouter()
    const store = useStore()

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

    const categories = ref([])
    const featuredProducts = ref([])
    const newProducts = ref([])

    const getProducts = async () => {
      try {
        // 修改為正確的 API 調用方式
        const [categoriesRes, featuredRes, newProductsRes] = await Promise.all([
          productApi.getList({ type: 'category' }),
          productApi.getList({ featured: true }),
          productApi.getList({ sort: 'newest' })
        ])

        categories.value = categoriesRes
        featuredProducts.value = featuredRes
        newProducts.value = newProductsRes
      } catch (error) {
        console.error('獲取數據失敗:', error)
        store.dispatch('app/setError', error.message || '獲取數據失敗')
      }
    }

    const addToCart = async (product) => {
      try {
        await cartApi.addItem({
          productId: product.productId,
          quantity: 1
        })
        await store.dispatch('cart/fetchCartItems')
        store.dispatch('app/setSuccess', '成功加入購物車')
      } catch (error) {
        store.dispatch('app/setError', '加入購物車失敗')
      }
    }

    const goToCategory = (categoryId) => {
      router.push(`/category/${categoryId}`)
    }

    onMounted(() => {
      getProducts()
    })

    return {
      currentSlide,
      carouselSlides,
      categories,
      featuredProducts,
      newProducts,
      goToCategory,
      addToCart
    }
  }
}
</script>

<style scoped>
.home-view {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.carousel {
  position: relative;
  overflow: hidden;
  margin-bottom: 2rem;
  border-radius: 8px;
}

.carousel-inner {
  display: flex;
  transition: transform 0.3s ease-in-out;
}

.carousel-slide {
  min-width: 100%;
  position: relative;
}

.carousel-slide img {
  width: 100%;
  height: auto;
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

.categories-section,
.featured-section,
.new-products-section {
  margin-bottom: 3rem;
}

h2 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.categories-grid,
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.category-card {
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.category-card:hover {
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .categories-grid,
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}
</style>
