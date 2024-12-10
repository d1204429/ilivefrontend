<template>
  <div class="about-container">
    <h1 class="page-title">關於我們</h1>

    <section class="company-intro">
      <h2>公司簡介</h2>
      <p>iLive 是您值得信賴的電器用品購物平台，致力於提供優質的家電產品和卓越的購物體驗。</p>
    </section>

    <section class="company-value">
      <h2>我們的價值</h2>
      <div class="value-cards">
        <div class="value-card">
          <i class="fas fa-check-circle"></i>
          <h3>品質保證</h3>
          <p>嚴選優質商品，確保每件產品都符合高標準</p>
        </div>
        <div class="value-card">
          <i class="fas fa-shipping-fast"></i>
          <h3>快速配送</h3>
          <p>專業物流團隊，讓您購物無需久候</p>
        </div>
        <div class="value-card">
          <i class="fas fa-headset"></i>
          <h3>專業服務</h3>
          <p>貼心的客戶服務，解決您的所有疑問</p>
        </div>
      </div>
    </section>

    <section class="company-history">
      <h2>發展歷程</h2>
      <div class="timeline">
        <div class="timeline-item">
          <div class="year">2020</div>
          <div class="content">公司成立</div>
        </div>
        <div class="timeline-item">
          <div class="year">2021</div>
          <div class="content">線上平台上線</div>
        </div>
        <div class="timeline-item">
          <div class="year">2022</div>
          <div class="content">擴展商品類別</div>
        </div>
        <div class="timeline-item">
          <div class="year">2023</div>
          <div class="content">會員數突破10萬</div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-title {
  text-align: center;
  margin-bottom: 3rem;
  color: #333;
}

section {
  margin-bottom: 4rem;
}

.value-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.value-card {
  text-align: center;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
  transition: transform 0.3s ease;
}

.value-card:hover {
  transform: translateY(-5px);
}

.value-card i {
  font-size: 2.5rem;
  color: #007bff;
  margin-bottom: 1rem;
}

.timeline {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
}

.timeline-item {
  display: flex;
  margin-bottom: 2rem;
  gap: 2rem;
}

.year {
  font-weight: bold;
  color: #007bff;
  width: 80px;
}

@media (max-width: 768px) {
  .value-cards {
    grid-template-columns: 1fr;
  }
}
</style>
