<template>
  <Card variant="default" padding="md">
    <template #header>
      <h3 class="text-lg font-semibold">Metrics Summary</h3>
    </template>

    <div v-if="!metrics.enabled" class="text-sm text-gray-500">
      Metrics are disabled
    </div>

    <div v-else class="space-y-4">
      <div v-if="metrics.counters && Object.keys(metrics.counters).length > 0">
        <h4 class="text-sm font-medium mb-2">Counters:</h4>
        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="(value, key) in metrics.counters"
            :key="key"
            class="p-2 bg-gray-50 rounded"
          >
            <div class="text-xs text-gray-600">{{ key }}</div>
            <div class="text-lg font-semibold">{{ value }}</div>
          </div>
        </div>
      </div>

      <div v-if="metrics.gauges && Object.keys(metrics.gauges).length > 0">
        <h4 class="text-sm font-medium mb-2">Gauges:</h4>
        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="(value, key) in metrics.gauges"
            :key="key"
            class="p-2 bg-gray-50 rounded"
          >
            <div class="text-xs text-gray-600">{{ key }}</div>
            <div class="text-lg font-semibold">{{ value }}</div>
          </div>
        </div>
      </div>

      <div v-if="metrics.error" class="text-sm text-red-600">
        Error: {{ metrics.error }}
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import Card from '../common/Card.vue'
import type { MetricsSummary } from '@/types/api.types'

interface Props {
  metrics: MetricsSummary
}

defineProps<Props>()
</script>
