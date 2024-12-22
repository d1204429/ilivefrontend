<template>
  <header class="header">
    <div class="header-container">
      <!-- 漢堡選單按鈕 -->
      <div class="burger-menu" :class="{ 'active': isMenuOpen }" @click="toggleMenu">
        <span class="burger-bar"></span>
        <span class="burger-bar"></span>
        <span class="burger-bar"></span>
      </div>

      <!-- 側邊選單 -->
      <div class="side-menu" :class="{ 'active': isMenuOpen }">
        <nav class="menu-items">
          <router-link to="/" class="menu-item" @click="toggleMenu">首頁</router-link>
          <router-link to="/products" class="menu-item" @click="toggleMenu">商品列表</router-link>
          <div class="menu-item-dropdown">
            <div class="menu-item" @click="toggleCategory">
              分類
              <i :class="['fas', isCategoryOpen ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
            </div>
            <div class="dropdown-content" :class="{ 'show': isCategoryOpen }">
              <router-link
                  v-for="category in categories"
                  :key="category.id"
                  :to="`/category/${category.id}`"
                  class="dropdown-item"
                  @click="toggleMenu"
              >
                {{ category.name }}
              </router-link>
            </div>
          </div>
          <router-link to="/about" class="menu-item" @click="toggleMenu">關於我們</router-link>
          <router-link to="/contact" class="menu-item" @click="toggleMenu">聯絡我們</router-link>
        </nav>
      </div>

      <!-- 搜尋欄 -->
      <div class="search-box">
        <input
            type="search"
            v-model="searchKeyword"
            placeholder="搜尋"
            @keyup.enter="handleSearch"
        >
        <button @click="handleSearch">
          <i class="fas fa-search"></i>
        </button>
      </div>

      <!-- 用戶操作區 -->
      <nav class="user-nav">
        <template v-if="isLoggedIn">
          <div class="user-info">
            <router-link to="/profile" class="nav-link">
              <i class="fas fa-user"></i>
              <span class="username">{{ currentUser?.username }}</span>
            </router-link>
            <div class="user-dropdown">
              <router-link to="/profile" class="dropdown-item">個人資料</router-link>
              <router-link to="/orders" class="dropdown-item">訂單記錄</router-link>
              <a href="#" class="dropdown-item" @click.prevent="handleLogout">登出</a>
            </div>
          </div>
        </template>
        <template v-else>
          <router-link to="/login" class="nav-link">登入</router-link>
          <router-link to="/register" class="nav-link">註冊</router-link>
        </template>
        <router-link to="/cart" class="cart-link">
          <i class="fas fa-shopping-cart"></i>
          <span v-if="cartItemCount > 0" class="cart-count">{{ cartItemCount }}</span>
        </router-link>
      </nav>
    </div>
  </header>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'TheHeader',

  setup() {
    const store = useStore()
    const router = useRouter()

    // Reactive State
    const isMenuOpen = ref(false)
    const isCategoryOpen = ref(false)
    const searchKeyword = ref('')
    const categories = ref([])

    // Computed Properties
    const isLoggedIn = computed(() => store.getters['auth/isAuthenticated'])
    const currentUser = computed(() => store.getters['auth/currentUser'])
    const cartItemCount = computed(() => store.getters['cart/itemCount'])

    // Methods
    const fetchCategories = async () => {
      try {
        const response = await store.dispatch('product/getCategories')
        if (response) {
          categories.value = response
        }
      } catch (error) {
        store.dispatch('app/setError', {
          message: '獲取分類失敗，請重新整理頁面',
          type: 'error',
          duration: 3000
        })
      }
    }

    const initializeHeader = async () => {
      try {
        if (isLoggedIn.value) {
          await Promise.all([
            store.dispatch('cart/fetchCartItems'),
            store.dispatch('auth/getProfile'),
            fetchCategories()
          ])
        } else {
          await fetchCategories()
        }
      } catch (error) {
        console.error('初始化頁面失敗:', error)
      }
    }

    const handleLogout = async () => {
      try {
        await store.dispatch('auth/logout')
        router.push('/login')
        store.dispatch('app/setSuccess', {
          message: '已成功登出',
          duration: 2000
        })
      } catch (error) {
        store.dispatch('app/setError', {
          message: '登出失敗，請稍後再試',
          type: 'error',
          duration: 3000
        })
      }
    }

    const handleSearch = () => {
      const trimmedKeyword = searchKeyword.value.trim()
      if (trimmedKeyword) {
        router.push({
          path: '/products',
          query: { search: trimmedKeyword, page: 1 }
        })
        searchKeyword.value = ''
        if (isMenuOpen.value) {
          toggleMenu()
        }
      }
    }

    const toggleMenu = () => {
      isMenuOpen.value = !isMenuOpen.value
      if (!isMenuOpen.value) {
        isCategoryOpen.value = false
      }
      document.body.style.overflow = isMenuOpen.value ? 'hidden' : ''
    }

    const toggleCategory = () => {
      isCategoryOpen.value = !isCategoryOpen.value
    }

    const handleResize = () => {
      if (window.innerWidth > 768 && isMenuOpen.value) {
        isMenuOpen.value = false
        document.body.style.overflow = ''
      }
    }

    // Watchers
    watch(isLoggedIn, (newValue) => {
      if (newValue) {
        initializeHeader()
      } else {
        store.commit('cart/CLEAR_CART')
      }
    })

    watch(() => router.currentRoute.value.path, () => {
      if (isMenuOpen.value) {
        toggleMenu()
      }
    })

    // Lifecycle Hooks
    onMounted(() => {
      initializeHeader()
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      document.body.style.overflow = ''
    })

    return {
      isMenuOpen,
      isCategoryOpen,
      searchKeyword,
      categories,
      isLoggedIn,
      currentUser,
      cartItemCount,
      toggleMenu,
      toggleCategory,
      handleSearch,
      handleLogout
    }
  }
}
</script>


