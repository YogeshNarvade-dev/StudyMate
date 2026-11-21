import axios from 'axios'

export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  try {
    const session = JSON.parse(localStorage.getItem('studymate-session') || 'null')
    if (session?.token) config.headers.Authorization = `Bearer ${session.token}`
  } catch {
    localStorage.removeItem('studymate-session')
  }
  return config
})

export function messageFrom(error) {
  return error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.'
}
