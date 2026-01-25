import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { candidatesService, type KBCandidate } from '@/services/candidates.service'
import type { CandidateApproveRequest, CandidateRejectRequest, CandidateModifyRequest } from '@/types/api.types'

export const useCandidatesStore = defineStore('candidates', () => {
  const candidates = ref<KBCandidate[]>([])
  const currentCandidate = ref<KBCandidate | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const statusFilter = ref<'pending' | 'approved' | 'rejected' | 'modified' | null>(null)
  const kbIdFilter = ref<string | null>(null)

  /**
   * Load candidates list
   */
  async function loadCandidates(params?: {
    status?: 'pending' | 'approved' | 'rejected' | 'modified'
    kb_id?: string
  }) {
    isLoading.value = true
    error.value = null

    try {
      const response = await candidatesService.listCandidates({
        status: params?.status || statusFilter.value || undefined,
        kb_id: params?.kb_id || kbIdFilter.value || undefined
      })
      candidates.value = response
    } catch (err: any) {
      error.value = err.userMessage || err.message || 'Failed to load candidates'
      candidates.value = []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load a single candidate
   */
  async function loadCandidate(candidateId: string) {
    isLoading.value = true
    error.value = null

    try {
      currentCandidate.value = await candidatesService.getCandidate(candidateId)
    } catch (err: any) {
      error.value = err.userMessage || err.message || 'Failed to load candidate'
      currentCandidate.value = null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Approve a candidate
   */
  async function approveCandidate(candidateId: string, data: CandidateApproveRequest): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      await candidatesService.approveCandidate(candidateId, data)
      await loadCandidates() // Refresh list
      return true
    } catch (err: any) {
      error.value = err.userMessage || err.message || 'Failed to approve candidate'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Reject a candidate
   */
  async function rejectCandidate(candidateId: string, data: CandidateRejectRequest): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      await candidatesService.rejectCandidate(candidateId, data)
      await loadCandidates() // Refresh list
      return true
    } catch (err: any) {
      error.value = err.userMessage || err.message || 'Failed to reject candidate'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Modify and approve a candidate
   */
  async function modifyAndApproveCandidate(
    candidateId: string,
    data: CandidateModifyRequest
  ): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      await candidatesService.modifyAndApproveCandidate(candidateId, data)
      await loadCandidates() // Refresh list
      return true
    } catch (err: any) {
      error.value = err.userMessage || err.message || 'Failed to modify and approve candidate'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Re-import a candidate (re-approve to create a new document)
   */
  async function reimportCandidate(candidateId: string, data: CandidateApproveRequest): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      console.log('Store: reimportCandidate called with:', { candidateId, data })
      const result = await candidatesService.reimportCandidate(candidateId, data)
      console.log('Store: reimportCandidate result:', result)
      await loadCandidates() // Refresh list
      return true
    } catch (err: any) {
      console.error('Store: reimportCandidate error:', err)
      const errorMessage = err.response?.data?.detail || err.userMessage || err.message || 'Failed to re-import candidate'
      error.value = errorMessage
      console.error('Store: Error message:', errorMessage)
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Filtered candidates
   */
  const filteredCandidates = computed(() => {
    let filtered = candidates.value

    if (statusFilter.value) {
      filtered = filtered.filter(c => c.status === statusFilter.value)
    }

    if (kbIdFilter.value) {
      filtered = filtered.filter(c => c.suggested_kb_id === kbIdFilter.value)
    }

    return filtered
  })

  /**
   * Set status filter
   */
  function setStatusFilter(status: 'pending' | 'approved' | 'rejected' | 'modified' | null) {
    statusFilter.value = status
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
    statusFilter.value = null
    kbIdFilter.value = null
  }

  return {
    candidates: computed(() => candidates.value),
    currentCandidate: computed(() => currentCandidate.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    statusFilter: computed(() => statusFilter.value),
    filteredCandidates,
    loadCandidates,
    loadCandidate,
    approveCandidate,
    rejectCandidate,
    modifyAndApproveCandidate,
    reimportCandidate,
    setStatusFilter,
    setKbIdFilter,
    clearFilters
  }
})
