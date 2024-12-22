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
      const previousPath = localStorage.getItem('previousPath')
      if (previousPath) {
        this.$router.push(previousPath)
      } else {
        this.$router.go(-1)
      }
    }
  },

  beforeDestroy() {
    localStorage.removeItem('previousPath')
  }
}
</script>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - var(--header-height));
  background-color: var(--bg-color, #f5f5f5);
  padding: 2rem;
}

.not-found-content {
  text-align: center;
  background: var(--white, white);
  padding: 3rem;
  border-radius: var(--border-radius, 8px);
  box-shadow: var(--box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
  max-width: 600px;
  width: 100%;
}

h1 {
  font-size: 6rem;
  color: var(--primary-color);
  margin: 0;
  line-height: 1;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

h2 {
  font-size: 2rem;
  color: var(--text-color, #333);
  margin: 1rem 0;
  font-weight: 600;
}

p {
  color: var(--text-secondary, #666);
  margin-bottom: 2rem;
  font-size: 1.1rem;
  line-height: 1.5;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
}

.back-home,
.go-back {
  padding: 0.875rem 1.75rem;
  border-radius: var(--button-radius, 4px);
  text-decoration: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  cursor: pointer;
  font-size: 1rem;
  border: none;
  outline: none;
}

.back-home {
  background-color: var(--primary-color);
  color: var(--white, white);
}

.go-back {
  background-color: var(--white, white);
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
}

.back-home:hover {
  background-color: var(--primary-dark, var(--secondary-color));
  transform: translateY(-2px);
}

.go-back:hover {
  background-color: var(--bg-hover, #f5f5f5);
  transform: translateY(-2px);
}

.back-home:active,
.go-back:active {
  transform: translateY(0);
}

i {
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .not-found {
    padding: 1rem;
  }

  .not-found-content {
    padding: 2rem 1.5rem;
  }

  h1 {
    font-size: 4rem;
  }

  h2 {
    font-size: 1.5rem;
  }

  p {
    font-size: 1rem;
  }

  .actions {
    flex-direction: column;
    gap: 1rem;
  }

  .back-home,
  .go-back {
    width: 100%;
    justify-content: center;
    padding: 0.75rem 1rem;
  }
}

@media (max-width: 480px) {
  h1 {
    font-size: 3rem;
  }

  h2 {
    font-size: 1.25rem;
  }
}
</style>
