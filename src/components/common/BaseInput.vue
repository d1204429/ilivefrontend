<template>
  <div class="form-group">
    <!-- 標籤 -->
    <label
        v-if="label"
        :for="id"
        class="form-label"
    >
      {{ label }}
      <span v-if="required" class="required-mark">*</span>
    </label>

    <!-- 輸入框 -->
    <div class="input-wrapper" :class="{ 'has-error': error }">
      <input
          v-bind="$attrs"
          :id="id"
          :value="modelValue"
          :type="type"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :class="[
          'form-control',
          size && `form-control-${size}`,
          { 'is-invalid': error }
        ]"
          @input="updateValue"
          @blur="onBlur"
          @focus="onFocus"
      >

      <!-- 前綴圖標 -->
      <span v-if="prefixIcon" class="prefix-icon">
        <i :class="prefixIcon"></i>
      </span>

      <!-- 後綴圖標 -->
      <span v-if="suffixIcon" class="suffix-icon">
        <i :class="suffixIcon"></i>
      </span>
    </div>

    <!-- 錯誤提示 -->
    <div v-if="error" class="invalid-feedback">
      {{ error }}
    </div>

    <!-- 幫助文字 -->
    <div v-if="helpText" class="help-text">
      {{ helpText }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'BaseInput',
  inheritAttrs: false
}
</script>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // 輸入框標籤
  label: {
    type: String,
    default: ''
  },
  // 輸入框ID
  id: {
    type: String,
    default: ''
  },
  // 輸入框類型
  type: {
    type: String,
    default: 'text'
  },
  // 預設提示文字
  placeholder: {
    type: String,
    default: ''
  },
  // 綁定值
  modelValue: {
    type: [String, Number],
    default: ''
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 是否唯讀
  readonly: {
    type: Boolean,
    default: false
  },
  // 是否必填
  required: {
    type: Boolean,
    default: false
  },
  // 錯誤訊息
  error: {
    type: String,
    default: ''
  },
  // 幫助文字
  helpText: {
    type: String,
    default: ''
  },
  // 尺寸(sm/lg)
  size: {
    type: String,
    default: ''
  },
  // 前綴圖標
  prefixIcon: {
    type: String,
    default: ''
  },
  // 後綴圖標
  suffixIcon: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'update:modelValue',
  'blur',
  'focus',
  'change'
])

// 更新輸入值
const updateValue = (event) => {
  emit('update:modelValue', event.target.value)
  emit('change', event.target.value)
}

// 失去焦點事件
const onBlur = (event) => {
  emit('blur', event)
}

// 獲得焦點事件
const onFocus = (event) => {
  emit('focus', event)
}
</script>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

.required-mark {
  color: #dc3545;
  margin-left: 0.25rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-control {
  display: block;
  width: 100%;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text-color);
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: var(--primary-color);
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-control-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.form-control-lg {
  padding: 0.5rem 1rem;
  font-size: 1.25rem;
}

.form-control:disabled,
.form-control[readonly] {
  background-color: #e9ecef;
  opacity: 1;
}

.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #dc3545;
}

.help-text {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.prefix-icon,
.suffix-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.prefix-icon {
  left: 0.75rem;
}

.suffix-icon {
  right: 0.75rem;
}

.prefix-icon + input {
  padding-left: 2.5rem;
}

.suffix-icon + input {
  padding-right: 2.5rem;
}
</style>
