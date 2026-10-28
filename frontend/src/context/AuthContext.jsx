// Context global de autenticación.
// Cualquier componente que necesite saber quién está logueado o invocar
// login/logout llama al hook useAuth() (ver src/hooks/useAuth.js).

import { createContext, useState, useEffect, useCallback } from 'react'
import {
  loginAPI,
  registrarAPI,
  loginGoogleAPI,
  yoAPI,
  logoutAPI,
  miClienteAPI,
} from '../api/auth.api.js'
import { obtenerToken, setearCallbackNoAutorizado } from '../api/http.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [miCliente, setMiCliente] = useState(null)
  const [cargando, setCargando] = useState(true)

  const cargarMiCliente = useCallback(async () => {
    try {
      const cli = await miClienteAPI()
      setMiCliente(cli)
      return cli
    } catch {
      setMiCliente(null)
      return null
    }
  }, [])

  useEffect(() => {
    const limpiarSesion = () => {
      setUsuario(null)
      setMiCliente(null)
    }

    setearCallbackNoAutorizado(limpiarSesion)
    window.addEventListener('auth:desautorizado', limpiarSesion)

    const rehidratar = async () => {
      if (!obtenerToken()) {
        setCargando(false)
        return
      }
      try {
        const datos = await yoAPI()
        setUsuario(datos)
        await cargarMiCliente()
      } catch {
        setUsuario(null)
      } finally {
        setCargando(false)
      }
    }
    rehidratar()

    return () => {
      setearCallbackNoAutorizado(null)
      window.removeEventListener('auth:desautorizado', limpiarSesion)
    }
  }, [cargarMiCliente])

  const login = async (credenciales) => {
    const { usuario } = await loginAPI(credenciales)
    setUsuario(usuario)
    await cargarMiCliente()
    return usuario
  }

  const loginConGoogle = async (datosGoogle) => {
    const { usuario } = await loginGoogleAPI(datosGoogle)
    setUsuario(usuario)
    await cargarMiCliente()
    return usuario
  }

  const registrar = async (datos) => {
    const { usuario } = await registrarAPI(datos)
    setUsuario(usuario)
    await cargarMiCliente()
    return usuario
  }

  const logout = () => {
    logoutAPI()
    setUsuario(null)
    setMiCliente(null)
  }

  const valor = {
    usuario,
    miCliente,
    cargando,
    login,
    loginConGoogle,
    registrar,
    logout,
    cargarMiCliente,
  }

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
