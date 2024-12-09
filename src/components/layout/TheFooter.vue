<template>
  <footer class="footer">
    <div class="footer-container">
      <!-- 頁尾連結區 -->
      <div class="footer-links">
        <router-link to="/about">關於我們</router-link>
        <router-link to="/contact">聯絡我們</router-link>
      </div>

      <!-- 版權宣告 -->
      <div class="copyright">
        <p>Copyright © {{ currentYear }} FCU. All rights reserved.</p>
      </div>

      <!-- 社群媒體連結 -->
      <div class="social-links">
        <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
          <i class="fab fa-facebook-f"></i>
        </a>
        <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
          <i class="fab fa-instagram"></i>
        </a>
        <a href="https://line.me" target="_blank" rel="noopener noreferrer">
          <i class="fab fa-line"></i>
        </a>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'TheFooter',

  setup() {
    const currentYear = new Date().getFullYear()
    return { currentYear }
  }
}
</script>

<style scoped>
.footer {
  background-color: #fff;
  padding: 1rem 0;
  border-top: 1px solid #eee;
  margin-top: auto;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-links {
  display: flex;
  gap: 1.5rem;
}

.footer-links a {
  color: #666;
  text-decoration: none;
  font-size: 0.9rem;
}

.footer-links a:hover {
  color: var(--primary-color);
}

.copyright {
  color: #666;
  font-size: 0.9rem;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-links a {
  color: #666;
  font-size: 1.2rem;
  text-decoration: none;
}

.social-links a:hover {
  color: var(--primary-color);
}

@media (max-width: 768px) {
  .footer-container {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>
