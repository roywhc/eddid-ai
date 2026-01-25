import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 seconds
})

// Request interceptor
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Add auth token if available in the future
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    // Handle errors globally
    console.error('API Error:', error)
    
    // Transform error for user-friendly display
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.detail || error.response.data?.message || 'An error occurred'
      error.userMessage = message
    } else if (error.request) {
      // Request made but no response received
      error.userMessage = 'Network error. Please check your connection.'
    } else {
      // Error setting up request
      error.userMessage = 'An unexpected error occurred.'
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
