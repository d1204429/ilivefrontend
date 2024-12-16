<template>
  <button
      :class="buttonClasses"
      :type="htmlType"
      :disabled="disabled || loading"
      @click="handleClick"
  >
    <!-- 載入動畫 -->
    <span v-if="loading" class="button-loading">
      <i class="fas fa-spinner fa-spin"></i>
    </span>

    <!-- 左側圖標 -->
    <i v-if="leftIcon && !loading" :class="['button-icon', leftIcon]"></i>

    <!-- 按鈕內容 -->
    <span class="button-content" :class="{ 'hidden': loading }">
      <slot></slot>
    </span>

    <!-- 右側圖標 -->
    <i v-if="rightIcon && !loading" :class="['button-icon', rightIcon]"></i>
  </button>
</template>

<script>
export default {
  name: 'BaseButton',

  props: {
    // HTML 按鈕類型
    htmlType: {
      type: String,
      default: 'button',
      validator: value => ['button', 'submit', 'reset'].includes(value)
    },

    // 按鈕樣式類型
    variant: {
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
    },

    // 是否為輪廓按鈕
    outline: {
      type: Boolean,
      default: false
    },

    // 是否為圓角按鈕
    rounded: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    buttonClasses() {
      return [
        'base-button',
        `base-button--${this.variant}`,
        `base-button--${this.size}`,
        {
          'base-button--block': this.block,
          'base-button--disabled': this.disabled || this.loading,
          'base-button--outline': this.outline,
          'base-button--rounded': this.rounded,
          'base-button--loading': this.loading
        }
      ]
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
  border-radius: 0.25rem;
  font-weight: 500;
  font-size: 1rem;
  line-height: 1.5;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  position: relative;
  outline: none;
  white-space: nowrap;
  user-select: none;
}

/* 尺寸變體 */
.base-button--small {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 0.2rem;
}

.base-button--medium {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.base-button--large {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
  border-radius: 0.3rem;
}

/* 主題變體 */
.base-button--primary {
  background-color: #4299e1;
  color: #ffffff;
  border-color: #4299e1;
}

.base-button--secondary {
  background-color: #718096;
  color: #ffffff;
  border-color: #718096;
}

.base-button--success {
  background-color: #48bb78;
  color: #ffffff;
  border-color: #48bb78;
}

.base-button--danger {
  background-color: #f56565;
  color: #ffffff;
  border-color: #f56565;
}

.base-button--warning {
  background-color: #ecc94b;
  color: #000000;
  border-color: #ecc94b;
}

.base-button--info {
  background-color: #4fd1c5;
  color: #ffffff;
  border-color: #4fd1c5;
}

.base-button--light {
  background-color: #f7fafc;
  color: #1a202c;
  border-color: #e2e8f0;
}

.base-button--dark {
  background-color: #2d3748;
  color: #ffffff;
  border-color: #2d3748;
}

.base-button--link {
  background-color: transparent;
  color: #4299e1;
  text-decoration: none;
  border-color: transparent;
}

/* 輪廓按鈕 */
.base-button--outline {
  background-color: transparent;
}

.base-button--outline.base-button--primary {
  color: #4299e1;
}

.base-button--outline.base-button--secondary {
  color: #718096;
}

.base-button--outline.base-button--success {
  color: #48bb78;
}

.base-button--outline.base-button--danger {
  color: #f56565;
}

.base-button--outline.base-button--warning {
  color: #ecc94b;
}

.base-button--outline.base-button--info {
  color: #4fd1c5;
}

/* 圓角按鈕 */
.base-button--rounded {
  border-radius: 9999px;
}

/* 狀態樣式 */
.base-button--disabled {
  opacity: 0.65;
  cursor: not-allowed;
  pointer-events: none;
}

.base-button--block {
  display: flex;
  width: 100%;
}

/* 圖標樣式 */
.button-icon {
  display: inline-flex;
  align-items: center;
}

.button-icon:first-child {
  margin-right: 0.5rem;
}

.button-icon:last-child {
  margin-left: 0.5rem;
}

/* 載入動畫 */
.button-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.base-button--loading {
  color: transparent !important;
}

.base-button--loading .button-content {
  visibility: hidden;
}

/* 懸停效果 */
.base-button:not(.base-button--disabled):not(.base-button--loading):hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* 點擊效果 */
.base-button:not(.base-button--disabled):not(.base-button--loading):active {
  transform: translateY(1px);
}

/* 響應式設計 */
@media (max-width: 640px) {
  .base-button {
    font-size: 0.875rem;
  }

  .base-button--large {
    font-size: 1rem;
  }
}
</style>
