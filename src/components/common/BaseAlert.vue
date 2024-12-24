<template>
  <transition name="alert">
    <div
        v-if="show"
        class="alert"
        :class="[typeClass, positionClass]"
        role="alert"
        :aria-live="type === 'error' ? 'assertive' : 'polite'"
    >
      <div class="alert-content">
        <i :class="iconClass" aria-hidden="true"></i>
        <div class="alert-text">
          <strong v-if="title" class="alert-title">{{ title }}</strong>
          <span class="alert-message">{{ message }}</span>
        </div>
      </div>

      <div class="alert-actions">
        <button
            v-if="action"
            class="alert-action-btn"
            @click="handleAction"
        >
          {{ actionText }}
        </button>

        <button
            v-if="dismissible"
            class="alert-close"
            @click="handleClose"
            aria-label="關閉提示"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div
          v-if="duration && show"
          class="alert-progress"
          :style="progressStyle"
      ></div>
    </div>
  </transition>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'warning', 'error', 'info'].includes(value)
  },
  title: {
    type: String,
    default: ''
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
  },
  duration: {
    type: Number,
    default: 0
  },
  position: {
    type: String,
    default: 'top-right',
    validator: (value) => [
      'top-right',
      'top-left',
      'bottom-right',
      'bottom-left',
      'top-center',
      'bottom-center'
    ].includes(value)
  },
  action: {
    type: Function,
    default: null
  },
  actionText: {
    type: String,
    default: '確定'
  }
})

const emit = defineEmits(['close', 'action'])

const progress = ref(100)
let progressTimer = null
let closeTimer = null

const typeClass = computed(() => ({
  'alert-success': props.type === 'success',
  'alert-warning': props.type === 'warning',
  'alert-error': props.type === 'error',
  'alert-info': props.type === 'info'
}))

const positionClass = computed(() => `alert-${props.position}`)

const iconClass = computed(() => ({
  'fas': true,
  'fa-check-circle': props.type === 'success',
  'fa-exclamation-triangle': props.type === 'warning',
  'fa-times-circle': props.type === 'error',
  'fa-info-circle': props.type === 'info'
}))

const progressStyle = computed(() => ({
  width: `${progress.value}%`,
  backgroundColor: {
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8'
  }[props.type]
}))

const handleClose = () => {
  clearTimers()
  emit('close')
}

const handleAction = () => {
  if (props.action) {
    emit('action')
    props.action()
  }
}

const startTimers = () => {
  if (props.duration > 0) {
    const progressInterval = 10
    const progressStep = (progressInterval / props.duration) * 100

    progressTimer = setInterval(() => {
      progress.value = Math.max(0, progress.value - progressStep)
    }, progressInterval)

    closeTimer = setTimeout(() => {
      handleClose()
    }, props.duration)
  }
}

const clearTimers = () => {
  if (progressTimer) clearInterval(progressTimer)
  if (closeTimer) clearTimeout(closeTimer)
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    progress.value = 100
    startTimers()
  } else {
    clearTimers()
  }
})

onMounted(() => {
  if (props.show && props.duration > 0) {
    startTimers()
  }
})
</script>

<style scoped>
.alert {
  position: fixed;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 300px;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  backdrop-filter: blur(8px);
}

.alert-top-right {
  top: 20px;
  right: 20px;
}

.alert-top-left {
  top: 20px;
  left: 20px;
}

.alert-bottom-right {
  bottom: 20px;
  right: 20px;
}

.alert-bottom-left {
  bottom: 20px;
  left: 20px;
}

.alert-top-center {
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.alert-bottom-center {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.alert-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.alert-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert-title {
  font-weight: 600;
  font-size: 1rem;
}

.alert-message {
  font-size: 0.9rem;
  line-height: 1.4;
}

.alert-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 16px;
}

.alert-action-btn {
  background: none;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.alert-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 4px;
  opacity: 0.7;
  transition: all 0.2s;
  border-radius: 4px;
}

.alert-close:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.1);
}

.alert-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  border-radius: 0 0 8px 8px;
  transition: width 10ms linear;
}

.alert-success {
  background-color: rgba(212, 237, 218, 0.95);
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-warning {
  background-color: rgba(255, 243, 205, 0.95);
  color: #856404;
  border: 1px solid #ffeeba;
}

.alert-error {
  background-color: rgba(248, 215, 218, 0.95);
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-info {
  background-color: rgba(204, 229, 255, 0.95);
  color: #004085;
  border: 1px solid #b8daff;
}

.alert-enter-active,
.alert-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.alert-enter-from,
.alert-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

@media (max-width: 768px) {
  .alert {
    width: calc(100% - 32px);
    min-width: auto;
    margin: 0 16px;
  }
}
</style>
