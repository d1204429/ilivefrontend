<template>
  <div class="category-sidebar">
    <div class="category-header">
      <h3>商品分類</h3>
      <button
          v-if="isMobile"
          class="close-btn"
          @click="$emit('close')"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="search-box">
      <BaseInput
          v-model="searchQuery"
          placeholder="搜尋分類..."
          prefix-icon="fas fa-search"
      />
    </div>

    <div class="category-list" v-if="!loading">
      <template v-if="filteredCategories.length">
        <div
            v-for="category in filteredCategories"
            :key="category.categoryId"
            class="category-item"
            :class="{
            'active': selectedCategoryId === category.categoryId,
            'has-children': category.subCategories?.length
          }"
        >
          <div
              class="category-main"
              @click="handleCategoryClick(category)"
          >
            <span class="category-name">{{ category.categoryName }}</span>
            <span
                v-if="category.subCategories?.length"
                class="toggle-btn"
                @click.stop="toggleSubcategories(category.categoryId)"
            >
              <i :class="expandedCategories.includes(category.categoryId) ?
                'fas fa-chevron-down' : 'fas fa-chevron-right'">
              </i>
            </span>
          </div>

          <div
              v-if="category.subCategories?.length"
              class="subcategories"
              :class="{ 'expanded': expandedCategories.includes(category.categoryId) }"
          >
            <div
                v-for="subCategory in category.subCategories"
                :key="subCategory.categoryId"
                class="category-item sub-item"
                :class="{ 'active': selectedCategoryId === subCategory.categoryId }"
                @click="handleCategoryClick(subCategory)"
            >
              {{ subCategory.categoryName }}
            </div>
          </div>
        </div>
      </template>

      <div v-else class="no-results">
        <i class="fas fa-folder-open"></i>
        <p>沒有找到相關分類</p>
      </div>
    </div>

    <BaseLoading v-else />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'

export default {
  name: 'CategorySidebar',

  components: {
    BaseInput,
    BaseLoading
  },

  props: {
    selectedCategoryId: {
      type: Number,
      default: null
    },
    isMobile: {
      type: Boolean,
      default: false
    }
  },

  emits: ['select-category', 'close'],

  setup(props, { emit }) {
    const store = useStore()
    const loading = ref(true)
    const searchQuery = ref('')
    const expandedCategories = ref([])

    // 從 store 獲取分類列表
    const categories = computed(() => store.getters['product/getCategories'])

    // 過濾分類
    const filteredCategories = computed(() => {
      if (!searchQuery.value) return categories.value

      const query = searchQuery.value.toLowerCase()
      return categories.value.filter(category => {
        const matchMainCategory = category.categoryName.toLowerCase().includes(query)
        const matchSubCategories = category.subCategories?.some(sub =>
            sub.categoryName.toLowerCase().includes(query)
        )
        return matchMainCategory || matchSubCategories
      })
    })

    // 處理分類點擊
    const handleCategoryClick = (category) => {
      emit('select-category', category)
      if (props.isMobile) {
        emit('close')
      }
    }

    // 展開/收起子分類
    const toggleSubcategories = (categoryId) => {
      const index = expandedCategories.value.indexOf(categoryId)
      if (index === -1) {
        expandedCategories.value.push(categoryId)
      } else {
        expandedCategories.value.splice(index, 1)
      }
    }

    // 初始化
    onMounted(async () => {
      try {
        await store.dispatch('product/fetchCategories')
      } catch (error) {
        console.error('獲取分類失敗:', error)
      } finally {
        loading.value = false
      }
    })

    return {
      loading,
      searchQuery,
      categories,
      filteredCategories,
      expandedCategories,
      handleCategoryClick,
      toggleSubcategories
    }
  }
}
</script>

<style scoped>
.category-sidebar {
  width: 100%;
  background: var(--bg-white);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1rem;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.category-header h3 {
  font-size: 1.2rem;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
}

.search-box {
  margin-bottom: 1rem;
}

.category-list {
  max-height: calc(100vh - 250px);
  overflow-y: auto;
}

.category-item {
  margin-bottom: 0.5rem;
}

.category-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-main:hover {
  background: var(--bg-light);
}

.category-item.active > .category-main {
  background: var(--primary-color);
  color: white;
}

.toggle-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.subcategories {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
  padding-left: 1rem;
}

.subcategories.expanded {
  max-height: 500px;
}

.sub-item {
  padding: 0.5rem;
  margin-left: 1rem;
  border-left: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
}

.sub-item:hover {
  background: var(--bg-light);
}

.sub-item.active {
  color: var(--primary-color);
  border-left-color: var(--primary-color);
  background: var(--bg-light);
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.no-results i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .category-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 80%;
    max-width: 300px;
    z-index: 1000;
    border-radius: 0;
  }
}
</style>
