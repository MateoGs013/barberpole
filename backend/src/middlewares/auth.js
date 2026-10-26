import jwt from 'jsonwebtoken'

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no provisto' })
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.usuario = {
      id: payload.id,
      rol: payload.rol,
      negocio: payload.negocio || null,
    }
    req.negocioId = payload.negocio || null
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

export const optAuth = (req, res, next) => {
  const header = req.headers.authorization
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7)
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      req.usuario = {
        id: payload.id,
        rol: payload.rol,
        negocio: payload.negocio || null,
      }
      req.negocioId = payload.negocio || null
    } catch (error) {
      // Ignorar token inválido en middleware opcional
    }
  }
  next()
}

export const requireRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autenticado' })
    }
    if (req.usuario.rol === 'superadmin' || rolesPermitidos.includes(req.usuario.rol)) {
      return next()
    }
    return res.status(403).json({ error: 'No tenés permisos para esta acción' })
  }
}
