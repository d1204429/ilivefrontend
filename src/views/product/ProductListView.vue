<template>
  <div class="product-list-view">
    <!-- 頁面標題區 -->
    <div class="page-header">
      <div class="header-content">
        <button class="back-btn" @click="goBack">
          <i class="fas fa-arrow-left"></i> 返回
        </button>
        <h1>商品列表</h1>
      </div>
      <div class="filter-controls">
        <BaseInput
            v-model="filters.keyword"
            placeholder="搜尋商品..."
            prefix-icon="fas fa-search"
            @input="handleSearch"
        />
        <select v-model="filters.categoryId" @change="handleCategoryChange">
          <option value="">全部分類</option>
          <option
              v-for="category in categories"
              :key="category.categoryId"
              :value="category.categoryId"
          >
            {{ category.name }}
          </option>
        </select>
        <select v-model="filters.sortBy" @change="handleSort">
          <option value="">排序方式</option>
          <option value="price-asc">價格由低到高</option>
          <option value="price-desc">價格由高到低</option>
          <option value="newest">最新上架</option>
        </select>
      </div>
    </div>

    <!-- 商品列表區 -->
    <div class="products-container">
      <BaseLoading v-if="loading"/>

      <div v-else-if="!products.length" class="no-products">
        <i class="fas fa-box-open"></i>
        <p>{{ noProductsMessage }}</p>
      </div>

      <div v-else class="products-grid">
        <ProductCard
            v-for="product in products"
            :key="product.productId"
            :product="transformProductData(product)"
            @add-to-cart="handleAddToCart"
            @view-detail="handleViewDetail"
        />
      </div>

      <!-- 分頁控制 -->
      <div class="pagination" v-if="pagination.totalPages > 1">
        <button
            class="page-btn"
            :disabled="pagination.currentPage === 1"
            @click="handlePageChange(pagination.currentPage - 1)"
        >
          <i class="fas fa-chevron-left"></i>
        </button>

        <span class="page-info">
          {{ pagination.currentPage }} / {{ pagination.totalPages }}
        </span>

        <button
            class="page-btn"
            :disabled="pagination.currentPage === pagination.totalPages"
            @click="handlePageChange(pagination.currentPage + 1)"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- 錯誤提示 -->
    <BaseAlert
        v-if="error"
        :message="error"
        type="error"
        @close="error = null"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import ProductCard from '@/components/product/ProductCard.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { debounce } from '@/utils/helpers'
import { handleError } from '@/utils/errorHandler'

export default {
  name: 'ProductListView',

  components: {
    ProductCard,
    BaseInput,
    BaseLoading,
    BaseAlert
  },

  setup() {
    const store = useStore()
    const router = useRouter()

    // 狀態
    const loading = ref(false)
    const error = ref(null)
    const products = ref([])
    const categories = ref([])

    // 過濾和分頁
    const filters = reactive({
      keyword: '',
      categoryId: '',
      sortBy: '',
      minPrice: null,
      maxPrice: null
    })

    const pagination = reactive({
      currentPage: 1,
      pageSize: 12,
      totalPages: 1,
      total: 0
    })
    // 計算屬性
    const noProductsMessage = computed(() => {
      if (filters.keyword) {
        return `沒有找到與 "${filters.keyword}" 相關的商品`
      }
      return '暫無商品'
    })

    // 方法
    const transformProductData = (product) => {
      return {
        ...product,
        imageUrl: product.imageUrl?.split('/').pop(),
        price: product.promotionalPrice || product.price,
        originalPrice: product.originalPrice,
        stock: product.availableStock
      }
    }

    const fetchData = async () => {
      loading.value = true
      error.value = null

      try {
        const params = {
          page: pagination.currentPage,
          limit: pagination.pageSize,
          ...filters
        }

        const response = await store.dispatch('product/fetchProducts', params)
        products.value = response.items.map(transformProductData)
        pagination.total = response.total
        pagination.totalPages = response.totalPages
      } catch (err) {
        const errorMessage = handleError(err)
        store.dispatch('app/showNotification', {
          type: 'error',
          message: errorMessage || '載入商品失敗'
        })
        error.value = errorMessage
      } finally {
        loading.value = false
      }
    }

    const fetchCategories = async () => {
      try {
        const response = await store.dispatch('product/fetchCategories')
        categories.value = response
      } catch (err) {
        const errorMessage = handleError(err)
        store.dispatch('app/showNotification', {
          type: 'error',
          message: errorMessage || '載入分類失敗'
        })
      }
    }

    const handleSearch = debounce(() => {
      pagination.currentPage = 1
      fetchData()
    }, 500)

    const handleCategoryChange = () => {
      pagination.currentPage = 1
      fetchData()
    }

    const handleSort = () => {
      fetchData()
    }

    const handlePageChange = (page) => {
      pagination.currentPage = page
      fetchData()
    }

    const handleAddToCart = async (product) => {
      try {
        await store.dispatch('cart/addToCart', {
          productId: product.productId,
          quantity: 1
        })
        store.dispatch('app/showNotification', {
          type: 'success',
          message: '已加入購物車'
        })
      } catch (err) {
        const errorMessage = handleError(err)
        store.dispatch('app/showNotification', {
          type: 'error',
          message: errorMessage || '加入購物車失敗'
        })
      }
    }

    const handleViewDetail = (productId) => {
      router.push(`/products/${productId}`)
    }

    const goBack = () => {
      router.back()
    }

    // 生命週期
    onMounted(() => {
      fetchData()
      fetchCategories()
    })

    return {
      // 狀態
      loading,
      error,
      products,
      categories,
      filters,
      pagination,
      noProductsMessage,

      // 方法
      handleSearch,
      handleCategoryChange,
      handleSort,
      handlePageChange,
      handleAddToCart,
      handleViewDetail,
      goBack
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

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 1rem;
}

.back-btn:hover {
  color: var(--primary-color-dark);
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.filter-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-controls select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  min-width: 150px;
  background-color: white;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.no-products {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.no-products i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--text-muted);
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
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 1.1rem;
  color: var(--text-primary);
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
