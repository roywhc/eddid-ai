<template>
  <Card variant="default" padding="md">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">System Health</h3>
        <span
          :class="[
            'px-3 py-1 text-sm font-medium rounded',
            statusClasses[health.status] || 'bg-gray-100 text-gray-800'
          ]"
        >
          {{ health.status.toUpperCase() }}
        </span>
      </div>
    </template>

    <div class="space-y-3">
      <div class="text-sm">
        <span class="font-medium">Version:</span> {{ health.version }}
      </div>
      <div class="text-sm">
        <span class="font-medium">Last Check:</span> {{ formatDate(health.timestamp) }}
      </div>
      <div v-if="Object.keys(health.components).length > 0">
        <h4 class="text-sm font-medium mb-2">Components:</h4>
        <ComponentStatus
          v-for="(status, component) in health.components"
          :key="component"
          :component="component"
          :status="status"
        />
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from '../common/Card.vue'
import ComponentStatus from './ComponentStatus.vue'
import { formatDate } from '@/utils/formatters'
import type { SystemHealth } from '@/types/models.types'

interface Props {
  health: SystemHealth
}

defineProps<Props>()

const statusClasses: Record<string, string> = {
  healthy: 'bg-green-100 text-green-800',
  degraded: 'bg-yellow-100 text-yellow-800',
  unhealthy: 'bg-red-100 text-red-800'
}
</script>
