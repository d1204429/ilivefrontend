<template>
  <div id="app">
    <!-- 導航欄 -->
    <TheHeader />

    <!-- 主要內容區 -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 頁尾 -->
    <TheFooter />
  </div>
</template>

<script>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import TheHeader from '@/components/layout/TheHeader.vue'
import TheFooter from '@/components/layout/TheFooter.vue'

export default {
  name: 'App',

  components: {
    TheHeader,
    TheFooter
  },

  setup() {
    const router = useRouter()

    const handleRouteChange = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }

    onMounted(() => {
      router.afterEach(handleRouteChange)
    })

    onUnmounted(() => {
      router.afterEach(null)
    })

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
  margin-top: 40px;
}

:root {
  --primary-color: #00539f;
  --secondary-color: #ff9500;
  --text-color: #333333;
  --border-color: #dee2e6;
  --header-height: 40px;
  --footer-height: 60px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.5;
  color: var(--text-color);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  text-decoration: none;
  color: inherit;
  transition: color 0.3s ease;
}

a:hover {
  color: var(--primary-color);
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .main-content {
    padding-top: 40px;
    margin-top: 0;
  }

  :root {
    --header-height: 40px;
  }
}
</style>
