<template>
  <div class="vector-store-view p-6">
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold">Vector Store Management</h1>
          <p class="text-gray-600 mt-1">Monitor and manage the vector database</p>
        </div>
        <Button variant="outline" @click="handleRefresh" :disabled="isLoading">
          <span v-if="!isLoading">Refresh</span>
          <span v-else>Loading...</span>
        </Button>
      </div>
    </div>

    <LoadingIndicator v-if="isLoading && !stats && !health" :visible="true" message="Loading vector store information..." />

    <div v-if="error" class="mb-4 p-4 bg-red-50 border-l-4 border-red-500">
      <div class="flex items-center justify-between">
        <span class="text-red-600">{{ error }}</span>
        <Button variant="outline" size="sm" @click="clearError">Dismiss</Button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Health Status Card -->
      <Card>
        <template #header>
          <h2 class="text-xl font-semibold">Health Status</h2>
        </template>
        <div v-if="health" class="space-y-4">
          <div class="flex items-center gap-3">
            <div
              class="w-4 h-4 rounded-full"
              :class="{
                'bg-green-500': health.status === 'healthy',
                'bg-yellow-500': health.status === 'degraded',
                'bg-red-500': health.status === 'error' || health.status === 'not_initialized'
              }"
            ></div>
            <span class="font-medium capitalize">{{ health.status }}</span>
          </div>
          <div class="text-sm text-gray-600">
            <p><strong>Available:</strong> {{ health.available ? 'Yes' : 'No' }}</p>
            <p v-if="health.error" class="text-red-600 mt-2">{{ health.error }}</p>
          </div>
        </div>
        <div v-else class="text-gray-500">No health data available</div>
      </Card>

      <!-- Statistics Card -->
      <Card>
        <template #header>
          <h2 class="text-xl font-semibold">Statistics</h2>
        </template>
        <div v-if="stats" class="space-y-3">
          <div v-if="stats.error" class="text-red-600">
            <p><strong>Error:</strong> {{ stats.error }}</p>
          </div>
          <div v-else class="space-y-2">
            <div>
              <p class="text-sm text-gray-600">Total Chunks</p>
              <p class="text-2xl font-bold">
                {{ typeof stats.total_chunks === 'number' ? stats.total_chunks.toLocaleString() : stats.total_chunks || 'Unknown' }}
              </p>
            </div>
            <div v-if="stats.collection_name">
              <p class="text-sm text-gray-600">Collection Name</p>
              <p class="font-medium">{{ stats.collection_name }}</p>
            </div>
            <div v-if="stats.persist_directory">
              <p class="text-sm text-gray-600">Persist Directory</p>
              <p class="text-xs font-mono text-gray-500 break-all">{{ stats.persist_directory }}</p>
            </div>
            <div v-if="stats.type">
              <p class="text-sm text-gray-600">Type</p>
              <p class="font-medium capitalize">{{ stats.type }}</p>
            </div>
          </div>
        </div>
        <div v-else class="text-gray-500">No statistics available</div>
      </Card>
    </div>

    <!-- Document Management Section -->
    <Card class="mt-6">
      <template #header>
        <h2 class="text-xl font-semibold">Document Management</h2>
      </template>
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          Manage individual documents in the vector store. You can re-index documents that were created without vector embeddings,
          or remove documents from the vector store without deleting them.
        </p>
        
        <div class="flex gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">Document ID</label>
            <input
              v-model="documentId"
              type="text"
              placeholder="Enter document ID (e.g., doc_abc123)"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div class="flex gap-2">
          <Button
            variant="primary"
            @click="handleReindex"
            :disabled="!documentId || isLoading"
          >
            Re-index Document
          </Button>
          <Button
            variant="outline"
            @click="handleRemove"
            :disabled="!documentId || isLoading"
          >
            Remove from Vector Store
          </Button>
        </div>

        <div v-if="operationResult" class="p-3 rounded-md" :class="operationResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
          {{ operationResult.message }}
        </div>
      </div>
    </Card>

    <!-- Information Section -->
    <Card class="mt-6">
      <template #header>
        <h2 class="text-xl font-semibold">About Vector Store</h2>
      </template>
      <div class="space-y-2 text-sm text-gray-600">
        <p>
          The vector store is used to store and retrieve document chunks for semantic search.
          It enables the AI to find relevant information from your knowledge base when answering questions.
        </p>
        <p>
          <strong>Current Implementation:</strong> ChromaDB (local persistence)
        </p>
        <p>
          <strong>Note:</strong> The vector store is automatically initialized when the application starts.
          If you see "not_initialized" status, check the backend logs for initialization errors.
        </p>
        <p class="mt-2">
          <strong>Operations:</strong>
        </p>
        <ul class="list-disc list-inside ml-2 space-y-1">
          <li><strong>Re-index:</strong> Re-chunk and re-embed a document, replacing existing chunks in the vector store.</li>
          <li><strong>Remove:</strong> Remove a document's chunks from the vector store without deleting the document itself.</li>
        </ul>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useVectorStoreStore } from '@/stores/vectorStore.store'
