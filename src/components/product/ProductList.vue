<template>
  <div class="product-list">
    <!-- 商品分類過濾區 -->
    <div class="filter-section">
      <div class="category-filter">
        <select v-model="selectedCategory" @change="filterProducts">
          <option value="">全部分類</option>
          <option v-for="category in categories"
                  :key="category.categoryId"
                  :value="category.categoryId">
            {{ category.categoryName }}
          </option>
        </select>
      </div>

      <!-- 搜尋欄位 -->
      <div class="search-box">
        <input type="text"
               v-model="searchKeyword"
               @input="filterProducts"
               placeholder="搜尋商品...">
      </div>

      <!-- 價格範圍過濾 -->
      <div class="price-filter">
        <input type="number"
               v-model="minPrice"
               placeholder="最低價格">
        <span>-</span>
        <input type="number"
               v-model="maxPrice"
               placeholder="最高價格">
        <button @click="filterProducts">套用價格</button>
      </div>
    </div>

    <!-- 商品列表區 -->
    <div class="products-grid">
      <div v-for="product in filteredProducts"
           :key="product.productId"
           class="product-card">
        <router-link :to="`/product/${product.productId}`">
          <div class="product-image">
            <img :src="product.imageUrl" :alt="product.name">
          </div>
          <div class="product-info">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-brand">{{ product.brand }}</p>
            <p class="product-price">${{ formatPrice(product.price) }}</p>
            <p class="product-stock"
               :class="{ 'low-stock': product.stock < 10 }">
              庫存: {{ product.stock }}
            </p>
          </div>
        </router-link>
        <button class="add-to-cart"
                @click="addToCart(product)"
                :disabled="product.stock === 0">
          加入購物車
        </button>
      </div>
    </div>

    <!-- 分頁控制區 -->
    <div class="pagination">
      <button @click="previousPage"
              :disabled="currentPage === 1">
        上一頁
      </button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button @click="nextPage"
              :disabled="currentPage === totalPages">
        下一頁
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useStore } from 'vuex'

export default {
  name: 'ProductList',

  setup() {
    const store = useStore()
    const products = ref([])
    const categories = ref([])
    const selectedCategory = ref('')
    const searchKeyword = ref('')
    const minPrice = ref('')
    const maxPrice = ref('')
    const currentPage = ref(1)
    const itemsPerPage = 12

    // 計算過濾後的商品
    const filteredProducts = computed(() => {
      let filtered = products.value

      // 分類過濾
      if (selectedCategory.value) {
        filtered = filtered.filter(p => p.categoryId === selectedCategory.value)
      }

      // 關鍵字搜尋
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase()
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(keyword) ||
            p.description.toLowerCase().includes(keyword)
        )
      }

      // 價格範圍過濾
      if (minPrice.value) {
        filtered = filtered.filter(p => p.price >= minPrice.value)
      }
      if (maxPrice.value) {
        filtered = filtered.filter(p => p.price <= maxPrice.value)
      }

      return filtered
    })

    // 計算總頁數
    const totalPages = computed(() =>
        Math.ceil(filteredProducts.value.length / itemsPerPage)
    )

    // 分頁顯示的商品
    const paginatedProducts = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return filteredProducts.value.slice(start, end)
    })

    // 方法
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/v1/products')
        products.value = response.data
      } catch (error) {
        console.error('獲取商品失敗:', error)
      }
    }

    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/v1/products/categories')
        categories.value = response.data
      } catch (error) {
        console.error('獲取分類失敗:', error)
      }
    }

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

    const filterProducts = () => {
      currentPage.value = 1
    }

    const previousPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--
      }
    }

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++
      }
    }

    const formatPrice = (price) => {
      return price.toLocaleString('zh-TW')
    }

    onMounted(() => {
      fetchProducts()
      fetchCategories()
    })

    return {
      categories,
      selectedCategory,
      searchKeyword,
      minPrice,
      maxPrice,
      currentPage,
      totalPages,
      filteredProducts: paginatedProducts,
      addToCart,
      filterProducts,
      previousPage,
      nextPage,
      formatPrice
    }
  }
}
</script>

<style scoped>
.product-list {
  padding: 2rem;
}

.filter-section {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  align-items: center;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.product-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease;
}

.product-card:hover {
  transform: translateY(-5px);
}

.product-image {
  height: 200px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 1rem;
}

.product-name {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.product-price {
  color: var(--primary-color);
  font-size: 1.25rem;
  font-weight: 600;
}

.add-to-cart {
  width: 100%;
  padding: 0.75rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-to-cart:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 1rem;
  align-items: center;
}

@media (max-width: 768px) {
  .filter-section {
    flex-direction: column;
    gap: 1rem;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}
</style>
