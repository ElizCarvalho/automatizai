import { test, expect } from '@playwright/test'

//teste gerado com ajuda do codegen ($ yarn playwright codegen http://localhost:5173/)
//podemos executar o teste com o comando: $ yarn playwright test pedidos.spec.ts
//ou com o comando: $ yarn playwright test pedidos.spec.ts --headed
//ou com o comando: $ yarn playwright test pedidos.spec.ts --ui
//ou com o comando: $ yarn playwright test pedidos.spec.ts --debug
test('deve consultar um pedido aprovado', async ({ page }) => {

  // Arrange (Given) = Preparar o teste
  await page.goto('http://localhost:5173/')
  await expect(page.getByTestId('hero-section').getByRole('heading')).toContainText('Velô Sprint') //Checkpoint
  await page.getByRole('link', { name: 'Consultar Pedido' }).click()
  await expect(page.getByRole('heading')).toContainText('Consultar Pedido') //Checkpoint

  // Act (When) = Executar a ação
  await page.getByTestId('search-order-id').fill('VLO-P5VBLX')
  await page.getByTestId('search-order-button').click()

  // Assert (Then) = Verificar o resultado
  await expect(page.getByTestId('order-result-id')).toBeVisible()
  await expect(page.getByTestId('order-result-id')).toContainText('VLO-P5VBLX')
  await expect(page.getByTestId('order-result-status')).toBeVisible()
  await expect(page.getByTestId('order-result-status')).toContainText('APROVADO')

})