<template>
  <footer class="footer">
    <div class="container">
      <div class="row py-3">
        <!-- 頁尾連結區 -->
        <div class="col-12 col-md-4 mb-3 mb-md-0">
          <div class="d-flex justify-content-center justify-content-md-start gap-4">
            <router-link to="/about" class="footer-link">關於我們</router-link>
            <router-link to="/contact" class="footer-link">聯絡我們</router-link>
          </div>
        </div>

        <!-- 版權宣告 -->
        <div class="col-12 col-md-4 mb-3 mb-md-0">
          <div class="text-center">
            <p class="mb-0">Copyright © {{ currentYear }} FCU. All rights reserved.</p>
          </div>
        </div>

        <!-- 社群媒體連結 -->
        <div class="col-12 col-md-4">
          <div class="d-flex justify-content-center justify-content-md-end gap-3">
            <a href="https://www.facebook.com"
               target="_blank"
               rel="noopener noreferrer"
               class="social-link">
              <i class="fab fa-facebook-f"></i>
            </a>
            <a href="https://www.instagram.com"
               target="_blank"
               rel="noopener noreferrer"
               class="social-link">
              <i class="fab fa-instagram"></i>
            </a>
            <a href="https://line.me"
               target="_blank"
               rel="noopener noreferrer"
               class="social-link">
              <i class="fab fa-line"></i>
            </a>
          </div>
        </div>
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
  background-color: #FFD466;
  width: 100%;
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 1030;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.footer-link {
  color: #000;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease, transform 0.2s ease;
  position: relative;
}

.footer-link:hover {
  color: #333;
  transform: translateY(-2px);
}

.footer-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background-color: #333;
  transition: width 0.3s ease;
}

.footer-link:hover::after {
  width: 100%;
}

.social-link {
  color: #000;
  font-size: 1.2rem;
  text-decoration: none;
  transition: all 0.3s ease;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.05);
}

.social-link:hover {
  color: #333;
  background-color: rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* Medium devices (tablets) */
@media (max-width: 991.98px) {
  .footer {
    padding: 0.5rem 0;
  }

  .social-link {
    width: 30px;
    height: 30px;
    font-size: 1rem;
  }
}

/* Small devices (landscape phones) */
@media (max-width: 767.98px) {
  .footer {
    padding: 0.75rem 0;
  }

  .footer-link {
    font-size: 0.85rem;
  }

  p {
    font-size: 0.85rem;
  }
}

/* Extra small devices (portrait phones) */
@media (max-width: 575.98px) {
  .footer {
    padding: 0.5rem 0;
  }

  .social-link {
    width: 28px;
    height: 28px;
    font-size: 0.9rem;
  }

  .footer-link {
    font-size: 0.8rem;
  }

  p {
    font-size: 0.8rem;
  }
}

/* 確保在較小螢幕上的間距 */
.gap-4 {
  gap: 1.5rem !important;
}

.gap-3 {
  gap: 1rem !important;
}

/* 動畫效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.footer {
  animation: fadeInUp 0.5s ease-out;
}
</style>
