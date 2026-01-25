<template>
  <div class="candidates-view p-6">
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold">Candidate Review</h1>
          <p class="text-gray-600 mt-1">Review and approve candidate entries</p>
        </div>
        <Button variant="outline" @click="handleRefresh">
          Refresh
        </Button>
      </div>

      <div class="flex gap-4 mb-4">
        <StatusFilter
          v-model="statusFilter"
          :statuses="['pending', 'approved', 'rejected', 'modified']"
          class="w-48"
        />
      </div>
    </div>

    <LoadingIndicator v-if="isLoading" :visible="true" message="Loading candidates..." />

    <div v-if="error" class="mb-4 p-4 bg-red-50 border-l-4 border-red-500">
      <div class="flex items-center justify-between">
        <span class="text-red-600">{{ error }}</span>
        <Button variant="outline" size="sm" @click="clearError">Dismiss</Button>
      </div>
    </div>

    <CandidateList
      :candidates="filteredCandidates"
      :is-loading="isLoading"
      @review="handleReview"
      @reimport="handleReimport"
      @delete-document="handleDeleteDocument"
    />

    <!-- Review Dialog -->
    <CandidateReviewDialog
      :visible="reviewDialogVisible"
      :candidate="selectedCandidate"
      :loading="isLoading"
      @close="closeReviewDialog"
      @approve="handleApprove"
      @reject="handleReject"
      @modify-and-approve="handleModifyAndApprove"
    />

    <!-- Toast Notification -->
    <Toast
      :visible="toast.visible"
      :type="toast.type"
      :message="toast.message"
      :description="toast.description"
      :action="toast.action"
      @close="toast.visible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCandidatesStore } from '@/stores/candidates.store'
import { useDocumentsStore } from '@/stores/documents.store'
import CandidateList from '@/components/kb/CandidateList.vue'
import CandidateReviewDialog from '@/components/kb/CandidateReviewDialog.vue'
import StatusFilter from '@/components/common/StatusFilter.vue'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import Button from '@/components/common/Button.vue'
import Toast from '@/components/common/Toast.vue'
import type { KBCandidate } from '@/services/candidates.service'

const router = useRouter()
const candidatesStore = useCandidatesStore()
const documentsStore = useDocumentsStore()

