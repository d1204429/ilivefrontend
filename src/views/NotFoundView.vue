<template>
  <div class="not-found">
    <div class="not-found-content">
      <h1>404</h1>
      <h2>找不到頁面</h2>
      <p>抱歉，您所尋找的頁面不存在或已被移除</p>

      <div class="actions">
        <router-link to="/" class="back-home">
          <i class="fas fa-home"></i>
          返回首頁
        </router-link>

        <button @click="goBack" class="go-back">
          <i class="fas fa-arrow-left"></i>
          返回上一頁
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFoundView',

  methods: {
    goBack() {
      this.$router.go(-1)
    }
  }
}
</script>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - var(--header-height));
  background-color: #f5f5f5;
  padding: 2rem;
}

.not-found-content {
  text-align: center;
  background: white;
  padding: 3rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 6rem;
  color: var(--primary-color);
  margin: 0;
  line-height: 1;
}

h2 {
  font-size: 2rem;
  color: #333;
  margin: 1rem 0;
}

p {
  color: #666;
  margin-bottom: 2rem;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.back-home,
.go-back {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.back-home {
  background-color: var(--primary-color);
  color: white;
}

.go-back {
  background-color: white;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}

.back-home:hover {
  background-color: var(--secondary-color);
}

.go-back:hover {
  background-color: #f5f5f5;
}

@media (max-width: 768px) {
  .actions {
    flex-direction: column;
  }

  .not-found-content {
    padding: 2rem;
  }

  h1 {
    font-size: 4rem;
  }

  h2 {
    font-size: 1.5rem;
  }
}
</style>
