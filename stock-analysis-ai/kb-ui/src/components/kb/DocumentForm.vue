<template>
  <div class="document-form">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <Input
        id="title"
        v-model="formData.title"
        label="Title"
        :required="true"
        :error="errors.title"
        placeholder="Enter document title"
      />

      <div>
        <label for="kb_id" class="block text-sm font-medium text-gray-700 mb-1">
          Knowledge Base ID <span class="text-red-500">*</span>
        </label>
        <Input
          id="kb_id"
          v-model="formData.kb_id"
          :required="true"
          :error="errors.kb_id"
          placeholder="Enter KB ID"
        />
      </div>

      <div>
        <label for="doc_type" class="block text-sm font-medium text-gray-700 mb-1">
          Document Type <span class="text-red-500">*</span>
        </label>
        <select
          id="doc_type"
          v-model="formData.doc_type"
          :class="selectClasses"
        >
          <option value="article">Article</option>
          <option value="faq">FAQ</option>
          <option value="guide">Guide</option>
          <option value="reference">Reference</option>
        </select>
      </div>

      <div>
        <label for="content" class="block text-sm font-medium text-gray-700 mb-1">
          Content <span class="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          v-model="formData.content"
          :class="textareaClasses"
          rows="10"
          placeholder="Enter document content"
          required
        />
        <p v-if="errors.content" class="mt-1 text-sm text-red-600">{{ errors.content }}</p>
      </div>

      <div>
        <label for="tags" class="block text-sm font-medium text-gray-700 mb-1">
          Tags (comma-separated)
        </label>
        <Input
          id="tags"
          v-model="tagsInput"
          placeholder="tag1, tag2, tag3"
        />
      </div>

      <div>
        <label for="language" class="block text-sm font-medium text-gray-700 mb-1">
          Language
        </label>
        <Input
          id="language"
          v-model="formData.language"
          placeholder="en"
        />
      </div>

      <div class="flex gap-2 justify-end">
        <Button variant="secondary" @click="$emit('cancel')">
          Cancel
        </Button>
        <Button type="submit" :loading="loading" :disabled="!isValid">
          {{ isEditMode ? 'Update' : 'Create' }}
        </Button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Input from '../common/Input.vue'
import Button from '../common/Button.vue'
import { validateDocumentFields } from '@/utils/validators'
import type { KBDocument } from '@/services/documents.service'

interface Props {
  document?: KBDocument | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  document: null,
  loading: false
})

const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

const formData = ref({
  title: '',
  kb_id: '',
  doc_type: 'article',
  content: '',
  language: 'en',
  tags: [] as string[]
})

const tagsInput = ref('')
const errors = ref<Record<string, string>>({})

const isEditMode = computed(() => !!props.document)

// Initialize form data
watch(
  () => props.document,
  (doc) => {
    if (doc) {
      formData.value = {
        title: doc.title,
        kb_id: doc.kb_id,
        doc_type: doc.doc_type,
        content: doc.content,
        language: doc.language,
        tags: doc.tags || []
      }
      tagsInput.value = doc.tags?.join(', ') || ''
    } else {
      formData.value = {
        title: '',
        kb_id: '',
        doc_type: 'article',
        content: '',
        language: 'en',
        tags: []
      }
      tagsInput.value = ''
    }
    errors.value = {}
  },
  { immediate: true }
)

const isValid = computed(() => {
  const validation = validateDocumentFields(formData.value.title, formData.value.content)
  return validation.valid && formData.value.kb_id.trim() !== ''
})

const selectClasses = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
const textareaClasses = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

function handleSubmit() {
  errors.value = {}

  // Validate
  const validation = validateDocumentFields(formData.value.title, formData.value.content)
  if (!validation.valid) {
    errors.value.content = validation.error
    return
  }

  if (!formData.value.kb_id.trim()) {
    errors.value.kb_id = 'KB ID is required'
    return
  }

  // Parse tags
  const tags = tagsInput.value
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)

  const submitData = {
    ...formData.value,
    tags
  }

  emit('submit', submitData)
}
</script>
