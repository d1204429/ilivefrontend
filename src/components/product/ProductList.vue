<template>
  <div class="product-list">
    <!-- 商品分類過濾區 -->
    <div class="filter-section">
      <div class="category-filter">
        <select v-model="selectedCategory" @change="handleCategoryChange">
          <option value="">全部分類</option>
          <option
              v-for="category in categories"
              :key="category.categoryId"
              :value="category.categoryId"
          >
            {{ category.name }}
          </option>
        </select>
      </div>

      <!-- 搜尋欄位 -->
      <div class="search-box">
        <input
            type="text"
            v-model="searchKeyword"
            @input="handleSearchInput"
            placeholder="搜尋商品..."
        >
        <button @click="handleSearch">
          <i class="fas fa-search"></i>
        </button>

        <!-- 搜尋建議下拉框 -->
        <div
            v-if="showSuggestions && searchSuggestions.length > 0"
            class="search-suggestions"
        >
          <ul>
            <li
                v-for="suggestion in searchSuggestions"
                :key="suggestion.id"
                @click="handleSuggestionClick(suggestion)"
            >
              {{ suggestion.name }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 價格範圍過濾 -->
      <div class="price-filter">
        <input
            type="number"
            v-model.number="minPrice"
            placeholder="最低價格"
            min="0"
        >
        <span>-</span>
        <input
            type="number"
            v-model.number="maxPrice"
            placeholder="最高價格"
            min="0"
        >
        <button
            @click="applyPriceFilter"
            :disabled="loading"
        >
          套用價格
        </button>
      </div>
    </div>

    <!-- 載入中提示 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>載入中...</p>
    </div>

    <!-- 商品列表區 -->
    <div v-else class="products-grid">
      <ProductCard
          v-for="product in displayProducts"
          :key="product.productId"
          :product="product"
          @add-to-cart="addToCart"
      />
    </div>

    <!-- 無商品提示 -->
    <div v-if="!loading && displayProducts.length === 0" class="no-products">
      <p>沒有找到符合條件的商品</p>
    </div>

    <!-- 分頁控制區 -->
    <div v-if="totalPages > 1" class="pagination">
      <button
          @click="previousPage"
          :disabled="currentPage === 1 || loading"
      >
        上一頁
      </button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button
          @click="nextPage"
          :disabled="currentPage === totalPages || loading"
      >
        下一頁
      </button>
    </div>
  </div>
</template>
<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import ProductCard from '@/components/product/ProductCard.vue'
import { debounce } from 'lodash'

export default {
  name: 'ProductList',
  components: { ProductCard },

  setup() {
    const store = useStore()
    const router = useRouter()

    // 響應式狀態
    const loading = ref(false)
    const products = ref([])
    const categories = ref([])
    const selectedCategory = ref('')
    const searchKeyword = ref('')
    const minPrice = ref('')
    const maxPrice = ref('')
    const currentPage = ref(1)
    const itemsPerPage = 12
    const searchSuggestions = ref([])
    const showSuggestions = ref(false)

    // 計算屬性
    const filteredProducts = computed(() => {
      let filtered = products.value

      if (selectedCategory.value) {
        filtered = filtered.filter(p => p.categoryId === selectedCategory.value)
      }

      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase()
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(keyword) ||
            p.description?.toLowerCase().includes(keyword) ||
            p.brand?.toLowerCase().includes(keyword)
        )
      }

      if (minPrice.value) {
        filtered = filtered.filter(p =>
            (p.promotionalPrice || p.price) >= minPrice.value
        )
      }

      if (maxPrice.value) {
        filtered = filtered.filter(p =>
            (p.promotionalPrice || p.price) <= maxPrice.value
        )
      }

      return filtered
    })

    const totalPages = computed(() =>
        Math.ceil(filteredProducts.value.length / itemsPerPage)
    )

    const displayProducts = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return filteredProducts.value.slice(start, end)
    })

    // 方法
    const handleSearchInput = debounce(async () => {
      if (searchKeyword.value.trim().length > 0) {
        try {
          const results = await store.dispatch('product/searchProducts', {
            keyword: searchKeyword.value.trim()
          })
          searchSuggestions.value = results.slice(0, 5)
          showSuggestions.value = true
        } catch (error) {
          console.error('搜尋建議獲取失敗:', error)
        }
      } else {
        searchSuggestions.value = []
        showSuggestions.value = false
      }
    }, 300)

    const handleSuggestionClick = (suggestion) => {
      searchKeyword.value = suggestion.name
      showSuggestions.value = false
      handleSearch()
    }

    const handleSearch = () => {
      currentPage.value = 1
      updateUrlParams()
    }

    const handleCategoryChange = () => {
      currentPage.value = 1
      updateUrlParams()
    }

    const applyPriceFilter = () => {
      if (maxPrice.value && minPrice.value > maxPrice.value) {
        store.dispatch('app/showNotification', {
          type: 'error',
          message: '最低價格不能大於最高價格'
        })
        return
      }
      currentPage.value = 1
      updateUrlParams()
    }
    // Methods
    const updateUrlParams = () => {
      const query = {}
      if (selectedCategory.value) query.category = selectedCategory.value
      if (searchKeyword.value) query.search = searchKeyword.value
      if (minPrice.value) query.minPrice = minPrice.value
      if (maxPrice.value) query.maxPrice = maxPrice.value
      if (currentPage.value > 1) query.page = currentPage.value
      router.replace({ query })
    }

    // 監聽路由變化
    watch(() => router.currentRoute.value.query, (query) => {
      selectedCategory.value = query.category || ''
      searchKeyword.value = query.search || ''
      minPrice.value = query.minPrice ? Number(query.minPrice) : ''
      maxPrice.value = query.maxPrice ? Number(query.maxPrice) : ''
      currentPage.value = query.page ? Number(query.page) : 1
    }, { immediate: true })

    // 生命週期
    onMounted(() => {
      fetchData()
    })

    return {
      loading,
      categories,
      selectedCategory,
      searchKeyword,
      minPrice,
      maxPrice,
      currentPage,
      totalPages,
      displayProducts,
      handleCategoryChange,
      debounceSearch,
      applyPriceFilter,
      addToCart,
      previousPage,
      nextPage
    }
  }
}
</script>

<style scoped>
.product-list {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.filter-section {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  align-items: center;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.category-filter select,
.search-box input,
.price-filter input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.price-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.price-filter input {
  width: 100px;
}

.price-filter button {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.price-filter button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.no-products {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  margin-top: 2rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.pagination button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .filter-section {
    flex-direction: column;
    gap: 1rem;
  }

  .price-filter {
    width: 100%;
  }

  .price-filter input {
    flex: 1;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}
</style>