// #region agent log
fetch('http://127.0.0.1:7242/ingest/c2c9722b-6ba2-48a8-bc20-c2f8afb1843e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CandidatesView.vue:77',message:'Store initialization check',data:{storeKeys:Object.keys(candidatesStore),hasReimport:typeof candidatesStore.reimportCandidate,allMethods:Object.keys(candidatesStore).filter(k=>typeof candidatesStore[k]==='function')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

const reviewDialogVisible = ref(false)
const selectedCandidate = ref<KBCandidate | null>(null)
const statusFilter = ref('')
const toast = ref<{
  visible: boolean
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  description?: string
  action?: { label: string; handler: () => void }
}>({
  visible: false,
  type: 'info',
  message: ''
})

const candidates = computed(() => candidatesStore.candidates)
const isLoading = computed(() => candidatesStore.isLoading)
const error = computed(() => candidatesStore.error)
const filteredCandidates = computed(() => candidatesStore.filteredCandidates)

onMounted(() => {
  loadCandidates()
})

watch(statusFilter, (newValue) => {
  candidatesStore.setStatusFilter(newValue || null)
  loadCandidates()
})

function loadCandidates() {
  candidatesStore.loadCandidates({
    status: statusFilter.value || undefined
  })
}

function handleRefresh() {
  loadCandidates()
}

function handleReview(candidate: KBCandidate) {
  selectedCandidate.value = candidate
  reviewDialogVisible.value = true
}

function closeReviewDialog() {
  reviewDialogVisible.value = false
  selectedCandidate.value = null
}

async function handleApprove(data: { reviewer: string; notes?: string | null }) {
  if (!selectedCandidate.value) return
  const success = await candidatesStore.approveCandidate(selectedCandidate.value.candidate_id, data)
  if (success) {
    closeReviewDialog()
    loadCandidates()
    // Show success toast with link to documents
    toast.value = {
      visible: true,
      type: 'success',
      message: 'Candidate approved successfully!',
      description: 'The candidate has been converted to a document.',
      action: {
        label: 'View Documents',
        handler: () => {
          router.push('/documents')
          toast.value.visible = false
        }
      }
    }
    // Auto-hide after 5 seconds
    setTimeout(() => {
      toast.value.visible = false
    }, 5000)
  } else {
    toast.value = {
      visible: true,
      type: 'error',
      message: 'Failed to approve candidate',
      description: candidatesStore.error || 'An error occurred'
    }
    setTimeout(() => {
      toast.value.visible = false
    }, 5000)
  }
}

async function handleReject(data: { reviewer: string; notes?: string | null }) {
  if (!selectedCandidate.value) return
  const success = await candidatesStore.rejectCandidate(selectedCandidate.value.candidate_id, data)
  if (success) {
    closeReviewDialog()
    loadCandidates()
  }
}

async function handleModifyAndApprove(data: {
  reviewer: string
  notes?: string | null
  document: any
}) {
  if (!selectedCandidate.value) return
  const success = await candidatesStore.modifyAndApproveCandidate(
    selectedCandidate.value.candidate_id,
    data
  )
  if (success) {
    closeReviewDialog()
    loadCandidates()
    // Show success toast with link to documents
    toast.value = {
      visible: true,
      type: 'success',
      message: 'Candidate modified and approved!',
      description: 'The candidate has been converted to a document.',
      action: {
        label: 'View Documents',
        handler: () => {
          router.push('/documents')
          toast.value.visible = false
        }
      }
    }
    // Auto-hide after 5 seconds
    setTimeout(() => {
      toast.value.visible = false
    }, 5000)
  } else {
    toast.value = {
      visible: true,
      type: 'error',
      message: 'Failed to modify and approve candidate',
      description: candidatesStore.error || 'An error occurred'
    }
    setTimeout(() => {
      toast.value.visible = false
    }, 5000)
  }
}

function clearError() {
  candidatesStore.error = null
}

async function handleReimport(candidate: KBCandidate) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c2c9722b-6ba2-48a8-bc20-c2f8afb1843e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CandidatesView.vue:223',message:'handleReimport entry',data:{candidateId:candidate?.candidate_id,storeKeys:Object.keys(candidatesStore),hasReimport:typeof candidatesStore.reimportCandidate},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  if (!candidate) {
    console.error('handleReimport: candidate is null')
    return
  }
  
  console.log('handleReimport called for candidate:', candidate.candidate_id)
  console.log('Store object keys:', Object.keys(candidatesStore))
  console.log('reimportCandidate type:', typeof candidatesStore.reimportCandidate)
  
  // Show confirmation dialog
  if (!confirm(`Re-import candidate "${candidate.title}"? This will create a new document.`)) {
    return
  }
  
  try {
    console.log('Calling reimportCandidate with:', {
      candidateId: candidate.candidate_id,
      reviewer: 'admin',
      notes: 'Re-imported from candidate view'
    })
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c2c9722b-6ba2-48a8-bc20-c2f8afb1843e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CandidatesView.vue:243',message:'Before calling reimportCandidate',data:{candidateId:candidate.candidate_id,storeType:typeof candidatesStore,reimportType:typeof candidatesStore.reimportCandidate},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (typeof candidatesStore.reimportCandidate !== 'function') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c2c9722b-6ba2-48a8-bc20-c2f8afb1843e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CandidatesView.vue:248',message:'reimportCandidate is not a function',data:{storeKeys:Object.keys(candidatesStore),storeValues:Object.values(candidatesStore).map(v=>typeof v)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      throw new Error('reimportCandidate is not a function. Available methods: ' + Object.keys(candidatesStore).join(', '))
    }
    
    const success = await candidatesStore.reimportCandidate(candidate.candidate_id, {
      reviewer: 'admin', // TODO: Get from auth context
      notes: 'Re-imported from candidate view'
    })
    
    console.log('reimportCandidate result:', success)
    
    if (success) {
      await loadCandidates() // Refresh list
      toast.value = {
        visible: true,
        type: 'success',
        message: 'Candidate re-imported successfully!',
        description: 'A new document has been created.',
        action: {
          label: 'View Documents',
          handler: () => {
            router.push('/documents')
            toast.value.visible = false
          }
        }
      }
      setTimeout(() => {
        toast.value.visible = false
      }, 5000)
    } else {
      const errorMsg = candidatesStore.error || 'An error occurred'
      console.error('Reimport failed:', errorMsg)
      toast.value = {
        visible: true,
        type: 'error',
        message: 'Failed to re-import candidate',
        description: errorMsg
      }
      setTimeout(() => {
        toast.value.visible = false
      }, 5000)
    }
  } catch (err: any) {
    console.error('Error in handleReimport:', err)
    toast.value = {
      visible: true,
      type: 'error',
      message: 'Failed to re-import candidate',
      description: err.message || err.toString() || 'An unexpected error occurred'
    }
    setTimeout(() => {
      toast.value.visible = false
    }, 5000)
  }
}

async function handleDeleteDocument(docId: string) {
  if (!docId) return
  
  // Show confirmation dialog
  if (!confirm(`Delete document ${docId}? This action cannot be undone.`)) {
    return
  }
  
  const success = await documentsStore.deleteDocument(docId)
  
  if (success) {
    loadCandidates() // Refresh to update candidate doc_id link
    toast.value = {
      visible: true,
      type: 'success',
      message: 'Document deleted successfully!',
      description: 'The document has been removed from the knowledge base.'
    }
    setTimeout(() => {
      toast.value.visible = false
    }, 5000)
  } else {
    toast.value = {
      visible: true,
      type: 'error',
      message: 'Failed to delete document',
      description: documentsStore.error || 'An error occurred'
    }
    setTimeout(() => {
      toast.value.visible = false
    }, 5000)
  }
}
</script>
