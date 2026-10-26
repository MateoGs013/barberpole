import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { conectarDB } from './config/db.js'
import { Negocio } from './models/Negocio.js'
import { Usuario } from './models/Usuario.js'
import { Empleado } from './models/Empleado.js'
import { Servicio } from './models/Servicio.js'
import { Cliente } from './models/Cliente.js'
import { Turno } from './models/Turno.js'

const seedDemo = async () => {
  await conectarDB()
  console.log('--- Iniciando Seed Demo Multi-Tenant BarberPole ---')

  await Promise.all([
    Negocio.deleteMany({}),
    Usuario.deleteMany({}),
    Empleado.deleteMany({}),
    Servicio.deleteMany({}),
    Cliente.deleteMany({}),
    Turno.deleteMany({}),
  ])
  console.log('Colecciones reiniciadas.')

  const passSuperadmin = await bcrypt.hash('superadmin123', 10)
  const passAdmin = await bcrypt.hash('admin123', 10)
  const passBarbero = await bcrypt.hash('barbero123', 10)
  const passCliente = await bcrypt.hash('cliente123', 10)

  // 0) Superadmin Global de la Plataforma
  await Usuario.create({
    nombre: 'Super Administrador (Platform Master)',
    email: 'superadmin@barberpole.test',
    password: passSuperadmin,
    rol: 'superadmin',
  })

  // 1) Crear Salon 1: Studio Palermo
  const adminPalermo = await Usuario.create({
    nombre: 'Mateo Gabús (Admin Palermo)',
    email: 'admin@peluqueria.com',
    password: passAdmin,
    rol: 'admin',
  })

  const salonPalermo = await Negocio.create({
    nombre: 'Studio Palermo — Barber & Hair',
    slug: 'studio-palermo',
    descripcion: 'Espacio de autor enfocado en cortes modernos, degradé de precisión y rituales de barba.',
    direccion: 'Honduras 4820, Palermo Soho, CABA',
    telefono: '+54 11 5566-7788',
    owner: adminPalermo._id,
    plan: 'pro',
    activo: true,
  })

  adminPalermo.negocio = salonPalermo._id
  await adminPalermo.save()

  // 2) Empleados de Studio Palermo
  const barberoUser = await Usuario.create({
    nombre: 'Lucas Almirón (Barbero Palermo)',
    email: 'barbero@peluqueria.com',
    password: passBarbero,
    rol: 'empleado',
    negocio: salonPalermo._id,
  })

  const empleadosPalermo = await Empleado.create([
    {
      negocio: salonPalermo._id,
      nombre: 'Mateo Gabús',
      especialidad: 'Master Barber · Fade & Tijera Clásica',
      telefono: '+54 11 7766-5544',
      email: 'mateo@studiopalermo.com',
      usuario: adminPalermo._id,
      activo: true,
    },
    {
      negocio: salonPalermo._id,
      nombre: 'Lucas Almirón',
      especialidad: 'Barbas Tradicionales & Toallas Calientes',
      telefono: '+54 11 8899-0011',
      email: 'lucas@studiopalermo.com',
      usuario: barberoUser._id,
      activo: true,
    },
    {
      negocio: salonPalermo._id,
      nombre: 'Sofia Benítez',
      especialidad: 'Colorimetría Urbana & Platinados',
      telefono: '+54 11 4455-6677',
      email: 'sofia@studiopalermo.com',
      activo: true,
    },
  ])

  // 3) Servicios de Studio Palermo
  const serviciosPalermo = await Servicio.create([
    {
      negocio: salonPalermo._id,
      nombre: 'Corte Fade / Degradé',
      descripcion: 'Degradé a elección (low, mid, high) con tijera superior y navaja.',
      precio: 8500,
      duracionMinutos: 30,
      activo: true,
    },
    {
      negocio: salonPalermo._id,
      nombre: 'Barba Clásica & Toalla Caliente',
      descripcion: 'Recorte, perfilado con navaja, vaporizador ozono y aceites esenciales.',
      precio: 6000,
      duracionMinutos: 25,
      activo: true,
    },
    {
      negocio: salonPalermo._id,
      nombre: 'Combo Studio (Corte + Barba + Lavado)',
      descripcion: 'Experiencia completa con toalla aromatizada y peinado con cera mate.',
      precio: 13500,
      duracionMinutos: 50,
      activo: true,
    },
    {
      negocio: salonPalermo._id,
      nombre: 'Platinado Global & Matizado',
      descripcion: 'Decoloración técnica profesional con protección plex y matizador frío.',
      precio: 25000,
      duracionMinutos: 90,
      activo: true,
    },
  ])

  // 4) Crear Salon 2: La Nave Barbershop
  const ownerLaNave = await Usuario.create({
    nombre: 'Rodrigo Díaz (La Nave)',
    email: 'owner@lanave.com',
    password: passAdmin,
    rol: 'admin',
  })

  const salonLaNave = await Negocio.create({
    nombre: 'La Nave Barbershop',
    slug: 'la-nave',
    descripcion: 'Barbería de barrio con estilo industrial vintage y la mejor cerveza artesanal.',
    direccion: 'Av. Corrientes 3420, Almagro, CABA',
    telefono: '+54 11 9988-1122',
    owner: ownerLaNave._id,
    plan: 'free',
    activo: true,
  })

  ownerLaNave.negocio = salonLaNave._id
  await ownerLaNave.save()

  const empleadosLaNave = await Empleado.create([
    {
      negocio: salonLaNave._id,
      nombre: 'Rodrigo Díaz',
      especialidad: 'Cortes Old School & Pompadour',
      telefono: '+54 11 9988-1122',
      email: 'rodrigo@lanave.com',
      usuario: ownerLaNave._id,
      activo: true,
    },
    {
      negocio: salonLaNave._id,
      nombre: 'Joaquín Gómez',
      especialidad: 'Freestyle & Diseños Navaja',
      telefono: '+54 11 3322-9988',
      email: 'joaquin@lanave.com',
      activo: true,
    },
  ])

  const serviciosLaNave = await Servicio.create([
    {
      negocio: salonLaNave._id,
      nombre: 'Corte Tradicional Navaja',
      descripcion: 'Corte prolijo estilo vintage con finalización en navaja y loción.',
      precio: 7000,
      duracionMinutos: 30,
      activo: true,
    },
    {
      negocio: salonLaNave._id,
      nombre: 'Arreglo de Barba Express',
      descripcion: 'Rebaje parejo y perfilado rápido de líneas.',
      precio: 4500,
      duracionMinutos: 20,
      activo: true,
    },
  ])

  // 5) Clientes y Turnos
  const clienteUser = await Usuario.create({
    nombre: 'Agustín Navarro (Cliente)',
    email: 'cliente@peluqueria.com',
    password: passCliente,
    rol: 'cliente',
  })

  const clienteDemo = await Cliente.create({
    nombre: clienteUser.nombre,
    email: clienteUser.email,
    telefono: '+54 11 5522-3344',
    usuario: clienteUser._id,
    negocio: salonPalermo._id,
    notas: 'Cliente habitual de Studio Palermo.',
  })

  const clienteExtra = await Cliente.create({
    nombre: 'Gonzalo Bellini',
    email: 'gonzalo.bellini@gmail.com',
    telefono: '+54 11 4433-2211',
    negocio: salonPalermo._id,
  })

  // Turnos en Studio Palermo
  const ahora = new Date()
  const año = ahora.getFullYear()
  const mes = ahora.getMonth()

  // Turno completado en Palermo
  const fechaPasada = new Date(año, mes, Math.max(1, ahora.getDate() - 2), 11, 0, 0)
  await Turno.create({
    negocio: salonPalermo._id,
    cliente: clienteDemo._id,
    empleado: empleadosPalermo[0]._id,
    servicio: serviciosPalermo[0]._id,
    fechaHora: fechaPasada,
    fechaHoraFin: new Date(fechaPasada.getTime() + 30 * 60_000),
    precioCobrado: serviciosPalermo[0].precio,
    duracionMinutos: 30,
    estado: 'completado',
  })

  // Turno futuro en Palermo
  const fechaFutura = new Date(ahora.getTime() + 24 * 60 * 60 * 1000)
  fechaFutura.setHours(15, 0, 0, 0)
  await Turno.create({
    negocio: salonPalermo._id,
    cliente: clienteDemo._id,
    empleado: empleadosPalermo[1]._id,
    servicio: serviciosPalermo[1]._id,
    fechaHora: fechaFutura,
    fechaHoraFin: new Date(fechaFutura.getTime() + 25 * 60_000),
    precioCobrado: serviciosPalermo[1].precio,
    duracionMinutos: 25,
    estado: 'confirmado',
    notas: 'Reserva para demo en Studio Palermo.',
  })

  console.log('✅ Seed Demo Multi-Tenant completado con éxito:')
  console.log('--------------------------------------------------')
  console.log('👑 Salón 1: Studio Palermo (/studio-palermo)')
  console.log('   Admin:   admin@peluqueria.com / admin123')
  console.log('   Barbero: barbero@peluqueria.com / barbero123')
  console.log('👑 Salón 2: La Nave Barbershop (/la-nave)')
  console.log('   Admin:   owner@lanave.com / admin123')
  console.log('👤 Cliente: cliente@peluqueria.com / cliente123')
  console.log('--------------------------------------------------')

  await mongoose.disconnect()
  process.exit(0)
}

seedDemo().catch((err) => {
  console.error('Error durante el seed demo:', err)
  process.exit(1)
})
