import { http } from './http.js'

export const onboardingNegocioAPI = async (datos) => {
  const res = await http.post('/negocios/onboarding', datos)
  return res.data
}

export const obtenerNegocioPublicoAPI = async (slug) => {
  const res = await http.get(`/negocios/publico/${slug}`)
  return res.data
}

export const listarNegociosPublicosAPI = async () => {
  const res = await http.get('/negocios/publicos')
  return res.data
}

export const obtenerMiNegocioAPI = async () => {
  const res = await http.get('/negocios/mi-negocio')
  return res.data
}

export const actualizarMiNegocioAPI = async (datos) => {
  const res = await http.put('/negocios/mi-negocio', datos)
  return res.data
}

// ─── Superadmin APIs ──────────────────────────────────────────────────────────

export const listarNegociosSuperadminAPI = async () => {
  const res = await http.get('/negocios/superadmin/todos')
  return res.data
}

export const crearNegocioSuperadminAPI = async (datos) => {
  const res = await http.post('/negocios/superadmin/crear', datos)
  return res.data
}

export const actualizarNegocioSuperadminAPI = async (id, datos) => {
  const res = await http.put(`/negocios/superadmin/${id}`, datos)
  return res.data
}

export const toggleEstadoNegocioSuperadminAPI = async (id) => {
  const res = await http.post(`/negocios/superadmin/${id}/toggle`)
  return res.data
}

export const eliminarNegocioSuperadminAPI = async (id) => {
  const res = await http.delete(`/negocios/superadmin/${id}`)
  return res.data
}
