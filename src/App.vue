<template>
  <div id="app" :class="{ 'mobile': isMobile }">
    <TheHeader />

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <TheFooter />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
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
    const isMobile = ref(false)

    const handleResize = () => {
      isMobile.value = window.innerWidth <= 768
    }

    const handleRouteChange = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }

    onMounted(() => {
      handleResize()
      window.addEventListener('resize', handleResize)
      router.afterEach(handleRouteChange)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      router.afterEach(null)
    })

    return {
      isMobile,
      handleRouteChange
    }
  }
}
</script>

<style>
:root {
  --primary-color: #00539f;
  --secondary-color: #ff9500;
  --text-color: #333333;
  --border-color: #dee2e6;
  --header-height: 60px;
  --footer-height: 60px;
  --content-max-width: 1200px;
  --content-padding: 20px;
  --mobile-footer-height: 50px;
}
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  padding-bottom: var(--footer-height);
}

.main-content {
  flex: 1 0 auto;
  padding: var(--content-padding);
  max-width: var(--content-max-width);
  margin: var(--header-height) auto 0;
  width: 100%;
  background-color: #f5f5f5;
}

body {
  font-family: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI',
  Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.5;
  color: var(--text-color);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 16px;
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

footer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: var(--footer-height);
  background-color: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Tablet Styles */
@media (max-width: 1024px) {
  :root {
    --header-height: 50px;
    --content-padding: 16px;
  }

  body {
    font-size: 15px;
  }

  #app {
    padding-bottom: var(--footer-height);
  }
}

/* Mobile Styles */
@media (max-width: 768px) {
  :root {
    --header-height: 40px;
    --footer-height: var(--mobile-footer-height);
    --content-padding: 12px;
  }

  body {
    font-size: 14px;
  }

  .main-content {
    margin-top: var(--header-height);
    padding: var(--content-padding);
  }

  #app.mobile {
    padding-bottom: var(--mobile-footer-height);
  }
}

/* Small Mobile Styles */
@media (max-width: 480px) {
  :root {
    --content-padding: 8px;
  }

  body {
    font-size: 13px;
  }
}
</style>
