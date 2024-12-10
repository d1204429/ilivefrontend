<template>
  <div class="contact-container">
    <h1 class="page-title">聯絡我們</h1>

    <div class="contact-content">
      <div class="contact-info">
        <h2>聯絡資訊</h2>
        <div class="info-item">
          <i class="fas fa-phone"></i>
          <p>客服專線：0800-888-888</p>
        </div>
        <div class="info-item">
          <i class="fas fa-envelope"></i>
          <p>客服信箱：service@ilive.com</p>
        </div>
        <div class="info-item">
          <i class="fas fa-clock"></i>
          <p>服務時間：週一至週五 9:00-18:00</p>
        </div>
      </div>

      <form class="contact-form" @submit.prevent="submitForm">
        <h2>意見回饋</h2>
        <div class="form-group">
          <label for="name">姓名</label>
          <input
              type="text"
              id="name"
              v-model="formData.name"
              required
          >
        </div>
        <div class="form-group">
          <label for="email">電子郵件</label>
          <input
              type="email"
              id="email"
              v-model="formData.email"
              required
          >
        </div>
        <div class="form-group">
          <label for="subject">主旨</label>
          <input
              type="text"
              id="subject"
              v-model="formData.subject"
              required
          >
        </div>
        <div class="form-group">
          <label for="message">訊息內容</label>
          <textarea
              id="message"
              v-model="formData.message"
              rows="5"
              required
          ></textarea>
        </div>
        <button type="submit" class="submit-btn">送出訊息</button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ContactView',
  data() {
    return {
      formData: {
        name: '',
        email: '',
        subject: '',
        message: ''
      }
    }
  },
  methods: {
    submitForm() {
      // TODO: 實作表單提交邏輯
      console.log('Form submitted:', this.formData);
    }
  }
}
</script>

<style scoped>
.contact-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-title {
  text-align: center;
  margin-bottom: 3rem;
  color: #333;
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 3rem;
}

.contact-info {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  gap: 1rem;
}

.info-item i {
  font-size: 1.5rem;
  color: #007bff;
}

.contact-form {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
}

input,
textarea {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

textarea {
  resize: vertical;
}

.submit-btn {
  background: #007bff;
  color: white;
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.submit-btn:hover {
  background: #0056b3;
}

@media (max-width: 768px) {
  .contact-content {
    grid-template-columns: 1fr;
  }
}
</style>
