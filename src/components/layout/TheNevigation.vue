<template>
  <nav class="navigation">
    <div class="nav-container">
      <!-- 漢堡選單按鈕 -->
      <button
          class="nav-toggle"
          :class="{ 'is-active': isMenuOpen }"
          @click="toggleMenu"
          v-show="isMobile"
      >
        <i class="fas fa-bars"></i>
      </button>

      <!-- 搜尋欄 -->
      <div class="nav-search">
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
      <div class="nav-user">
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
        <router-link to="/cart" class="cart-icon">
          <i class="fas fa-shopping-cart"></i>
          <span class="cart-count" v-if="cartItemCount > 0">{{ cartItemCount }}</span>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navigation {
  background-color: #ffffff;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #eee;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
}

.nav-search {
  flex: 1;
  max-width: 600px;
  margin: 0 2rem;
  position: relative;
}

.nav-search input {
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.nav-search button {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
}

.nav-user {
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

.cart-icon {
  color: #333;
  text-decoration: none;
  position: relative;
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

@media (max-width: 768px) {
  .nav-container {
    height: auto;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .nav-search {
    order: 2;
    margin: 0;
    width: 100%;
  }

  .nav-user {
    order: 1;
  }
}
</style>
