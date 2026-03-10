import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

const client = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.response.use(
  (res) => res,
  (error) => {
    // 404s are handled gracefully per-page; only toast unexpected errors
    if (error.response?.status !== 404) {
      const message =
        error.response?.data?.message || error.message || 'An unexpected error occurred'
      toast.error(message)
    }
    return Promise.reject(error)
  }
)

export default client
