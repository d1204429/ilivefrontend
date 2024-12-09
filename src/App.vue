<template>
  <div id="app">
    <!-- 導航欄 -->
    <TheHeader />

    <!-- 主要內容區 -->
    <main class="main-content">
      <router-view></router-view>
    </main>

    <!-- 頁尾 -->
    <TheFooter />
  </div>
</template>

<script>
import TheHeader from '@/components/layout/TheHeader.vue'
import TheFooter from '@/components/layout/TheFooter.vue'

export default {
  name: 'App',

  components: {
    TheHeader,
    TheFooter
  },

  setup() {
    // 監聽路由變化，處理頁面捲動
    const handleRouteChange = () => {
      window.scrollTo(0, 0)
    }

    return {
      handleRouteChange
    }
  }
}
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: var(--header-height);
  background-color: #f5f5f5;
}

/* 全局基礎樣式 */
:root {
  --primary-color: #00539f;
  --secondary-color: #ff9500;
  --text-color: #333333;
  --border-color: #dee2e6;
  --header-height: 80px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.5;
  color: var(--text-color);
}

a {
  text-decoration: none;
  color: inherit;
}

img {
  max-width: 100%;
  height: auto;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .main-content {
    padding-top: 60px;
  }
}
</style>
