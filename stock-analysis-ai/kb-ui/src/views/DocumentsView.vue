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

    <!-- View Document Dialog -->
    <div
      v-if="viewingDocument"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold">{{ viewingDocument.title }}</h2>
            <button class="text-gray-400 hover:text-gray-600 text-2xl" @click="closeViewDialog">✕</button>
          </div>
          
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-semibold text-gray-600">Document ID:</span>
                <span class="ml-2 font-mono text-xs">{{ viewingDocument.doc_id }}</span>
              </div>
              <div>
                <span class="font-semibold text-gray-600">Version:</span>
                <span class="ml-2">{{ viewingDocument.version }}</span>
              </div>
              <div>
                <span class="font-semibold text-gray-600">Type:</span>
                <span class="ml-2">{{ viewingDocument.doc_type }}</span>
              </div>
              <div>
                <span class="font-semibold text-gray-600">Status:</span>
                <span class="ml-2 capitalize">{{ viewingDocument.status }}</span>
              </div>
              <div>
                <span class="font-semibold text-gray-600">Created:</span>
                <span class="ml-2">{{ new Date(viewingDocument.created_at).toLocaleString() }}</span>
              </div>
              <div>
                <span class="font-semibold text-gray-600">Updated:</span>
                <span class="ml-2">{{ new Date(viewingDocument.updated_at).toLocaleString() }}</span>
              </div>
            </div>

            <!-- Vector Store Status -->
            <div class="p-4 bg-gray-50 rounded border">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-gray-600">Vector Store Status:</span>
                  <div
                    class="w-3 h-3 rounded-full"
                    :class="isInVectorStore ? 'bg-green-500' : 'bg-gray-400'"
                  ></div>
                  <span class="text-sm font-medium" :class="isInVectorStore ? 'text-green-700' : 'text-gray-600'">
                    {{ isInVectorStore ? 'Indexed' : 'Not Indexed' }}
                  </span>
                </div>
                <div v-if="isInVectorStore && viewingDocumentChunks" class="text-sm text-gray-600">
                  {{ viewingDocumentChunks }} chunk{{ viewingDocumentChunks !== 1 ? 's' : '' }}
                </div>
              </div>
              <div class="flex gap-2 mt-3">
                <Button
                  v-if="!isInVectorStore"
                  variant="primary"
                  size="sm"
                  @click="handleAddToVectorStore"
                  :disabled="isLoading || !viewingDocument"
                >
                  Add to Vector Store
                </Button>
                <Button
                  v-if="isInVectorStore"
                  variant="outline"
                  size="sm"
                  @click="handleRemoveFromVectorStore"
                  :disabled="isLoading || !viewingDocument"
                >
                  Remove from Vector Store
                </Button>
                <Button
                  v-if="isInVectorStore"
                  variant="outline"
                  size="sm"
                  @click="handleReindexInView"
                  :disabled="isLoading || !viewingDocument"
                >
                  Re-index
                </Button>
              </div>
            </div>

            <div v-if="viewingDocument.tags && viewingDocument.tags.length > 0">
              <span class="font-semibold text-gray-600">Tags:</span>
              <div class="flex flex-wrap gap-2 mt-1">
                <span
                  v-for="tag in viewingDocument.tags"
                  :key="tag"
                  class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                >
                  {{ tag }}
                </span>
              </div>
            </div>

            <div>
              <span class="font-semibold text-gray-600">Content:</span>
              <div class="mt-2 p-4 bg-gray-50 rounded border max-h-96 overflow-y-auto">
                <pre class="whitespace-pre-wrap text-sm">{{ viewingDocument.content || documentsStore.currentDocument?.content || 'Loading...' }}</pre>
              </div>
            </div>

            <div class="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" @click="closeViewDialog">Close</Button>
              <Button variant="primary" @click="() => { editingDocument = viewingDocument; viewingDocument = null }">
                Edit
              </Button>
            </div>
          </div>
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
import { ref, computed, onMounted, watch } from 'vue'
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
const viewingDocument = ref<KBDocument | null>(null)
const documentToDelete = ref<KBDocument | null>(null)
const searchQuery = ref('')

const documents = computed(() => documentsStore.documents)
const isLoading = computed(() => documentsStore.isLoading)
const error = computed(() => documentsStore.error)
const total = computed(() => documentsStore.total)
const limit = computed(() => documentsStore.limit)

// Computed properties for vector store status
const viewingDocumentChunks = computed(() => {
  // Check current document first (most up-to-date)
  if (documentsStore.currentDocument && 
      documentsStore.currentDocument.doc_id === viewingDocument.value?.doc_id) {
    return documentsStore.currentDocument.chunks || 0
  }
  // Fall back to viewing document
  if (viewingDocument.value) {
    return viewingDocument.value.chunks || 0
  }
  return 0
})

const isInVectorStore = computed(() => {
  return viewingDocumentChunks.value > 0
})

// Watch for current document updates to sync with view dialog
watch(() => documentsStore.currentDocument, (newDoc) => {
  if (newDoc && viewingDocument.value && newDoc.doc_id === viewingDocument.value.doc_id) {
    viewingDocument.value = newDoc
  }
})

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

async function handleView(document: KBDocument) {
  viewingDocument.value = document
  // Load full document details if not already loaded
  if (!documentsStore.currentDocument || documentsStore.currentDocument.doc_id !== document.doc_id) {
    await documentsStore.loadDocument(document.doc_id)
    // Update viewing document with full details
    if (documentsStore.currentDocument) {
      viewingDocument.value = documentsStore.currentDocument
    }
  } else {
    viewingDocument.value = documentsStore.currentDocument
  }
}

function closeViewDialog() {
  viewingDocument.value = null
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

async function handleAddToVectorStore() {
  if (!viewingDocument.value) return
  
  const success = await documentsStore.reindexDocument(viewingDocument.value.doc_id)
  if (success) {
    // Reload document to get updated chunk count
    await documentsStore.loadDocument(viewingDocument.value.doc_id)
    if (documentsStore.currentDocument) {
      viewingDocument.value = documentsStore.currentDocument
    }
  }
}

async function handleRemoveFromVectorStore() {
  if (!viewingDocument.value) return
  
  if (!confirm(`Are you sure you want to remove "${viewingDocument.value.title}" from the vector store? This will remove it from semantic search but keep the document.`)) {
    return
  }
  
  const success = await documentsStore.removeFromVectorStore(viewingDocument.value.doc_id)
  if (success) {
    // Reload document to get updated chunk count
    await documentsStore.loadDocument(viewingDocument.value.doc_id)
    if (documentsStore.currentDocument) {
      viewingDocument.value = documentsStore.currentDocument
    }
  }
}

async function handleReindexInView() {
  if (!viewingDocument.value) return
  
  const success = await documentsStore.reindexDocument(viewingDocument.value.doc_id)
  if (success) {
    // Reload document to get updated chunk count
    await documentsStore.loadDocument(viewingDocument.value.doc_id)
    if (documentsStore.currentDocument) {
      viewingDocument.value = documentsStore.currentDocument
    }
  }
}
</script>
