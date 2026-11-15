import { test, expect } from '@playwright/test'
import { generateOrderCode } from '../support/helpers'

// Notas da aula: docs/aulas/modulo-2-aula-9.md

test('deve consultar um pedido aprovado', async ({ page }) => {
  // Arrange (Given) = Preparar o teste
  const orderCode = 'VLO-P5VBLX'

  await page.goto('http://localhost:5173/')
  await expect(page.getByTestId('hero-section').getByRole('heading')).toContainText('Velô Sprint')
  await page.getByRole('link', { name: 'Consultar Pedido' }).click()
  await expect(page.getByRole('heading')).toContainText('Consultar Pedido')

  // Act (When) = Executar a ação
  await page.getByRole('textbox', { name: 'Número do Pedido' }).fill(orderCode)
  await page.getByRole('button', { name: 'Buscar Pedido' }).click()

  // Assert (Then) = Verificar o resultado
  const card = page.getByTestId(`order-result-${orderCode}`)
  await expect(card).toBeVisible({ timeout: 10_000 })
  await expect(card.getByText(orderCode, { exact: true })).toBeVisible()
  await expect(card.getByText('APROVADO', { exact: true })).toBeVisible()
})

test('deve exibir mensagem quando o pedido nao for encontrado', async ({ page }) => {
  // Arrange (Given) = Preparar o teste
  const orderCode = generateOrderCode()

  await page.goto('http://localhost:5173/')
  await expect(page.getByTestId('hero-section').getByRole('heading')).toContainText('Velô Sprint')
  await page.getByRole('link', { name: 'Consultar Pedido' }).click()
  await expect(page.getByRole('heading')).toContainText('Consultar Pedido')

  // Act (When) = Executar a ação
  await page.getByRole('textbox', { name: 'Número do Pedido' }).fill(orderCode)
  await page.getByRole('button', { name: 'Buscar Pedido' }).click()

  // Assert (Then) = Verificar o resultado
  const titleLocator = page.getByRole('heading', { name: 'Pedido não encontrado', level: 3 })
  await expect(titleLocator).toBeVisible()

  const messageLocator = page.locator('p', { hasText: 'Verifique o número do pedido e tente novamente' })
  await expect(messageLocator).toBeVisible()

  await expect(page.locator('#root')).toMatchAriaSnapshot(`
    - img
    - heading "Pedido não encontrado" [level=3]
    - paragraph: Verifique o número do pedido e tente novamente
    `)
})
