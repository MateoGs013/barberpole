import * as negocioService from '../services/negocio.service.js'

export const onboarding = async (req, res, next) => {
  try {
    const {
      nombreNegocio,
      slug,
      nombreOwner,
      nombreAdmin,
      email,
      emailAdmin,
      password,
      passwordAdmin,
      telefono,
      direccion,
      plan,
    } = req.body

    const finalNombreOwner = nombreOwner || nombreAdmin
    const finalEmail = email || emailAdmin
    const finalPassword = password || passwordAdmin

    if (!nombreNegocio || !slug || !finalNombreOwner || !finalEmail || !finalPassword) {
      return res.status(400).json({ error: 'Completá todos los campos obligatorios' })
    }

    const resultado = await negocioService.onboardingNegocio({
      nombreNegocio,
      slug,
      nombreOwner: finalNombreOwner,
      email: finalEmail,
      password: finalPassword,
      telefono,
      direccion,
      plan,
    })
    res.status(201).json(resultado)
  } catch (error) {
    next(error)
  }
}

export const obtenerPublicoPorSlug = async (req, res, next) => {
  try {
    const { slug } = req.params
    const resultado = await negocioService.obtenerNegocioPublicoPorSlug(slug)
    res.json(resultado)
  } catch (error) {
    next(error)
  }
}

export const listarPublicos = async (req, res, next) => {
  try {
    const resultado = await negocioService.listarNegociosPublicos()
    res.json(resultado)
  } catch (error) {
    next(error)
  }
}

export const obtenerMiNegocio = async (req, res, next) => {
  try {
    const resultado = await negocioService.obtenerMiNegocio(req.negocioId)
    res.json(resultado)
  } catch (error) {
    next(error)
  }
}

export const actualizarMiNegocio = async (req, res, next) => {
  try {
    const resultado = await negocioService.actualizarMiNegocio(req.negocioId, req.body)
    res.json(resultado)
  } catch (error) {
    next(error)
  }
}

// ─── Superadmin Controllers ───────────────────────────────────────────────────

export const listarSuperadmin = async (req, res, next) => {
  try {
    const resultado = await negocioService.listarTodosLosNegociosSuperadmin()
    res.json(resultado)
  } catch (error) {
    next(error)
  }
}

export const crearSuperadmin = async (req, res, next) => {
  try {
    const resultado = await negocioService.crearNegocioSuperadmin(req.body)
    res.status(201).json(resultado)
  } catch (error) {
    next(error)
  }
}

export const actualizarSuperadmin = async (req, res, next) => {
  try {
    const resultado = await negocioService.actualizarNegocioSuperadmin(req.params.id, req.body)
    res.json(resultado)
  } catch (error) {
    next(error)
  }
}

export const toggleEstadoSuperadmin = async (req, res, next) => {
  try {
    const resultado = await negocioService.toggleEstadoNegocioSuperadmin(req.params.id)
    res.json(resultado)
  } catch (error) {
    next(error)
  }
}

export const eliminarSuperadmin = async (req, res, next) => {
  try {
    await negocioService.eliminarNegocioSuperadmin(req.params.id)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
}
