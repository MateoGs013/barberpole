// Cliente HTTP basado en axios.
// - baseURL: en desarrollo queda "/api" (relativa) y Vite hace proxy a
//   localhost:4000 (ver vite.config.js). En producción, si el backend vive en
//   otro dominio (ej: Render), definimos VITE_API_URL en el build de Vercel con
//   la URL completa de la API (ej: https://mi-api.onrender.com/api) y axios la usa.
//   Si VITE_API_URL no está seteada, cae al "/api" relativo de siempre.
// - Persistimos el token en localStorage para sobrevivir recargas.
// - Interceptor de request: agrega el header Authorization automáticamente
//   si hay token, así las funciones de api no tienen que preocuparse por eso.
// - Interceptor de response: si la API devuelve 401, borramos el token —
//   significa que está vencido o es inválido y hay que volver a loguear.

import axios from 'axios'

const CLAVE_TOKEN = 'peluqueria.token'

export const guardarToken = (token) => localStorage.setItem(CLAVE_TOKEN, token)
export const obtenerToken = () => localStorage.getItem(CLAVE_TOKEN)
export const borrarToken = () => localStorage.removeItem(CLAVE_TOKEN)

export const http = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

http.interceptors.request.use((config) => {
  const token = obtenerToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (resp) => resp,
  (error) => {
    if (error.response?.status === 401) {
      borrarToken()
    }
    return Promise.reject(error)
  }
)
