import axios from 'axios'
import type { VectorStoreStats, VectorStoreHealth } from '@/types/api.types'

export { type VectorStoreStats, type VectorStoreHealth }

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export const vectorStoreService = {
  /**
   * Get vector store statistics
   */
  async getStats(): Promise<VectorStoreStats> {
    const response = await axios.get(`${API_BASE_URL}/kb/vector-store/stats`)
    return response.data
  },

  /**
   * Get vector store health status
   */
  async getHealth(): Promise<VectorStoreHealth> {
    const response = await axios.get(`${API_BASE_URL}/kb/vector-store/health`)
    return response.data
  }
}
