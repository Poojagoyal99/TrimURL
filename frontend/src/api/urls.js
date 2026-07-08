import api from './client'

export const shortenUrl   = (data) => api.post('/api/shorten/', data)
export const listUrls     = ()     => api.get('/api/urls/')
export const deleteUrl    = (code) => api.delete(`/api/urls/${code}/`)
export const getStats     = (code) => api.get(`/api/stats/${code}/`)
export const getAnalytics = (code) => api.get(`/api/analytics/${code}/`)
