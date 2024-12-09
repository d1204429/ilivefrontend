<template>
  <CHeader class="header">
    <CContainer fluid>
      <!-- Logo區域 -->
      <CHeaderBrand href="/" class="header-brand">
        <img src="@/assets/logo.svg" alt="iLive Logo" class="header-logo">
        <span class="brand-text">iLive 商城</span>
      </CHeaderBrand>

      <!-- 導航切換按鈕 -->
      <CHeaderToggler
          class="header-toggler"
          @click="toggleNavbar"
      />

      <!-- 導航區域 -->
      <CCollapse class="header-collapse" :visible="isNavVisible">
        <!-- 主導航 -->
        <CHeaderNav class="header-nav">
          <CNavItem>
            <CNavLink href="/" :active="currentPath === '/'">
              首頁
            </CNavLink>
          </CNavItem>

          <CNavItem>
            <CNavLink href="/products" :active="currentPath === '/products'">
              商品列表
            </CNavLink>
          </CNavItem>

          <!-- 商品分類下拉選單 -->
          <CDropdown variant="nav-item" :popper="false">
            <CDropdownToggle>商品分類</CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem
                  v-for="category in categories"
                  :key="category.id"
                  :href="`/category/${category.id}`"
              >
                {{ category.name }}
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
        </CHeaderNav>

        <!-- 搜尋欄位 -->
        <div class="search-box">
          <CFormInput
              type="search"
              placeholder="搜尋商品..."
              v-model="searchKeyword"
              @keyup.enter="handleSearch"
          />
          <CButton color="primary" @click="handleSearch">
            <i class="fas fa-search"></i>
          </CButton>
        </div>

        <!-- 用戶操作區 -->
        <div class="user-actions">
          <!-- 購物車 -->
          <CNavLink href="/cart" class="cart-link">
            <i class="fas fa-shopping-cart"></i>
            <CBadge color="danger" v-if="cartItemCount > 0">
              {{ cartItemCount }}
            </CBadge>
          </CNavLink>

          <!-- 用戶選單 -->
          <CDropdown v-if="isLoggedIn" variant="nav-item">
            <CDropdownToggle>
              <i class="fas fa-user"></i>
              {{ userName }}
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem href="/profile">個人資料</CDropdownItem>
              <CDropdownItem href="/orders">訂單記錄</CDropdownItem>
              <CDropdownDivider />
              <CDropdownItem @click="handleLogout">登出</CDropdownItem>
            </CDropdownMenu>
          </CDropdown>

          <!-- 未登入狀態 -->
          <template v-else>
            <CNavLink href="/login" class="auth-link">登入</CNavLink>
            <CNavLink href="/register" class="auth-link">註冊</CNavLink>
          </template>
        </div>
      </CCollapse>
    </CContainer>
  </CHeader>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'

export default {
  name: 'TheHeader',

  setup() {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()

    // 響應式狀態
    const isNavVisible = ref(false)
    const searchKeyword = ref('')
    const categories = ref([])

    // 計算屬性
    const currentPath = computed(() => route.path)
    const isLoggedIn = computed(() => store.state.auth.isLoggedIn)
    const userName = computed(() => store.state.auth.user?.username)
    const cartItemCount = computed(() => store.state.cart.items.length)

    // 方法
    const toggleNavbar = () => {
      isNavVisible.value = !isNavVisible.value
    }

    const handleSearch = () => {
      if (searchKeyword.value.trim()) {
        router.push({
          path: '/products',
          query: { keyword: searchKeyword.value }
        })
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

    // 生命週期鉤子
    onMounted(async () => {
      try {
        const response = await store.dispatch('fetchCategories')
        categories.value = response.data
      } catch (error) {
        console.error('獲取分類失敗:', error)
      }
    })

    return {
      isNavVisible,
      searchKeyword,
      categories,
      currentPath,
      isLoggedIn,
      userName,
      cartItemCount,
      toggleNavbar,
      handleSearch,
      handleLogout
    }
  }
}
</script>

<style scoped>
.header {
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-logo {
  height: 40px;
  width: auto;
}

.brand-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-color);
}

.header-nav {
  margin-left: 2rem;
}

.search-box {
  display: flex;
  gap: 0.5rem;
  max-width: 400px;
  margin: 0 1rem;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cart-link {
  position: relative;
}

.auth-link {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.auth-link:hover {
  background-color: var(--light-gray);
}

/* RWD 響應式設計 */
@media (max-width: 768px) {
  .header-collapse {
    flex-direction: column;
  }

  .search-box {
    width: 100%;
    margin: 1rem 0;
  }

  .user-actions {
    width: 100%;
    justify-content: center;
    padding: 1rem 0;
    border-top: 1px solid var(--border-color);
  }
}
</style>
