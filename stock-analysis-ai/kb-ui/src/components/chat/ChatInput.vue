<template>
  <div class="chat-input-wrapper">
    <form @submit.prevent="handleSubmit" class="flex gap-2">
      <textarea
        v-model="inputValue"
        :disabled="disabled"
        :placeholder="placeholder"
        :class="inputClasses"
        @keydown.enter.exact.prevent="handleSubmit"
        @keydown.enter.shift.exact="handleNewLine"
        rows="1"
        ref="textareaRef"
      />
      <Button
        type="submit"
        :disabled="disabled || !canSubmit"
        :loading="loading"
        variant="primary"
        size="md"
      >
        Send
      </Button>
    </form>
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import Button from '../common/Button.vue'
import { validateQuery } from '@/utils/validators'

interface Props {
  disabled?: boolean
  loading?: boolean
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  loading: false,
  placeholder: 'Type your question here...'
})

const emit = defineEmits<{
  submit: [query: string]
}>()

const inputValue = ref('')
const error = ref<string | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const canSubmit = computed(() => {
  const validation = validateQuery(inputValue.value)
  if (!validation.valid) {
    error.value = validation.error || null
    return false
  }
  error.value = null
  return validation.valid
})

watch(inputValue, () => {
  // Clear error when user types
  if (error.value) {
    error.value = null
  }
  
  // Auto-resize textarea
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
      textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
    }
  })
})

function handleSubmit() {
  if (!canSubmit.value || props.disabled || props.loading) {
    return
  }
  
  const query = inputValue.value.trim()
  emit('submit', query)
  inputValue.value = ''
  
  // Reset textarea height
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}

function handleNewLine() {
  // Allow Shift+Enter for new line
  const cursorPos = textareaRef.value?.selectionStart || 0
  const textBefore = inputValue.value.substring(0, cursorPos)
  const textAfter = inputValue.value.substring(cursorPos)
  inputValue.value = textBefore + '\n' + textAfter
  
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.setSelectionRange(cursorPos + 1, cursorPos + 1)
      textareaRef.value.style.height = 'auto'
      textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
    }
  })
}

const inputClasses = computed(() => {
  const base = 'flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
  const errorClass = error.value ? 'border-red-500' : 'border-gray-300'
  const disabledClass = props.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
  return `${base} ${errorClass} ${disabledClass}`
})
</script>
