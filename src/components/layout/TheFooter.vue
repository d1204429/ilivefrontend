<template>
  <CFooter class="footer">
    <CContainer>
      <CRow>
        <!-- 公司資訊區 -->
        <CCol xs="12" md="4" class="footer-section">
          <div class="company-info">
            <img src="@/assets/logo.svg" alt="iLive Logo" class="footer-logo">
            <h5 class="company-name">iLive 商城</h5>
            <p class="company-description">
              提供優質家電商品與完善的售後服務
            </p>
          </div>
        </CCol>

        <!-- 快速連結區 -->
        <CCol xs="12" md="4" class="footer-section">
          <h5 class="footer-title">快速連結</h5>
          <ul class="footer-links">
            <li>
              <router-link to="/">首頁</router-link>
            </li>
            <li>
              <router-link to="/products">商品列表</router-link>
            </li>
            <li>
              <router-link to="/about">關於我們</router-link>
            </li>
            <li>
              <router-link to="/contact">聯絡我們</router-link>
            </li>
          </ul>
        </CCol>

        <!-- 聯絡資訊區 -->
        <CCol xs="12" md="4" class="footer-section">
          <h5 class="footer-title">聯絡資訊</h5>
          <ul class="contact-info">
            <li>
              <i class="fas fa-phone"></i>
              <span>客服專線：0800-123-456</span>
            </li>
            <li>
              <i class="fas fa-envelope"></i>
              <span>Email：service@ilive.com</span>
            </li>
            <li>
              <i class="fas fa-map-marker-alt"></i>
              <span>地址：台中市西屯區文華路100號</span>
            </li>
          </ul>
        </CCol>
      </CRow>

      <!-- 社群媒體連結 -->
      <CRow class="social-media-section">
        <CCol xs="12" class="text-center">
          <a href="#" class="social-link">
            <i class="fab fa-facebook"></i>
          </a>
          <a href="#" class="social-link">
            <i class="fab fa-instagram"></i>
          </a>
          <a href="#" class="social-link">
            <i class="fab fa-line"></i>
          </a>
        </CCol>
      </CRow>

      <!-- 版權宣告 -->
      <CRow class="copyright-section">
        <CCol xs="12" class="text-center">
          <p class="copyright-text">
            © {{ currentYear }} iLive 商城. 版權所有.
          </p>
        </CCol>
      </CRow>
    </CContainer>
  </CFooter>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'TheFooter',

  setup() {
    const currentYear = ref(new Date().getFullYear())

    return {
      currentYear
    }
  }
}
</script>

<style scoped>
.footer {
  background-color: #f8f9fa;
  padding: 3rem 0;
  margin-top: 2rem;
  border-top: 1px solid #dee2e6;
}

.footer-section {
  margin-bottom: 2rem;
}

.footer-logo {
  height: 40px;
  margin-bottom: 1rem;
}

.company-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.company-description {
  color: #6c757d;
  font-size: 0.9rem;
}

.footer-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 0.5rem;
}

.footer-links a {
  color: #6c757d;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: var(--primary-color);
}

.contact-info {
  list-style: none;
  padding: 0;
  margin: 0;
}

.contact-info li {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  color: #6c757d;
}

.contact-info i {
  margin-right: 0.5rem;
  color: var(--primary-color);
}

.social-media-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #dee2e6;
}

.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin: 0 0.5rem;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: #ffffff;
  transition: all 0.3s ease;
}

.social-link:hover {
  background-color: var(--secondary-color);
  transform: translateY(-2px);
}

.copyright-section {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}

.copyright-text {
  color: #6c757d;
  font-size: 0.9rem;
  margin: 0;
}

/* RWD 響應式設計 */
@media (max-width: 768px) {
  .footer {
    padding: 2rem 0;
  }

  .footer-section {
    text-align: center;
  }

  .contact-info li {
    justify-content: center;
  }
}
</style>
