import { http } from './http.js'

export const listarEmpleadosAPI = async (params = {}) =>
  (await http.get('/empleados', { params })).data

export const obtenerEmpleadoAPI = async (id) =>
  (await http.get(`/empleados/${id}`)).data

export const crearEmpleadoAPI = async (datos) =>
  (await http.post('/empleados', datos)).data

export const actualizarEmpleadoAPI = async (id, datos) =>
  (await http.put(`/empleados/${id}`, datos)).data

export const eliminarEmpleadoAPI = async (id) =>
  (await http.delete(`/empleados/${id}`)).data

export const obtenerDisponibilidadAPI = async (id, params = {}) =>
  (await http.get(`/empleados/${id}/disponibilidad`, { params })).data

export const conectarGoogleCalendarAPI = async (id, datos = {}) =>
  (await http.post(`/empleados/${id}/google-calendar/conectar`, datos)).data

export const desconectarGoogleCalendarAPI = async (id) =>
  (await http.post(`/empleados/${id}/google-calendar/desconectar`)).data

export const bloquearHorarioGoogleAPI = async (id, datos) =>
  (await http.post(`/empleados/${id}/google-calendar/bloquear`, datos)).data

export const desbloquearHorarioGoogleAPI = async (id, eventId) =>
  (await http.delete(`/empleados/${id}/google-calendar/bloquear/${eventId}`)).data
