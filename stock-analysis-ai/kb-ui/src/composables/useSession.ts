import { onMounted } from 'vue'
import { useSessionStore } from '@/stores/session.store'
import { useChatStore } from '@/stores/chat.store'

/**
 * Composable for managing chat sessions
 */
export function useSession() {
  const sessionStore = useSessionStore()
  const chatStore = useChatStore()

  onMounted(() => {
    // Load session from storage on mount
    sessionStore.loadSessionFromStorage()
    
    if (sessionStore.sessionId) {
      chatStore.loadSession(sessionStore.sessionId)
    }
  })

  return {
    sessionId: sessionStore.sessionId,
    loadSession: (sessionId: string) => {
      sessionStore.saveSessionToStorage(sessionId)
      chatStore.loadSession(sessionId)
    },
    clearSession: () => {
      chatStore.clearSession()
    }
  }
}
