// Context global de autenticación.
// Cualquier componente que necesite saber quién está logueado o invocar
// login/logout llama al hook useAuth() (ver src/hooks/useAuth.js).
//
// Cómo funciona la "rehidratación":
// Cuando se monta el provider (o sea, al abrir la app), si hay token en
// localStorage llamamos al backend GET /api/auth/yo para validar el token
// y traer los datos del usuario. Si el token es inválido o vencido, el
// interceptor de http lo borra y dejamos al usuario en null.

import { createContext, useState, useEffect } from 'react'
import { loginAPI, registrarAPI, yoAPI, logoutAPI, miClienteAPI } from '../api/auth.api.js'
import { obtenerToken } from '../api/http.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  // miCliente: perfil Cliente vinculado al usuario, solo si es rol "cliente".
  // Lo necesita la página /reservar para crear turnos con su clienteId.
  const [miCliente, setMiCliente] = useState(null)
  const [cargando, setCargando] = useState(true)

  // Si el usuario es cliente, traemos (o creamos lazy) su perfil Cliente.
  // Para otros roles no tiene sentido, así que lo evitamos.
  const cargarMiCliente = async (rol) => {
    if (rol !== 'cliente') {
      setMiCliente(null)
      return
    }
    try {
      const cli = await miClienteAPI()
      setMiCliente(cli)
    } catch {
      setMiCliente(null)
    }
  }

  useEffect(() => {
    const rehidratar = async () => {
      if (!obtenerToken()) {
        setCargando(false)
        return
      }
      try {
        const datos = await yoAPI()
        setUsuario(datos)
        await cargarMiCliente(datos.rol)
      } catch {
        setUsuario(null)
      } finally {
        setCargando(false)
      }
    }
    rehidratar()
  }, [])

  const login = async (credenciales) => {
    const { usuario } = await loginAPI(credenciales)
    setUsuario(usuario)
    await cargarMiCliente(usuario.rol)
    return usuario
  }

  const registrar = async (datos) => {
    const { usuario } = await registrarAPI(datos)
    setUsuario(usuario)
    await cargarMiCliente(usuario.rol)
    return usuario
  }

  const logout = () => {
    logoutAPI()
    setUsuario(null)
    setMiCliente(null)
  }

  const valor = { usuario, miCliente, cargando, login, registrar, logout }

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
