# Módulo 2 — Aula 17: describe e hooks

Notas do agrupamento em `velo/playwright/e2e/pedidos.spec.ts`.

Os dois testes de consultar pedido repetem a mesma preparação: abrir a home, conferir o título e clicar em **Consultar Pedido**. `describe` junta esses testes. Os hooks (ganchos) rodam um trecho automaticamente, para esse preparo não ser copiado em cada teste.

## `test.describe`

`describe` é uma pasta com nome. O relatório mostra `Consultar pedido > deve consultar um pedido aprovado` em vez de dois testes soltos. Os hooks escritos dentro dele valem só para os testes desse grupo.

```ts
test.describe('Consultar pedido', () => {
  test('deve consultar um pedido aprovado', async ({ page }) => {
    // ...
  })

  test('deve exibir mensagem quando o pedido nao for encontrado', async ({ page }) => {
    // ...
  })
})
```

## Os quatro ganchos

| Hook | Quando roda | Para que serve |
| --- | --- | --- |
| `beforeAll` | Uma vez, antes do primeiro teste do grupo | Algo caro que serve para o grupo inteiro |
| `beforeEach` | Antes de **cada** teste | A preparação que os testes repetem |
| `afterEach` | Depois de **cada** teste | Limpar o que aquele teste deixou |
| `afterAll` | Uma vez, depois do último teste do grupo | Encerrar o que o `beforeAll` abriu |

No arquivo, cada gancho só escreve no terminal. O `console.log` existe para você ver a ordem. Não faz parte do teste do pedido.

```ts
test.beforeEach(async ({ page }) => {
  console.log('beforeEach: Roda antes de cada teste')
})

test.afterEach(async ({ page }) => {
  console.log('afterEach: Roda depois de cada teste')
})

test.beforeAll(async () => {
  console.log('beforeAll: Roda antes de todos os testes')
})

test.afterAll(async () => {
  console.log('afterAll: Roda depois de todos os testes')
})
```

Com os dois testes, a ordem no terminal é:

1. `beforeAll`
2. `beforeEach`
3. teste do pedido aprovado
4. `afterEach`
5. `beforeEach`
6. teste do pedido não encontrado
7. `afterEach`
8. `afterAll`

`Each` repete. `All` acontece uma vez no grupo.

## Onde entra a repetição

Este bloco está igual nos dois testes. É o Arrange compartilhado:

```ts
await page.goto('http://localhost:5173/')
await expect(page.getByTestId('hero-section').getByRole('heading')).toContainText('Velô Sprint')
await page.getByRole('link', { name: 'Consultar Pedido' }).click()
await expect(page.getByRole('heading')).toContainText('Consultar Pedido')
```

Ele vai no `beforeEach`, porque cada teste precisa da própria página já na tela de consulta. Aí o teste fica só com o que muda: o código do pedido, o clique em buscar e a conferência do resultado.

```ts
test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173/')
  await expect(page.getByTestId('hero-section').getByRole('heading')).toContainText('Velô Sprint')
  await page.getByRole('link', { name: 'Consultar Pedido' }).click()
  await expect(page.getByRole('heading')).toContainText('Consultar Pedido')
})
```

O que continua dentro de cada `test`:

- pedido aprovado: preencher `VLO-P5VBLX`, buscar e ver o card `APROVADO`
- pedido inexistente: preencher um código gerado, buscar e ver "Pedido não encontrado"

## `page` no `beforeAll`

`beforeEach` e `afterEach` recebem a mesma `page` do teste. O que você abrir ali continua valendo na hora do `test`.

`beforeAll` e `afterAll` também aceitam `{ page }`, mas essa página vive só dentro do gancho. O Playwright fecha ela assim que o gancho termina. O teste seguinte ganha outra `page`, em branco. Por isso navegar até **Consultar Pedido** no `beforeAll` não adianta: o teste não herda essa tela.

Quem abre a tela para cada teste é o `beforeEach`. Se o gancho só faz `console.log`, o `{ page }` nem precisa estar lá:

```ts
test.beforeAll(async () => {
  console.log('beforeAll: Roda antes de todos os testes')
})
```

`beforeAll` roda uma vez por worker, não uma vez no mundo. Com testes em paralelo, o log pode aparecer mais de uma vez: cada worker executa o gancho dele.
