// Capa de API para auth. Las vistas NO llaman a http directo, llaman a estas
// funciones. Así las vistas no saben de axios, headers ni rutas — solo del
// "qué" (registrar, login, etc.).

import { http, guardarToken, borrarToken } from './http.js'

export const registrarAPI = async ({ nombre, email, password }) => {
  const { data } = await http.post('/auth/registro', { nombre, email, password })
  guardarToken(data.token)
  return data
}

export const loginAPI = async ({ email, password }) => {
  const { data } = await http.post('/auth/login', { email, password })
  guardarToken(data.token)
  return data
}

export const yoAPI = async () => {
  const { data } = await http.get('/auth/yo')
  return data
}

// Trae (o crea lazy) el perfil Cliente vinculado al usuario logueado.
// Cualquier rol puede llamarlo, pero solo tiene sentido para clientes.
export const miClienteAPI = async () => {
  const { data } = await http.get('/auth/mi-cliente')
  return data
}

export const logoutAPI = () => {
  borrarToken()
}
