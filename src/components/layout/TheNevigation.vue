<template>
  <nav class="navigation" :class="{ 'nav-scrolled': isScrolled }">
    <div class="nav-container">
      <!-- Logo區域 -->
      <router-link to="/" class="nav-brand">
        <img src="@/assets/logo.svg" alt="iLive Logo" class="nav-logo">
        <span class="brand-text">iLive 商城</span>
      </router-link>

      <!-- 漢堡選單按鈕 -->
      <button
          class="nav-toggle"
          :class="{ 'is-active': isMenuOpen }"
          @click="toggleMenu"
          v-show="isMobile"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <!-- 導航選單 -->
      <div class="nav-menu" :class="{ 'is-open': isMenuOpen }">
        <!-- 搜尋欄 -->
        <div class="nav-search">
          <input
              type="search"
              v-model="searchKeyword"
              placeholder="搜尋商品..."
              @keyup.enter="handleSearch"
          >
          <button @click="handleSearch">
            <i class="fas fa-search"></i>
          </button>
        </div>

        <!-- 主導航選單 -->
        <ul class="nav-links">
          <li>
            <router-link to="/products" :class="{ active: isCurrentRoute('products') }">
              商品列表
            </router-link>
          </li>
          <li class="nav-dropdown">
            <a href="#" @click.prevent="toggleCategoryMenu">
              商品分類
              <i class="fas fa-chevron-down"></i>
            </a>
            <ul class="dropdown-menu" v-show="isCategoryMenuOpen">
              <li v-for="category in categories" :key="category.id">
                <router-link :to="`/category/${category.id}`">
                  {{ category.name }}
                </router-link>
              </li>
            </ul>
          </li>
        </ul>

        <!-- 用戶操作區 -->
        <div class="nav-user">
          <router-link to="/cart" class="cart-icon">
            <i class="fas fa-shopping-cart"></i>
            <span class="cart-count" v-if="cartItemCount > 0">{{ cartItemCount }}</span>
          </router-link>

          <template v-if="isLoggedIn">
            <div class="user-dropdown">
              <button @click="toggleUserMenu">
                <i class="fas fa-user"></i>
                {{ userName }}
              </button>
              <ul class="dropdown-menu" v-show="isUserMenuOpen">
                <li>
                  <router-link to="/profile">個人資料</router-link>
                </li>
                <li>
                  <router-link to="/orders">訂單記錄</router-link>
                </li>
                <li>
                  <a href="#" @click.prevent="handleLogout">登出</a>
                </li>
              </ul>
            </div>
          </template>
          <template v-else>
            <router-link to="/login" class="nav-btn">登入</router-link>
            <router-link to="/register" class="nav-btn">註冊</router-link>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'

export default {
  name: 'TheNavigation',

  setup() {
    const router = useRouter()
    const route = useRoute()
    const store = useStore()

    // 響應式狀態
    const isScrolled = ref(false)
    const isMobile = ref(false)
    const isMenuOpen = ref(false)
    const isCategoryMenuOpen = ref(false)
    const isUserMenuOpen = ref(false)
    const searchKeyword = ref('')
    const categories = ref([])

    // 計算屬性
    const isLoggedIn = computed(() => store.state.auth.isLoggedIn)
    const userName = computed(() => store.state.auth.user?.username)
    const cartItemCount = computed(() => store.state.cart.items.length)

    // 方法
    const checkScreenSize = () => {
      isMobile.value = window.innerWidth < 768
      if (!isMobile.value) {
        isMenuOpen.value = false
      }
    }

    const handleScroll = () => {
      isScrolled.value = window.scrollY > 50
    }

    const toggleMenu = () => {
      isMenuOpen.value = !isMenuOpen.value
    }

    const toggleCategoryMenu = () => {
      isCategoryMenuOpen.value = !isCategoryMenuOpen.value
    }

    const toggleUserMenu = () => {
      isUserMenuOpen.value = !isUserMenuOpen.value
    }

    const handleSearch = () => {
      if (searchKeyword.value.trim()) {
        router.push({
          path: '/products',
          query: { keyword: searchKeyword.value }
        })
        isMenuOpen.value = false
      }
    }

    const handleLogout = async () => {
      try {
        await store.dispatch('auth/logout')
        router.push('/login')
      } catch (error) {
        console.error('登出失敗:', error)
      }
    }

    const isCurrentRoute = (routeName) => {
      return route.name === routeName
    }

    // 生命週期鉤子
    onMounted(() => {
      checkScreenSize()
      window.addEventListener('resize', checkScreenSize)
      window.addEventListener('scroll', handleScroll)

      // 獲取商品分類
      store.dispatch('fetchCategories')
          .then(response => {
            categories.value = response.data
          })
          .catch(error => {
            console.error('獲取分類失敗:', error)
          })
    })

    onUnmounted(() => {
      window.removeEventListener('resize', checkScreenSize)
      window.removeEventListener('scroll', handleScroll)
    })

    return {
      isScrolled,
      isMobile,
      isMenuOpen,
      isCategoryMenuOpen,
      isUserMenuOpen,
      searchKeyword,
      categories,
      isLoggedIn,
      userName,
      cartItemCount,
      toggleMenu,
      toggleCategoryMenu,
      toggleUserMenu,
      handleSearch,
      handleLogout,
      isCurrentRoute
    }
  }
}
</script>

<style scoped>
.navigation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #ffffff;
  z-index: 1000;
  transition: all 0.3s ease;
}

.nav-scrolled {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
}

.nav-brand {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--primary-color);
}

.nav-logo {
  height: 40px;
  margin-right: 0.5rem;
}

.brand-text {
  font-size: 1.5rem;
  font-weight: 600;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-search input {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  width: 200px;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-links a {
  text-decoration: none;
  color: var(--text-color);
  font-weight: 500;
}

.nav-links a.active {
  color: var(--primary-color);
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cart-icon {
  position: relative;
  color: var(--text-color);
  text-decoration: none;
}

.cart-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.75rem;
}

.nav-btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
}

.nav-btn:hover {
  background-color: var(--primary-color);
  color: white;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .nav-menu {
    position: fixed;
    top: 80px;
    left: 0;
    width: 100%;
    background-color: white;
    flex-direction: column;
    padding: 1rem;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .nav-menu.is-open {
    transform: translateX(0);
  }

  .nav-toggle {
    display: block;
  }

  .nav-links {
    flex-direction: column;
    width: 100%;
  }
}
</style>
