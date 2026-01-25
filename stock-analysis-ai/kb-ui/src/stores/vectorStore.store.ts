import { defineStore } from 'pinia'
import { ref } from 'vue'
import { vectorStoreService, type VectorStoreStats, type VectorStoreHealth } from '@/services/vectorStore.service'

export const useVectorStoreStore = defineStore('vectorStore', () => {
  const stats = ref<VectorStoreStats | null>(null)
  const health = ref<VectorStoreHealth | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Load vector store statistics
   */
  async function loadStats() {
    isLoading.value = true
    error.value = null

    try {
      stats.value = await vectorStoreService.getStats()
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.message || 'Failed to load vector store statistics'
      stats.value = null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load vector store health status
   */
  async function loadHealth() {
    isLoading.value = true
    error.value = null

    try {
      health.value = await vectorStoreService.getHealth()
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.message || 'Failed to load vector store health'
      health.value = {
        status: 'error',
        available: false,
        error: err.response?.data?.detail || err.message
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Refresh all vector store data
   */
  async function refresh() {
    await Promise.all([loadStats(), loadHealth()])
  }

  return {
    stats,
    health,
    isLoading,
    error,
    loadStats,
    loadHealth,
    refresh
  }
})
