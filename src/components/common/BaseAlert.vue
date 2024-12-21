<template>
  <transition name="alert">
    <div v-if="show" class="alert" :class="typeClass">
      <div class="alert-content">
        <i :class="iconClass"></i>
        <span class="alert-message">{{ message }}</span>
      </div>
      <button v-if="dismissible" class="alert-close" @click="handleClose">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'warning', 'error', 'info'].includes(value)
  },
  message: {
    type: String,
    required: true
  },
  show: {
    type: Boolean,
    default: true
  },
  dismissible: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close'])

const typeClass = computed(() => ({
  'alert-success': props.type === 'success',
  'alert-warning': props.type === 'warning',
  'alert-error': props.type === 'error',
  'alert-info': props.type === 'info'
}))

const iconClass = computed(() => ({
  'fas': true,
  'fa-check-circle': props.type === 'success',
  'fa-exclamation-triangle': props.type === 'warning',
  'fa-times-circle': props.type === 'error',
  'fa-info-circle': props.type === 'info'
}))

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.alert {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 300px;
  max-width: 500px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 9999;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.alert-message {
  font-size: 0.9rem;
}

.alert-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  opacity: 0.7;
}

.alert-close:hover {
  opacity: 1;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}

.alert-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-info {
  background-color: #cce5ff;
  color: #004085;
  border: 1px solid #b8daff;
}

.alert-enter-active,
.alert-leave-active {
  transition: all 0.3s ease;
}

.alert-enter-from,
.alert-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
