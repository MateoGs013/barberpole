import { http } from './http.js'

export const listarTurnosAPI = async (params = {}) =>
  (await http.get('/turnos', { params })).data

export const obtenerTurnoAPI = async (id) =>
  (await http.get(`/turnos/${id}`)).data

export const crearTurnoAPI = async (datos) =>
  (await http.post('/turnos', datos)).data

export const actualizarTurnoAPI = async (id, datos) =>
  (await http.put(`/turnos/${id}`, datos)).data

export const eliminarTurnoAPI = async (id) =>
  (await http.delete(`/turnos/${id}`)).data

export const cancelarTurnoAPI = async (id) =>
  (await http.patch(`/turnos/${id}/cancelar`)).data
