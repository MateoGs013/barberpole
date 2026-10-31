import { test, expect } from '@playwright/test'

// Smoke e2e: dos flujos clave a través del stack completo (frontend -> API -> Mongo).
// 1) Onboarding de un salón nuevo (wizard público) -> dashboard autenticado.
// 2) Registro de un cliente + portal público del salón hasta el Slot Engine.
// Nota: no se clickea calendario/slot/confirmar a propósito (calendario custom
// propenso a flakiness); el flujo valida todo el camino hasta "Elegí día y horario".

const stamp = Date.now()
const SLUG = 'e2e-studio'
const OWNER_EMAIL = `owner.e2e.${stamp}@barberpole.test`
const CLIENTE_EMAIL = `cliente.e2e.${stamp}@barberpole.test`
const PASSWORD = 'Password123'

test.describe.serial('Smoke e2e — BarberPole', () => {
  test('onboarding crea un salón nuevo y entra al dashboard', async ({ page }) => {
    await page.goto('/onboarding')

    // Paso 1: identidad & modalidad
    await expect(page.getByText(/identidad & modalidad/i)).toBeVisible()
    await page.getByLabel(/nombre del negocio/i).fill('E2E Studio')
    await page.getByPlaceholder('tu-estudio').fill(SLUG)
    await page.getByRole('button', { name: /continuar a datos de acceso/i }).click()

    // Paso 2: credenciales del dueño
    await page.getByPlaceholder('Ej. Rodrigo Díaz').fill('Owner E2E')
    await page.getByPlaceholder('vos@tudominio.com').fill(OWNER_EMAIL)
    await page.getByPlaceholder(/mínimo .* caracteres/i).fill(PASSWORD)
    await page.getByRole('button', { name: /elegir plan/i }).click()

    // Paso 3: plan + finalizar
    await page.getByText('Plan Free').click()
    await page.getByRole('button', { name: /finalizar y abrir agenda/i }).click()

    // Debe quedar autenticado en el dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 })
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('un cliente registrado llega al Slot Engine del portal público', async ({ page }) => {
    // Registro público de un cliente
    await page.goto('/registro')
    await page.getByPlaceholder('Juan Pérez').fill('Cliente E2E')
    await page.getByPlaceholder('vos@email.com').fill(CLIENTE_EMAIL)
    await page.locator('#password').fill(PASSWORD)
    await page.locator('#password2').fill(PASSWORD)
    await page.getByRole('button', { name: /crear cuenta/i }).click()

    // El registro exitoso saca al usuario de /registro
    await expect(page).not.toHaveURL(/\/registro/, { timeout: 20_000 })

    // Portal público del salón creado en el flujo anterior
    await page.goto(`/${SLUG}`)
    await expect(page.getByRole('heading', { name: 'E2E Studio', level: 1 })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('heading', { name: /elegí el servicio/i })).toBeVisible()

    // Elegir un servicio (salón de 1 profesional -> salta directo a fecha/hora)
    await page.getByRole('button', { name: /corte clásico/i }).click()

    // Llegamos al Slot Engine (sin clickear calendario ni confirmar)
    await expect(page.getByText(/elegí día y horario/i)).toBeVisible()
    await expect(page.getByText(/horarios disponibles/i)).toBeVisible()
  })
})
