import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Index',
    component: () => import('../views/IndexView.vue')
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('../views/ChatView.vue')
  },
  {
    path: '/documents',
    name: 'Documents',
    component: () => import('../views/DocumentsView.vue')
  },
  {
    path: '/candidates',
    name: 'Candidates',
    component: () => import('../views/CandidatesView.vue')
  },
  {
    path: '/monitoring',
    name: 'Monitoring',
    component: () => import('../views/MonitoringView.vue')
  },
  {
    path: '/vector-store',
    name: 'VectorStore',
    component: () => import('../views/VectorStoreView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
