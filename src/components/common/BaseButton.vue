<template>
  <button
      :class="[
      'base-button',
      `base-button--${type}`,
      `base-button--${size}`,
      { 'base-button--block': block },
      { 'base-button--disabled': disabled }
    ]"
      :disabled="disabled"
      @click="handleClick"
  >
    <!-- 左側圖標 -->
    <i v-if="leftIcon" :class="['button-icon', leftIcon]"></i>

    <!-- 按鈕內容 -->
    <span class="button-content">
      <slot></slot>
    </span>

    <!-- 右側圖標 -->
    <i v-if="rightIcon" :class="['button-icon', rightIcon]"></i>

    <!-- 載入動畫 -->
    <span v-if="loading" class="button-loading">
      <i class="fas fa-spinner fa-spin"></i>
    </span>
  </button>
</template>

<script>
export default {
  name: 'BaseButton',

  props: {
    // 按鈕類型
    type: {
      type: String,
      default: 'primary',
      validator: value => [
        'primary',
        'secondary',
        'success',
        'danger',
        'warning',
        'info',
        'light',
        'dark',
        'link'
      ].includes(value)
    },

    // 按鈕尺寸
    size: {
      type: String,
      default: 'medium',
      validator: value => ['small', 'medium', 'large'].includes(value)
    },

    // 是否禁用
    disabled: {
      type: Boolean,
      default: false
    },

    // 是否顯示載入狀態
    loading: {
      type: Boolean,
      default: false
    },

    // 左側圖標
    leftIcon: {
      type: String,
      default: ''
    },

    // 右側圖標
    rightIcon: {
      type: String,
      default: ''
    },

    // 是否為塊級元素
    block: {
      type: Boolean,
      default: false
    }
  },

  methods: {
    handleClick(event) {
      if (!this.disabled && !this.loading) {
        this.$emit('click', event)
      }
    }
  }
}
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  outline: none;
}

/* 尺寸變體 */
.base-button--small {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.base-button--medium {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.base-button--large {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}

/* 類型變體 */
.base-button--primary {
  background-color: var(--primary-color);
  color: #ffffff;
}

.base-button--secondary {
  background-color: #6c757d;
  color: #ffffff;
}

.base-button--success {
  background-color: #28a745;
  color: #ffffff;
}

.base-button--danger {
  background-color: #dc3545;
  color: #ffffff;
}

.base-button--warning {
  background-color: #ffc107;
  color: #000000;
}

.base-button--info {
  background-color: #17a2b8;
  color: #ffffff;
}

.base-button--light {
  background-color: #f8f9fa;
  color: #000000;
  border: 1px solid #dee2e6;
}

.base-button--dark {
  background-color: #343a40;
  color: #ffffff;
}

.base-button--link {
  background-color: transparent;
  color: var(--primary-color);
  text-decoration: none;
}

/* 狀態樣式 */
.base-button--disabled,
.base-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.base-button--block {
  display: flex;
  width: 100%;
}

/* 圖標樣式 */
.button-icon {
  margin: 0 0.5rem;
}

/* 載入動畫 */
.button-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.button-loading ~ .button-content {
  opacity: 0;
}

/* 懸停效果 */
.base-button:not(.base-button--disabled):not(:disabled):hover {
  opacity: 0.9;
}

/* 點擊效果 */
.base-button:not(.base-button--disabled):not(:disabled):active {
  transform: translateY(1px);
}

@media (max-width: 768px) {
  .base-button--block-mobile {
    width: 100%;
  }
}
</style>
