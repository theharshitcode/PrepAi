// src/lib/axios.js
import axios from 'axios'

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
    withCredentials: true
})

// Token automatically har request mein add karo
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// 401 pe automatically refresh karo
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            try {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {}, {
                    withCredentials: true
                })
                const newToken = res.data.token
                localStorage.setItem('token', newToken)
                error.config.headers.Authorization = `Bearer ${newToken}`
                return axios(error.config)
            } catch {
                localStorage.removeItem('token')
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export default api