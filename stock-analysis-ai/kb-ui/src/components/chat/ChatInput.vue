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
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const canSubmit = computed(() => {
  const validation = validateQuery(inputValue.value)
  return validation.valid
})

watch(inputValue, () => {
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
  const disabledClass = props.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
  return `${base} border-gray-300 ${disabledClass}`
})
</script>
