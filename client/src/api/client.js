import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('legal_summarizer_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('legal_summarizer_token')
      window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

export default client
