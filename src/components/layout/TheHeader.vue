<template>
  <header class="header">
    <div class="header-container">
      <!-- 漢堡選單按鈕 -->
      <div class="burger-menu"
           :class="{ 'active': isMenuOpen }"
           @click="toggleMenu">
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
              <router-link to="/category/1" class="dropdown-item" @click="toggleMenu">生活家電</router-link>
              <router-link to="/category/2" class="dropdown-item" @click="toggleMenu">視聽娛樂</router-link>
              <router-link to="/category/3" class="dropdown-item" @click="toggleMenu">冰箱</router-link>
              <router-link to="/category/4" class="dropdown-item" @click="toggleMenu">洗衣機/乾衣機</router-link>
              <router-link to="/category/5" class="dropdown-item" @click="toggleMenu">烤箱/微波爐/電鍋</router-link>
              <router-link to="/category/6" class="dropdown-item" @click="toggleMenu">季節家電</router-link>
              <router-link to="/category/7" class="dropdown-item" @click="toggleMenu">吸塵器</router-link>
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
            placeholder="Search"
            @keyup.enter="handleSearch"
        >
        <button @click="handleSearch">
          <i class="fas fa-search"></i>
        </button>
      </div>

      <!-- 用戶操作區 -->
      <nav class="user-nav">
        <template v-if="isLoggedIn">
          <router-link to="/profile" class="nav-link">
            <i class="fas fa-user"></i>
          </router-link>
          <router-link to="/orders" class="nav-link">訂單</router-link>
        </template>
        <template v-else>
          <router-link to="/login" class="nav-link">登入</router-link>
          <router-link to="/register" class="nav-link">註冊</router-link>
        </template>
        <router-link to="/cart" class="cart-link">
          <i class="fas fa-shopping-cart"></i>
          <span v-if="cartItemCount > 0" class="cart-count">
            {{ cartItemCount }}
          </span>
        </router-link>
      </nav>
    </div>
  </header>
</template>

<script>
export default {
  name: 'Header',
  data() {
    return {
      isMenuOpen: false,
      isCategoryOpen: false,
      searchKeyword: '',
      cartItemCount: 0
    }
  },
  computed: {
    isLoggedIn() {
      return !!localStorage.getItem('token')
    }
  },
  methods: {
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
      if (!this.isMenuOpen) {
        this.isCategoryOpen = false;
      }
      document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
    },
    toggleCategory() {
      this.isCategoryOpen = !this.isCategoryOpen;
    },
    handleSearch() {
      if (this.searchKeyword.trim()) {
        this.$router.push({
          path: '/products',
          query: { search: this.searchKeyword.trim() }
        });
        this.searchKeyword = '';
      }
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
</style>
