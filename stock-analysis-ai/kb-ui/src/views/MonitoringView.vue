<template>
  <div class="monitoring-view p-6">
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">System Monitoring</h1>
          <p class="text-gray-600 mt-1">Monitor system health and metrics</p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" @click="handleRefresh">
            Refresh
          </Button>
          <Button
            variant="outline"
            @click="autoRefreshEnabled = !autoRefreshEnabled"
          >
            {{ autoRefreshEnabled ? 'Disable' : 'Enable' }} Auto-Refresh
          </Button>
        </div>
      </div>
    </div>

    <LoadingIndicator v-if="isLoading" :visible="true" message="Loading monitoring data..." />

    <div v-if="error" class="mb-4 p-4 bg-red-50 border-l-4 border-red-500">
      <div class="flex items-center justify-between">
        <span class="text-red-600">{{ error }}</span>
        <Button variant="outline" size="sm" @click="clearError">Dismiss</Button>
      </div>
    </div>

    <div v-if="health && metrics" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <HealthStatus :health="health" />
      <MetricsCard :metrics="metrics" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { healthService } from '@/services/health.service'
import HealthStatus from '@/components/monitoring/HealthStatus.vue'
import MetricsCard from '@/components/monitoring/MetricsCard.vue'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import Button from '@/components/common/Button.vue'
import type { SystemHealth } from '@/types/models.types'
import type { MetricsSummary } from '@/types/api.types'

const health = ref<SystemHealth | null>(null)
const metrics = ref<MetricsSummary | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const autoRefreshEnabled = ref(false)
let refreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

async function loadData() {
  isLoading.value = true
  error.value = null

  try {
    const [healthData, metricsData] = await Promise.all([
      healthService.getHealth(),
      healthService.getMetricsSummary()
    ])

    health.value = {
      status: healthData.status as 'healthy' | 'degraded' | 'unhealthy',
      timestamp: new Date(healthData.timestamp),
      components: healthData.components,
      version: healthData.version
    }

    metrics.value = metricsData
  } catch (err: any) {
    error.value = err.userMessage || err.message || 'Failed to load monitoring data'
  } finally {
    isLoading.value = false
  }
}

function handleRefresh() {
  loadData()
}

watch(autoRefreshEnabled, (enabled) => {
  if (enabled) {
    refreshInterval = setInterval(() => {
      loadData()
    }, 30000) // Refresh every 30 seconds
  } else {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }
})

function clearError() {
  error.value = null
}
</script>

