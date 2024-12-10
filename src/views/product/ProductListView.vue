<template>
  <div class="product-list-view">
    <!-- 頁面標題區 -->
    <div class="page-header">
      <h1>商品列表</h1>
      <div class="filter-controls">
        <BaseInput
            v-model="searchKeyword"
            placeholder="        搜尋商品..."
            prefix-icon="fas fa-search"
            @input="handleSearch"
        />
        <select v-model="selectedCategory" @change="handleCategoryChange">
          <option value="">全部分類</option>
          <option v-for="category in categories"
                  :key="category.categoryId"
                  :value="category.categoryId">
            {{ category.categoryName }}
          </option>
        </select>
      </div>
    </div>

    <!-- 商品列表區 -->
    <div class="products-container">
      <div v-if="loading" class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        載入中...
      </div>

      <div v-else-if="filteredProducts.length === 0" class="no-products">
        <i class="fas fa-box-open"></i>
        <p>沒有找到相關商品</p>
      </div>

      <div v-else class="products-grid">
        <ProductCard
            v-for="product in paginatedProducts"
            :key="product.productId"
            :product="product"
            @add-to-cart="addToCart"
        />
      </div>

      <!-- 分頁控制 -->
      <div class="pagination" v-if="totalPages > 1">
        <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
        >
          <i class="fas fa-chevron-left"></i>
        </button>

        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>

        <button
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import ProductCard from '@/components/product/ProductCard.vue'
import BaseInput from '@/components/common/BaseInput.vue'

export default {
  name: 'ProductListView',

  components: {
    ProductCard,
    BaseInput
  },

  setup() {
    const store = useStore()
    const loading = ref(true)
    const products = ref([])
    const categories = ref([])
    const searchKeyword = ref('')
    const selectedCategory = ref('')
    const currentPage = ref(1)
    const itemsPerPage = 12

    // 過濾商品
    const filteredProducts = computed(() => {
      let result = products.value

      if (selectedCategory.value) {
        result = result.filter(p => p.categoryId === selectedCategory.value)
      }

      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase()
        result = result.filter(p =>
            p.name.toLowerCase().includes(keyword) ||
            p.description.toLowerCase().includes(keyword)
        )
      }

      return result
    })

    // 分頁商品
    const paginatedProducts = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return filteredProducts.value.slice(start, end)
    })

    // 總頁數
    const totalPages = computed(() =>
        Math.ceil(filteredProducts.value.length / itemsPerPage)
    )

    // 方法
    const fetchProducts = async () => {
      try {
        const response = await store.dispatch('product/fetchProducts')
        products.value = response.data
      } catch (error) {
        console.error('獲取商品失敗:', error)
      } finally {
        loading.value = false
      }
    }

    const fetchCategories = async () => {
      try {
        const response = await store.dispatch('product/fetchCategories')
        categories.value = response.data
      } catch (error) {
        console.error('獲取分類失敗:', error)
      }
    }

    const handleSearch = () => {
      currentPage.value = 1
    }

    const handleCategoryChange = () => {
      currentPage.value = 1
    }

    const changePage = (page) => {
      currentPage.value = page
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

    onMounted(() => {
      fetchProducts()
      fetchCategories()
    })

    return {
      loading,
      products,
      categories,
      searchKeyword,
      selectedCategory,
      currentPage,
      filteredProducts,
      paginatedProducts,
      totalPages,
      handleSearch,
      handleCategoryChange,
      changePage,
      addToCart
    }
  }
}
</script>

<style scoped>
.product-list-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.filter-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.filter-controls select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  min-width: 150px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.loading-spinner,
.no-products {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.loading-spinner i,
.no-products i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 1.1rem;
  color: var(--primary-color);
}

@media (max-width: 768px) {
  .product-list-view {
    padding: 1rem;
  }

  .filter-controls {
    flex-direction: column;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
}
</style>
