// Especificación OpenAPI 3.0 de la API de BarberPole.
// Se sirve como JSON en GET /api/docs.json y como UI interactiva en /api/docs.

const bearerAuth = [{ bearerAuth: [] }]

const respuestaError = (descripcion) => ({
  description: descripcion,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
    },
  },
})

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'BarberPole API',
    version: '1.0.0',
    description:
      'API REST multi-tenant para gestión de turnos de barberías y salones. ' +
      'Autenticación por Bearer JWT con claim de negocio; aislamiento estricto por tenant.',
    license: { name: 'MIT' },
  },
  servers: [
    { url: '/api', description: 'Servidor actual (ruta relativa)' },
    { url: 'http://localhost:4000/api', description: 'Desarrollo local' },
  ],
  tags: [
    { name: 'Salud', description: 'Healthcheck y estado del servicio' },
    { name: 'Auth', description: 'Registro, login y sesión' },
    { name: 'Negocios', description: 'Onboarding de tenants y portales públicos' },
    { name: 'Empleados', description: 'Profesionales y Slot Engine de disponibilidad' },
    { name: 'Turnos', description: 'Reservas y su ciclo de vida' },
    { name: 'Servicios', description: 'Catálogo de servicios por negocio' },
    { name: 'Usuarios', description: 'Gestión de usuarios (admin, scoped por negocio)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { error: { type: 'string', example: 'Mensaje de error' } },
      },
      Credenciales: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@studio.test' },
          password: { type: 'string', format: 'password', example: 'password123' },
        },
      },
      RegistroInput: {
        type: 'object',
        required: ['nombre', 'email', 'password'],
        properties: {
          nombre: { type: 'string', minLength: 2, maxLength: 60, example: 'Mateo Gabús' },
          email: { type: 'string', format: 'email' },
          password: {
            type: 'string',
            format: 'password',
            minLength: 8,
            description: 'Mínimo 8 caracteres, con al menos una letra y un número.',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'JWT con claims { id, rol, negocio }' },
          usuario: { $ref: '#/components/schemas/Usuario' },
        },
      },
      Usuario: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nombre: { type: 'string' },
          email: { type: 'string', format: 'email' },
          rol: { type: 'string', enum: ['superadmin', 'admin', 'empleado', 'cliente'] },
          negocio: { type: 'string', nullable: true },
        },
      },
      OnboardingInput: {
        type: 'object',
        required: ['nombreNegocio', 'slug', 'nombreOwner', 'email', 'password'],
        properties: {
          nombreNegocio: { type: 'string', example: 'Studio Palermo' },
          slug: { type: 'string', example: 'studio-palermo' },
          nombreOwner: { type: 'string', example: 'Dueño del Salón' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
          telefono: { type: 'string' },
          direccion: { type: 'string' },
          rubro: { type: 'string', enum: ['barberia', 'estetica', 'salud', 'servicios', 'otro'] },
          modalidad: { type: 'string', enum: ['local', 'particular'] },
          plan: { type: 'string', enum: ['free', 'pro', 'enterprise'] },
        },
      },
      Turno: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          cliente: { type: 'string' },
          empleado: { type: 'string' },
          servicio: { type: 'string' },
          negocio: { type: 'string', nullable: true },
          fechaHora: { type: 'string', format: 'date-time' },
          fechaHoraFin: { type: 'string', format: 'date-time' },
          precioCobrado: { type: 'number' },
          duracionMinutos: { type: 'integer' },
          estado: { type: 'string', enum: ['pendiente', 'confirmado', 'completado', 'cancelado'] },
          notas: { type: 'string' },
        },
      },
      TurnoInput: {
        type: 'object',
        required: ['empleado', 'servicio', 'fechaHora'],
        properties: {
          cliente: { type: 'string', description: 'Opcional: un cliente reserva para sí mismo.' },
          empleado: { type: 'string' },
          servicio: { type: 'string' },
          fechaHora: { type: 'string', format: 'date-time', example: '2026-12-01T15:30:00Z' },
          notas: { type: 'string', maxLength: 500 },
        },
      },
      Servicio: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          nombre: { type: 'string' },
          descripcion: { type: 'string' },
          precio: { type: 'number' },
          duracionMinutos: { type: 'integer' },
          activo: { type: 'boolean' },
        },
      },
      Empleado: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          nombre: { type: 'string' },
          especialidad: { type: 'string' },
          telefono: { type: 'string' },
          email: { type: 'string', format: 'email' },
          activo: { type: 'boolean' },
        },
      },
      Slot: {
        type: 'object',
        properties: {
          hora: { type: 'string', example: '15:30' },
          disponible: { type: 'boolean' },
          motivo: { type: 'string', nullable: true, example: 'Ocupado' },
        },
      },
    },
  },
  paths: {
    '/salud': {
      get: {
        tags: ['Salud'],
        summary: 'Healthcheck del servicio y estado de la base de datos',
        responses: {
          200: { description: 'Servicio saludable' },
          503: { description: 'Base de datos no conectada' },
        },
      },
    },
    '/auth/registro': {
      post: {
        tags: ['Auth'],
        summary: 'Registro público con creación atómica de perfil Cliente',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegistroInput' } } },
        },
        responses: {
          201: {
            description: 'Usuario creado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          400: respuestaError('Datos inválidos'),
          409: respuestaError('Email ya registrado'),
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Inicio de sesión con email y contraseña',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Credenciales' } } },
        },
        responses: {
          200: {
            description: 'Sesión iniciada',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          401: respuestaError('Credenciales inválidas'),
        },
      },
    },
    '/auth/google': {
      post: {
        tags: ['Auth'],
        summary: 'Login con Google Identity Services (valida la audiencia del ID token)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { credential: { type: 'string', description: 'ID token de Google' } },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Sesión iniciada',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          401: respuestaError('Token de Google inválido o emitido para otra app'),
        },
      },
    },
    '/auth/yo': {
      get: {
        tags: ['Auth'],
        summary: 'Rehidratación de sesión: devuelve el usuario del token',
        security: bearerAuth,
        responses: {
          200: {
            description: 'Usuario autenticado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } },
          },
          401: respuestaError('No autenticado'),
        },
      },
    },
    '/negocios/onboarding': {
      post: {
        tags: ['Negocios'],
        summary: 'Alta autoservicio de un nuevo salón (tenant) y su dueño admin',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/OnboardingInput' } } },
        },
        responses: {
          201: { description: 'Negocio y admin creados' },
          409: respuestaError('Slug ya registrado'),
        },
      },
    },
    '/negocios/publicos': {
      get: {
        tags: ['Negocios'],
        summary: 'Directorio de salones activos',
        responses: { 200: { description: 'Lista de negocios públicos' } },
      },
    },
    '/negocios/publico/{slug}': {
      get: {
        tags: ['Negocios'],
        summary: 'Portal público de un salón con sus servicios y profesionales',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Portal del salón' },
          404: respuestaError('Salón no encontrado'),
        },
      },
    },
    '/empleados/{id}/disponibilidad': {
      get: {
        tags: ['Empleados'],
        summary: 'Slot Engine: franjas horarias libres/ocupadas de un profesional',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'fecha', in: 'query', required: true, schema: { type: 'string', example: '2026-12-01' } },
          { name: 'servicioId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Slots calculados',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { slots: { type: 'array', items: { $ref: '#/components/schemas/Slot' } } },
                },
              },
            },
          },
        },
      },
    },
    '/empleados': {
      get: {
        tags: ['Empleados'],
        summary: 'Listado de profesionales (scoped por negocio)',
        security: bearerAuth,
        responses: { 200: { description: 'Lista de empleados' } },
      },
      post: {
        tags: ['Empleados'],
        summary: 'Alta de profesional (admin)',
        security: bearerAuth,
        responses: { 201: { description: 'Empleado creado' }, 403: respuestaError('Sin permisos') },
      },
    },
    '/empleados/{id}': {
      put: {
        tags: ['Empleados'],
        summary: 'Edición de profesional (admin del mismo negocio)',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Actualizado' }, 403: respuestaError('Otro negocio') },
      },
      delete: {
        tags: ['Empleados'],
        summary: 'Baja de profesional (admin del mismo negocio)',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 204: { description: 'Eliminado' }, 403: respuestaError('Otro negocio') },
      },
    },
    '/turnos': {
      get: {
        tags: ['Turnos'],
        summary: 'Listado de turnos (clientes ven solo los suyos; admin/empleado los del negocio)',
        security: bearerAuth,
        parameters: [
          { name: 'estado', in: 'query', schema: { type: 'string' } },
          { name: 'desde', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'hasta', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Lista de turnos' } },
      },
      post: {
        tags: ['Turnos'],
        summary: 'Reserva de turno (anti-pasado, snapshots y anti-doble-reserva)',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TurnoInput' } } },
        },
        responses: {
          201: {
            description: 'Turno creado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Turno' } } },
          },
          400: respuestaError('Datos inválidos o fecha en el pasado'),
          409: respuestaError('El empleado ya tiene un turno en ese horario'),
        },
      },
    },
    '/turnos/{id}': {
      get: {
        tags: ['Turnos'],
        summary: 'Detalle de un turno (scoped por cliente/negocio)',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Turno' }, 403: respuestaError('Sin acceso') },
      },
      put: {
        tags: ['Turnos'],
        summary: 'Modificación de turno (admin/empleado del mismo negocio)',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Actualizado' }, 409: respuestaError('Superposición') },
      },
      delete: {
        tags: ['Turnos'],
        summary: 'Eliminación de turno (admin del mismo negocio)',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Eliminado' }, 403: respuestaError('Otro negocio') },
      },
    },
    '/turnos/{id}/cancelar': {
      patch: {
        tags: ['Turnos'],
        summary: 'Cancelación de turno (cliente con lead-time mínimo; admin/empleado sin restricción)',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Turno cancelado' },
          400: respuestaError('Fuera de la ventana de cancelación'),
          403: respuestaError('No es tu turno'),
        },
      },
    },
    '/servicios': {
      get: {
        tags: ['Servicios'],
        summary: 'Catálogo de servicios (filtrado por tenant)',
        responses: { 200: { description: 'Lista de servicios' } },
      },
      post: {
        tags: ['Servicios'],
        summary: 'Alta de servicio (admin)',
        security: bearerAuth,
        responses: { 201: { description: 'Servicio creado' }, 403: respuestaError('Sin permisos') },
      },
    },
    '/usuarios': {
      get: {
        tags: ['Usuarios'],
        summary: 'Listado de usuarios del negocio del admin (superadmin ve todos)',
        security: bearerAuth,
        responses: { 200: { description: 'Lista de usuarios' }, 403: respuestaError('Sin permisos') },
      },
      post: {
        tags: ['Usuarios'],
        summary: 'Alta de usuario en el negocio del admin',
        security: bearerAuth,
        responses: { 201: { description: 'Usuario creado' }, 403: respuestaError('Sin permisos') },
      },
    },
    '/usuarios/{id}': {
      put: {
        tags: ['Usuarios'],
        summary: 'Edición de usuario del mismo negocio',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Actualizado' }, 404: respuestaError('No encontrado / otro negocio') },
      },
      delete: {
        tags: ['Usuarios'],
        summary: 'Baja de usuario del mismo negocio',
        security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 204: { description: 'Eliminado' }, 404: respuestaError('No encontrado / otro negocio') },
      },
    },
  },
}