import { useDocumentsStore } from '@/stores/documents.store'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'

const vectorStoreStore = useVectorStoreStore()
const documentsStore = useDocumentsStore()

const stats = computed(() => vectorStoreStore.stats)
const health = computed(() => vectorStoreStore.health)
const isLoading = computed(() => vectorStoreStore.isLoading || documentsStore.isLoading)
const error = computed(() => vectorStoreStore.error || documentsStore.error)

const documentId = ref('')
const operationResult = ref<{ success: boolean; message: string } | null>(null)

onMounted(async () => {
  await vectorStoreStore.refresh()
})

async function handleRefresh() {
  await vectorStoreStore.refresh()
  operationResult.value = null
}

function clearError() {
  vectorStoreStore.error = null
  documentsStore.error = null
}

async function handleReindex() {
  if (!documentId.value.trim()) {
    operationResult.value = { success: false, message: 'Please enter a document ID' }
    return
  }

  operationResult.value = null
  try {
    // Access the method directly from the store instance
    const reindexFn = documentsStore.reindexDocument
    if (typeof reindexFn !== 'function') {
      operationResult.value = { success: false, message: 'Re-index function not available. Please refresh the page.' }
      return
    }
    const success = await reindexFn(documentId.value.trim())
    
    if (success) {
      operationResult.value = { success: true, message: `Document ${documentId.value} successfully re-indexed` }
      documentId.value = ''
      await vectorStoreStore.refresh() // Refresh stats
    } else {
      operationResult.value = { success: false, message: documentsStore.error || 'Failed to re-index document' }
    }
  } catch (err: any) {
    operationResult.value = { success: false, message: err.message || 'Failed to re-index document' }
  }
}

async function handleRemove() {
  if (!documentId.value.trim()) {
    operationResult.value = { success: false, message: 'Please enter a document ID' }
    return
  }

  if (!confirm(`Are you sure you want to remove document ${documentId.value} from the vector store? This will remove it from semantic search but keep the document.`)) {
    return
  }

  operationResult.value = null
  try {
    // Access the method directly from the store instance
    const removeFn = documentsStore.removeFromVectorStore
    if (typeof removeFn !== 'function') {
      operationResult.value = { success: false, message: 'Remove function not available. Please refresh the page.' }
      return
    }
    const success = await removeFn(documentId.value.trim())
    
    if (success) {
      operationResult.value = { success: true, message: `Document ${documentId.value} removed from vector store` }
      documentId.value = ''
      await vectorStoreStore.refresh() // Refresh stats
    } else {
      operationResult.value = { success: false, message: documentsStore.error || 'Failed to remove document from vector store' }
    }
  } catch (err: any) {
    operationResult.value = { success: false, message: err.message || 'Failed to remove document from vector store' }
  }
}
</script>

<style scoped>
.vector-store-view {
  @apply max-w-7xl mx-auto;
}
</style>
