<template>
  <Transition name="fade">
    <div v-if="show" class="loading-overlay" :class="{ 'fixed': fixed }">
      <div class="loading-spinner">
        <div class="spinner" :style="spinnerStyle">
          <div class="spinner-inner"></div>
        </div>
        <div v-if="message" class="loading-message" :style="messageStyle">
          {{ message }}
          <span v-if="showDots" class="loading-dots">
            <span class="dot">.</span>
            <span class="dot">.</span>
            <span class="dot">.</span>
          </span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: '載入中'
  },
  fixed: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  color: {
    type: String,
    default: '#3498db'
  },
  backgroundColor: {
    type: String,
    default: 'rgba(255, 255, 255, 0.9)'
  },
  showDots: {
    type: Boolean,
    default: true
  }
})

const spinnerStyle = computed(() => {
  const sizes = {
    small: '30px',
    medium: '50px',
    large: '70px'
  }

  return {
    width: sizes[props.size],
    height: sizes[props.size],
    borderColor: `${props.color}20`,
    borderTopColor: props.color
  }
})

const messageStyle = computed(() => ({
  color: props.color
}))
</script>

<style scoped>
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: v-bind(backgroundColor);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-overlay.fixed {
  position: fixed;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.spinner {
  position: relative;
  border: 4px solid;
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.17, 0.67, 0.83, 0.67) infinite;
}

.spinner::after {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  border: 4px solid transparent;
  border-top-color: inherit;
  animation: spin 0.8s linear infinite;
  opacity: 0.6;
}

.loading-message {
  font-size: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 2px;
}

.loading-dots .dot {
  animation: dots 1.4s infinite;
  opacity: 0;
}

.loading-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dots {
  0%, 20% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  80%, 100% {
    opacity: 0;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .loading-message {
    font-size: 0.9rem;
  }

  .spinner {
    border-width: 3px;
  }
}
</style>
