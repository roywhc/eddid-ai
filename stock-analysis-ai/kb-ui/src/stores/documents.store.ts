import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { documentsService, type KBDocument, type DocumentsListResponse } from '@/services/documents.service'
import { DEFAULT_PAGE_SIZE } from '@/utils/constants'

export const useDocumentsStore = defineStore('documents', () => {
  const documents = ref<KBDocument[]>([])
  const currentDocument = ref<KBDocument | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const total = ref<number | undefined>(undefined)
  const limit = ref(DEFAULT_PAGE_SIZE)
  const offset = ref(0)
  const searchQuery = ref('')
  const kbIdFilter = ref<string | null>(null)

  /**
   * Load documents list
   */
  async function loadDocuments(params?: { limit?: number; offset?: number; kb_id?: string }) {
    isLoading.value = true
    error.value = null

    try {
      const response: DocumentsListResponse = await documentsService.listDocuments({
        limit: params?.limit || limit.value,
        offset: params?.offset || offset.value,
        kb_id: params?.kb_id || kbIdFilter.value || undefined
      })

      documents.value = response.items
      total.value = response.total
      limit.value = response.limit
      offset.value = response.offset
    } catch (err: any) {
      error.value = err.userMessage || err.message || 'Failed to load documents'
      documents.value = []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load a single document
   */
  async function loadDocument(docId: string) {
    isLoading.value = true
    error.value = null

    try {
      currentDocument.value = await documentsService.getDocument(docId)
    } catch (err: any) {
      error.value = err.userMessage || err.message || 'Failed to load document'
      currentDocument.value = null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new document
   */
  async function createDocument(data: any): Promise<KBDocument | null> {
    isLoading.value = true
    error.value = null

    try {
      const document = await documentsService.createDocument(data)
      await loadDocuments() // Refresh list
      return document
    } catch (err: any) {
      error.value = err.userMessage || err.message || 'Failed to create document'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update a document
   */
  async function updateDocument(docId: string, data: any): Promise<KBDocument | null> {
    isLoading.value = true
    error.value = null

    try {
      const document = await documentsService.updateDocument(docId, data)
      await loadDocuments() // Refresh list
      if (currentDocument.value?.doc_id === docId) {
        currentDocument.value = document
      }
      return document
    } catch (err: any) {
      error.value = err.userMessage || err.message || 'Failed to update document'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete a document
   */
  async function deleteDocument(docId: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      await documentsService.deleteDocument(docId)
      await loadDocuments() // Refresh list
      if (currentDocument.value?.doc_id === docId) {
        currentDocument.value = null
      }
      return true
    } catch (err: any) {
      error.value = err.userMessage || err.message || 'Failed to delete document'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Filter documents by search query
   */
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

  /**
   * Set search query
   */
  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  /**
   * Set KB ID filter
   */
  function setKbIdFilter(kbId: string | null) {
    kbIdFilter.value = kbId
  }

  /**
   * Clear filters
   */
  function clearFilters() {
    searchQuery.value = ''
    kbIdFilter.value = null
  }

  return {
    documents: computed(() => documents.value),
    currentDocument: computed(() => currentDocument.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    total: computed(() => total.value),
    limit: computed(() => limit.value),
    offset: computed(() => offset.value),
    searchQuery: computed(() => searchQuery.value),
    filteredDocuments,
    loadDocuments,
    loadDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    setSearchQuery,
    setKbIdFilter,
    clearFilters
  }
})
