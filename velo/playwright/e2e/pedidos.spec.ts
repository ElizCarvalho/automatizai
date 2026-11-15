import { test, expect } from '@playwright/test'

//teste gerado com ajuda do codegen ($ yarn playwright codegen http://localhost:5173/)
//podemos executar o teste com o comando: $ yarn playwright test pedidos.spec.ts
//ou com o comando: $ yarn playwright test pedidos.spec.ts --headed
//ou com o comando: $ yarn playwright test pedidos.spec.ts --ui
//ou com o comando: $ yarn playwright test pedidos.spec.ts --debug
test('deve consultar um pedido aprovado', async ({ page }) => {

  // Arrange (Given) = Preparar o teste
  const orderId = 'VLO-P5VBLX'
  await page.goto('http://localhost:5173/')
  await expect(page.getByTestId('hero-section').getByRole('heading')).toContainText('Velô Sprint') //Checkpoint
  await page.getByRole('link', { name: 'Consultar Pedido' }).click()
  await expect(page.getByRole('heading')).toContainText('Consultar Pedido') //Checkpoint

  // Act (When) = Executar a ação
  //await page.getByTestId('search-order-id').fill(orderId) //estrategia quando tem test-id
  //await page.locator('//label[text()="Número do Pedido"]/../input').fill('VLO-P5VBLX') //xpath para buscar o elemento
  await page.getByRole('textbox', { name: 'Número do Pedido' }).fill(orderId) //buscar o elemento pelo nome do label
  //await page.getByLabel('Número do Pedido').fill(orderId) //buscar o elemento pelo label
  //await page.getByPlaceholder('Ex:VLO-ABC123').fill(orderId) //buscar o elemento pelo placeholder
  //await page.getByTestId('search-order-button').click() //ESTRATEGIA QUANDO TEM TEST-ID: clicar no botão de buscar (porque o test-id é único)
  //await page.locator('//button[text()="Buscar Pedido"]').click(); //xpath para buscar o botão de buscar (porque o texto é único)
  await page.getByRole('button', { name: 'Buscar Pedido' }).click();

  // Assert (Then) = Verificar o resultado

  //await page.waitForTimeout(10000) //PESSIMO e NAO USAR ASSIM: aguarda 10 segundos para verificar o resultado e com isso o teste fica lento
  //await expect(page.getByTestId('order-result-id')).toBeVisible({ timeout: 10_000 }) //USAR ASSIM: pode aguardar até 10 segundos para encontrar o elemento
  //await expect(page.getByTestId('order-result-id')).toContainText(orderId)
  //await expect(page.getByTestId('order-result-status')).toBeVisible()
  //await expect(page.getByTestId('order-result-status')).toContainText('APROVADO')

  //DESAFIO ASSERT
  const card = page.getByTestId(`order-result-${orderId}`)
  await expect(card).toBeVisible({ timeout: 10_000 })
  await expect(card.getByText(orderId, { exact: true })).toBeVisible()
  await expect(card.getByText('APROVADO', { exact: true })).toBeVisible()

})