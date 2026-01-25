<template>
  <div class="documents-view p-6">
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold">Knowledge Base Documents</h1>
          <p class="text-gray-600 mt-1">Manage knowledge base documents</p>
        </div>
        <Button variant="primary" @click="showCreateForm = true">
          Create Document
        </Button>
      </div>

      <div class="flex gap-4 mb-4">
        <SearchInput
          v-model="searchQuery"
          placeholder="Search documents..."
          class="flex-1"
        />
        <Button variant="outline" @click="handleRefresh">
          Refresh
        </Button>
      </div>
    </div>

    <LoadingIndicator v-if="isLoading" :visible="true" message="Loading documents..." />

    <div v-if="error" class="mb-4 p-4 bg-red-50 border-l-4 border-red-500">
      <div class="flex items-center justify-between">
        <span class="text-red-600">{{ error }}</span>
        <Button variant="outline" size="sm" @click="clearError">Dismiss</Button>
      </div>
    </div>

    <DocumentList
      :documents="filteredDocuments"
      :is-loading="isLoading"
      @view="handleView"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <Pagination
      v-if="total && total > 0"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total="total"
      :page-size="limit"
      @prev="prevPage"
      @next="nextPage"
      @go-to-page="goToPage"
    />

    <!-- Create/Edit Dialog -->
    <div
      v-if="showCreateForm || editingDocument"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold">
              {{ editingDocument ? 'Edit Document' : 'Create Document' }}
            </h2>
            <button class="text-gray-400 hover:text-gray-600" @click="closeForm">✕</button>
          </div>
          <DocumentForm
            :document="editingDocument"
            :loading="isLoading"
            @submit="handleFormSubmit"
            @cancel="closeForm"
          />
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div
      v-if="documentToDelete"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 class="text-lg font-bold mb-4">Delete Document</h3>
        <p class="text-gray-600 mb-6">
          Are you sure you want to delete "{{ documentToDelete.title }}"? This action cannot be undone.
        </p>
        <div class="flex gap-2 justify-end">
          <Button variant="secondary" @click="documentToDelete = null">Cancel</Button>
          <Button variant="danger" @click="confirmDelete" :loading="isLoading">
            Delete
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDocumentsStore } from '@/stores/documents.store'
import { usePagination } from '@/composables/usePagination'
import DocumentList from '@/components/kb/DocumentList.vue'
import DocumentForm from '@/components/kb/DocumentForm.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import Pagination from '@/components/common/Pagination.vue'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import Button from '@/components/common/Button.vue'
import type { KBDocument } from '@/services/documents.service'

const documentsStore = useDocumentsStore()
const pagination = usePagination({ initialPage: 1, pageSize: 50 })

const showCreateForm = ref(false)
const editingDocument = ref<KBDocument | null>(null)
const documentToDelete = ref<KBDocument | null>(null)
const searchQuery = ref('')

const documents = computed(() => documentsStore.documents)
const isLoading = computed(() => documentsStore.isLoading)
const error = computed(() => documentsStore.error)
const total = computed(() => documentsStore.total)
const limit = computed(() => documentsStore.limit)

const filteredDocuments = computed(() => {
  if (!searchQuery.value.trim()) {
    return documents.value
  }
  const query = searchQuery.value.toLowerCase()
  return documents.value.filter(
    doc =>
      doc.title.toLowerCase().includes(query) ||
      doc.content.toLowerCase().includes(query) ||
      doc.tags.some(tag => tag.toLowerCase().includes(query))
  )
})

const currentPage = computed(() => pagination.currentPage.value)
const totalPages = computed(() => {
  if (!total.value) return 0
  return Math.ceil(total.value / limit.value)
})

onMounted(() => {
  loadDocuments()
})

function loadDocuments() {
  documentsStore.loadDocuments({
    limit: limit.value,
    offset: pagination.offset.value
  })
}

function handleRefresh() {
  loadDocuments()
}

function handleView(document: KBDocument) {
  documentsStore.loadDocument(document.doc_id)
  // TODO: Navigate to document detail view
}

function handleEdit(document: KBDocument) {
  editingDocument.value = document
}

function handleDelete(document: KBDocument) {
  documentToDelete.value = document
}

async function confirmDelete() {
  if (!documentToDelete.value) return
  const success = await documentsStore.deleteDocument(documentToDelete.value.doc_id)
  if (success) {
    documentToDelete.value = null
    loadDocuments()
  }
}

function handleFormSubmit(data: any) {
  if (editingDocument.value) {
    documentsStore.updateDocument(editingDocument.value.doc_id, data).then(() => {
      closeForm()
      loadDocuments()
    })
  } else {
    documentsStore.createDocument(data).then(() => {
      closeForm()
      loadDocuments()
    })
  }
}

function closeForm() {
  showCreateForm.value = false
  editingDocument.value = null
}

function clearError() {
  documentsStore.error = null
}

function prevPage() {
  pagination.prevPage()
  loadDocuments()
}

function nextPage() {
  pagination.nextPage()
  loadDocuments()
}

function goToPage(page: number) {
  pagination.goToPage(page)
  loadDocuments()
}
</script>
