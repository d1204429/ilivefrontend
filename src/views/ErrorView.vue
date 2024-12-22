<template>
  <div class="error-view">
    <div class="error-container">
      <div class="error-icon">
        <i :class="errorIcon"></i>
      </div>
      <h1 class="error-code">{{ code }}</h1>
      <div class="error-message">{{ message }}</div>
      <div class="error-actions">
        <router-link to="/" class="back-home">
          <i class="fas fa-home"></i> 返回首頁
        </router-link>
        <button @click="goBack" class="go-back">
          <i class="fas fa-arrow-left"></i> 返回上一頁
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ErrorView',
  props: {
    code: {
      type: Number,
      default: 404,
      validator: value => [400, 401, 403, 404, 500, 502, 503].includes(value)
    },
    message: {
      type: String,
      default: '頁面不存在'
    }
  },
  computed: {
    errorIcon() {
      const icons = {
        400: 'fas fa-exclamation-circle',
        401: 'fas fa-lock',
        403: 'fas fa-ban',
        404: 'fas fa-search',
        500: 'fas fa-bug',
        502: 'fas fa-server',
        503: 'fas fa-tools'
      }
      return icons[this.code] || 'fas fa-exclamation-triangle'
    }
  },
  methods: {
    goBack() {
      if (window.history.length > 1) {
        this.$router.go(-1)
      } else {
        this.$router.push('/')
      }
    }
  },
  mounted() {
    document.title = `${this.code} - ${this.message}`
  }
}
</script>

<style scoped>
.error-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 64px);
  background-color: var(--color-background, #f8f9fa);
  padding: 1rem;
}

.error-container {
  text-align: center;
  padding: 3rem;
  background: var(--color-background-soft, white);
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 480px;
  width: 100%;
}

.error-icon {
  font-size: 4rem;
  color: var(--color-primary, #4299e1);
  margin-bottom: 1.5rem;
  animation: bounce 2s infinite;
}

.error-code {
  font-size: 4.5rem;
  font-weight: 700;
  color: var(--color-heading, #2c3e50);
  margin: 0;
  line-height: 1.2;
}

.error-message {
  font-size: 1.25rem;
  color: var(--color-text, #666);
  margin: 1.5rem 0 2rem;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.back-home,
.go-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
}

.back-home {
  background-color: var(--color-primary, #4299e1);
  color: white;
}

.back-home:hover {
  background-color: var(--color-primary-dark, #3182ce);
  transform: translateY(-1px);
}

.go-back {
  background-color: var(--color-background-mute, #e2e8f0);
  color: var(--color-text, #4a5568);
}

.go-back:hover {
  background-color: var(--color-background-soft, #cbd5e0);
  transform: translateY(-1px);
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@media (max-width: 640px) {
  .error-container {
    padding: 2rem;
  }

  .error-code {
    font-size: 3.5rem;
  }

  .error-message {
    font-size: 1.125rem;
  }

  .error-actions {
    flex-direction: column;
  }

  .back-home,
  .go-back {
    width: 100%;
    justify-content: center;
  }
}
</style>
