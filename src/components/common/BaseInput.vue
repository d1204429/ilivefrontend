<template>
  <div class="form-group">
    <label
        v-if="label"
        :for="id"
        class="form-label"
    >
      {{ label }}
      <span v-if="required" class="required-mark">*</span>
    </label>

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

      <slot name="prefix">
        <span v-if="prefixIcon" class="prefix-icon">
          <i :class="prefixIcon"></i>
        </span>
      </slot>

      <slot name="append">
        <span v-if="suffixIcon" class="suffix-icon">
          <i :class="suffixIcon"></i>
        </span>
      </slot>
    </div>

    <div v-if="error" class="invalid-feedback">
      {{ error }}
    </div>

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
  label: {
    type: String,
    default: ''
  },
  id: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  modelValue: {
    type: [String, Number],
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  helpText: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: ''
  },
  prefixIcon: {
    type: String,
    default: ''
  },
  suffixIcon: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'change'])

const updateValue = (event) => {
  emit('update:modelValue', event.target.value)
  emit('change', event.target.value)
}

const onBlur = (event) => {
  emit('blur', event)
}

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
  color: #2c3e50;
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
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #2c3e50;
  background-color: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.form-control:focus {
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  outline: none;
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.form-control:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.invalid-feedback {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #dc3545;
}

.help-text {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #718096;
}

.prefix-icon,
.suffix-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
  pointer-events: none;
}

.prefix-icon {
  left: 0.75rem;
}

.suffix-icon {
  right: 0.75rem;
}

input::-ms-reveal,
input::-ms-clear {
  display: none;
}

@media (max-width: 640px) {
  .form-control {
    font-size: 1rem;
    padding: 0.5rem 0.75rem;
  }
}
</style>
