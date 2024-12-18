<template>
  <div class="error-view">
    <div class="error-container">
      <h1 class="error-code">{{ code }}</h1>
      <div class="error-message">{{ message }}</div>
      <router-link to="/" class="back-home">
        返回首頁
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ErrorView',
  props: {
    code: {
      type: Number,
      default: 404
    },
    message: {
      type: String,
      default: '頁面不存在'
    }
  }
}
</script>

<style scoped>
.error-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
  padding: 1rem;
}

.error-container {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.error-code {
  font-size: 6rem;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
}

.error-message {
  font-size: 1.5rem;
  color: #666;
  margin: 1rem 0 2rem;
}

.back-home {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #4299e1;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.back-home:hover {
  background-color: #3182ce;
}
</style>
