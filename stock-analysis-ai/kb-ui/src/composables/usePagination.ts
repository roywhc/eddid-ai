import { ref, computed } from 'vue'

export interface UsePaginationOptions {
  initialPage?: number
  pageSize?: number
  total?: number
}

export interface UsePaginationReturn {
  currentPage: ReturnType<typeof ref<number>>
  pageSize: ReturnType<typeof ref<number>>
  total: ReturnType<typeof ref<number | undefined>>
  offset: ReturnType<typeof computed<number>>
  hasNext: ReturnType<typeof computed<boolean>>
  hasPrev: ReturnType<typeof computed<boolean>>
  totalPages: ReturnType<typeof computed<number>>
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  reset: () => void
}

/**
 * Composable for handling pagination
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const { initialPage = 1, pageSize: initialPageSize = 50, total: initialTotal } = options

  const currentPage = ref(initialPage)
  const pageSize = ref(initialPageSize)
  const total = ref<number | undefined>(initialTotal)

  const offset = computed(() => (currentPage.value - 1) * pageSize.value)
  const totalPages = computed(() => {
    if (total.value === undefined) return 0
    return Math.ceil(total.value / pageSize.value)
  })
  const hasNext = computed(() => {
    if (total.value === undefined) return false
    return currentPage.value < totalPages.value
  })
  const hasPrev = computed(() => currentPage.value > 1)

  function goToPage(page: number) {
    if (page < 1) return
    if (total.value !== undefined && page > totalPages.value) return
    currentPage.value = page
  }

  function nextPage() {
    if (hasNext.value) {
      currentPage.value++
    }
  }

  function prevPage() {
    if (hasPrev.value) {
      currentPage.value--
    }
  }

  function reset() {
    currentPage.value = initialPage
    total.value = initialTotal
  }

  return {
    currentPage,
    pageSize,
    total,
    offset,
    hasNext,
    hasPrev,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    reset
  }
}
