import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SESSION_STORAGE_KEY, SESSION_PREFIX } from '@/utils/constants'

export const useSessionStore = defineStore('session', () => {
  const sessionId = ref<string | null>(null)
  const persistedSessions = ref<string[]>([])

  function loadSessionFromStorage() {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY)
    if (stored) {
      sessionId.value = stored
    }
    
    // Load all persisted session IDs
    const allKeys = Object.keys(localStorage)
    persistedSessions.value = allKeys
      .filter(key => key.startsWith(SESSION_PREFIX))
      .map(key => key.replace(SESSION_PREFIX, ''))
  }

  function saveSessionToStorage(id: string) {
    sessionId.value = id
    localStorage.setItem(SESSION_STORAGE_KEY, id)
    
    if (!persistedSessions.value.includes(id)) {
      persistedSessions.value.push(id)
    }
  }

  function clearSessionFromStorage(id: string) {
    localStorage.removeItem(`${SESSION_PREFIX}${id}`)
    persistedSessions.value = persistedSessions.value.filter(sid => sid !== id)
    
    if (sessionId.value === id) {
      sessionId.value = null
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }

  function getAllSessions(): string[] {
    return persistedSessions.value
  }

  return {
    sessionId,
    persistedSessions,
    loadSessionFromStorage,
    saveSessionToStorage,
    clearSessionFromStorage,
    getAllSessions
  }
})