<style scoped>
.header {
  background: #fff;
  border-bottom: 1px solid #eee;
  padding: 0.5rem 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

/* 漢堡選單樣式 */
.burger-menu {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 30px;
  height: 20px;
  cursor: pointer;
  z-index: 1001;
}

.burger-bar {
  width: 100%;
  height: 2px;
  background-color: #333;
  transition: all 0.3s ease-in-out;
}

.burger-menu.active .burger-bar:nth-child(1) {
  transform: translateY(9px) rotate(45deg);
}

.burger-menu.active .burger-bar:nth-child(2) {
  opacity: 0;
}

.burger-menu.active .burger-bar:nth-child(3) {
  transform: translateY(-9px) rotate(-45deg);
}

/* 側邊選單樣式 */
.side-menu {
  position: fixed;
  top: 60px;
  left: -250px;
  width: 250px;
  height: calc(100vh - 60px);
  background-color: #fff;
  transition: left 0.3s ease-in-out;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow-y: auto;
}

.side-menu.active {
  left: 0;
}

.menu-items {
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.menu-item {
  padding: 1rem;
  color: #333;
  text-decoration: none;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

/* 下拉選單樣式 */
.menu-item-dropdown {
  position: relative;
}

.dropdown-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
  background-color: #f9f9f9;
}

.dropdown-content.show {
  max-height: 500px;
}

.dropdown-item {
  padding: 0.8rem 1rem 0.8rem 2rem;
  color: #333;
  text-decoration: none;
  display: block;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
}

.dropdown-item:hover {
  background-color: #f0f0f0;
}

.search-box {
  flex: 1;
  max-width: 600px;
  margin: 0 2rem;
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.search-box button {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
}

.user-nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  color: #333;
  text-decoration: none;
  font-size: 0.9rem;
}

.nav-link:hover {
  color: #007bff;
}

.cart-link {
  position: relative;
  color: #333;
  text-decoration: none;
}

.cart-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #007bff;
  color: white;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 10px;
}

@media (max-width: 768px) {
  .header-container {
    flex-wrap: wrap;
    height: auto;
    gap: 1rem;
  }

  .search-box {
    order: 2;
    margin: 0;
    width: 100%;
  }

  .user-nav {
    order: 1;
  }
}


.user-info {
  position: relative;
}

.user-info:hover .user-dropdown {
  display: block;
}

.username {
  margin-left: 0.5rem;
  font-weight: 500;
}

.user-dropdown {
  display: none;
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #eee;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 0.5rem 0;
  min-width: 150px;
  z-index: 1000;
}

.user-dropdown .dropdown-item {
  display: block;
  padding: 0.5rem 1rem;
  color: #333;
  text-decoration: none;
  font-size: 0.9rem;
}

.user-dropdown .dropdown-item:hover {
  background-color: #f5f5f5;
}
.user-info {
  position: relative;
}

.user-info:hover .user-dropdown {
  display: block;
}

.username {
  margin-left: 0.5rem;
  font-weight: 500;
}

.user-dropdown {
  display: none;
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #eee;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 0.5rem 0;
  min-width: 150px;
  z-index: 1000;
}

.user-dropdown .dropdown-item {
  display: block;
  padding: 0.5rem 1rem;
  color: #333;
  text-decoration: none;
  font-size: 0.9rem;
}

.user-dropdown .dropdown-item:hover {
  background-color: #f5f5f5;
}

</style>
