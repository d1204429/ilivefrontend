<template>
  <header class="header">
    <div class="header-container">
      <!-- 漢堡選單按鈕 -->
      <button
          class="menu-toggle"
          @click="toggleMenu"
          v-show="isMobile"
      >
        <i class="fas fa-bars"></i>
      </button>

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
        </template>
        <template v-else>
          <router-link to="/login" class="nav-link">登入</router-link>
          <router-link to="/register" class="nav-link">註冊</router-link>
        </template>
        <router-link to="/orders" class="nav-link">訂單</router-link>
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
  height: 40px;
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
  color: var(--primary-color);
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
  background: var(--primary-color);
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
