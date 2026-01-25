<template>
  <div class="index-view min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
    <div class="container mx-auto px-4 py-12">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-5xl font-bold text-gray-900 mb-4">
          Agentic Knowledge Base System
        </h1>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          AI-powered knowledge management with intelligent search, document management, and automated content curation
        </p>
      </div>

      <!-- Feature Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card variant="elevated" padding="lg" class="hover:shadow-xl transition-shadow cursor-pointer" @click="navigateTo('/chat')">
          <div class="text-center">
            <div class="text-4xl mb-4">💬</div>
            <h3 class="text-xl font-semibold mb-2">Chat Interface</h3>
            <p class="text-gray-600 text-sm">
              Ask questions and get AI-powered answers with citations from your knowledge base
            </p>
          </div>
        </Card>

        <Card variant="elevated" padding="lg" class="hover:shadow-xl transition-shadow cursor-pointer" @click="navigateTo('/documents')">
          <div class="text-center">
            <div class="text-4xl mb-4">📚</div>
            <h3 class="text-xl font-semibold mb-2">Document Management</h3>
            <p class="text-gray-600 text-sm">
              Create, edit, and manage knowledge base documents with full CRUD operations
            </p>
          </div>
        </Card>

        <Card variant="elevated" padding="lg" class="hover:shadow-xl transition-shadow cursor-pointer" @click="navigateTo('/candidates')">
          <div class="text-center">
            <div class="text-4xl mb-4">🔍</div>
            <h3 class="text-xl font-semibold mb-2">Candidate Review</h3>
            <p class="text-gray-600 text-sm">
              Review and approve automatically generated knowledge entries from external sources
            </p>
          </div>
        </Card>

        <Card variant="elevated" padding="lg" class="hover:shadow-xl transition-shadow cursor-pointer" @click="navigateTo('/monitoring')">
          <div class="text-center">
            <div class="text-4xl mb-4">📊</div>
            <h3 class="text-xl font-semibold mb-2">System Monitoring</h3>
            <p class="text-gray-600 text-sm">
              Monitor system health, metrics, and performance indicators in real-time
            </p>
          </div>
        </Card>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h2 class="text-2xl font-bold mb-6 text-center">Quick Actions</h2>
        <div class="flex flex-wrap justify-center gap-4">
          <Button variant="primary" size="lg" @click="navigateTo('/chat')">
            Start Chatting
          </Button>
          <Button variant="outline" size="lg" @click="navigateTo('/documents')">
            Manage Documents
          </Button>
          <Button variant="outline" size="lg" @click="navigateTo('/candidates')">
            Review Candidates
          </Button>
          <Button variant="outline" size="lg" @click="navigateTo('/monitoring')">
            View Monitoring
          </Button>
        </div>
      </div>

      <!-- System Status -->
      <div class="bg-white rounded-lg shadow-lg p-8">
        <h2 class="text-2xl font-bold mb-6 text-center">System Status</h2>
        <div v-if="healthLoading" class="text-center py-4">
          <LoadingIndicator :visible="true" message="Loading system status..." />
        </div>
        <div v-else-if="health" class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center">
            <div class="text-2xl font-semibold mb-2">System Health</div>
            <span
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium',
                healthStatusClass
              ]"
            >
              {{ health.status.toUpperCase() }}
            </span>
          </div>
          <div class="text-center">
            <div class="text-2xl font-semibold mb-2">Version</div>
            <div class="text-gray-600">{{ health.version }}</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-semibold mb-2">Components</div>
            <div class="text-gray-600">{{ componentCount }} active</div>
          </div>
        </div>
        <div v-else-if="healthError" class="text-center py-4 text-red-600">
          Unable to load system status
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { healthService } from '@/services/health.service'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import type { SystemHealth } from '@/types/models.types'

const router = useRouter()

const health = ref<SystemHealth | null>(null)
const healthLoading = ref(false)
const healthError = ref(false)

const healthStatusClass = computed(() => {
  if (!health.value) return 'bg-gray-100 text-gray-800'
  const status = health.value.status
  if (status === 'healthy') return 'bg-green-100 text-green-800'
  if (status === 'degraded') return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
})

const componentCount = computed(() => {
  return health.value ? Object.keys(health.value.components).length : 0
})

onMounted(() => {
  loadHealthStatus()
})

async function loadHealthStatus() {
  healthLoading.value = true
  healthError.value = false

  try {
    const healthData = await healthService.getHealth()
    health.value = {
      status: healthData.status as 'healthy' | 'degraded' | 'unhealthy',
      timestamp: new Date(healthData.timestamp),
      components: healthData.components,
      version: healthData.version
    }
  } catch (err) {
    healthError.value = true
    console.error('Failed to load health status:', err)
  } finally {
    healthLoading.value = false
  }
}

function navigateTo(path: string) {
  router.push(path)
}
</script>

<style scoped>
.index-view {
  min-height: 100vh;
}
</style>
