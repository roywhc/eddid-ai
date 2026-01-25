import apiClient from './api/client'
import type { HealthStatus, MetricsSummary } from '@/types/api.types'

export const healthService = {
  /**
   * Get system health status
   */
  async getHealth(): Promise<HealthStatus> {
    const response = await apiClient.get<HealthStatus>('/health')
    return response.data
  },

  /**
   * Get metrics summary
   */
  async getMetricsSummary(): Promise<MetricsSummary> {
    const response = await apiClient.get<MetricsSummary>('/metrics/summary')
    return response.data
  },

  /**
   * Get Prometheus metrics
   */
  async getMetricsPrometheus(): Promise<string> {
    const response = await apiClient.get<string>('/metrics', {
      headers: { Accept: 'text/plain' }
    })
    return response.data
  }
}
