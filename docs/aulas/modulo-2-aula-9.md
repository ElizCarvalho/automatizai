# Módulo 2 — Aula 9: Consultar pedido

Notas para lembrar o que foi praticado em `velo/playwright/e2e/pedidos.spec.ts`.

O teste ficou só com o caminho que usamos de verdade. As outras formas estão aqui, com o motivo de cada uma.

## Como rodar

Na pasta `velo`, com o app em `http://localhost:5173`:

```bash
# grava cliques e gera o teste sozinho
yarn playwright codegen http://localhost:5173/

# roda só este arquivo (browser escondido)
yarn playwright test pedidos.spec.ts

# abre o browser para ver o que acontece
yarn playwright test pedidos.spec.ts --headed

# abre a interface do Playwright (escolher teste, ver passo a passo)
yarn playwright test pedidos.spec.ts --ui

# pausa no primeiro passo e deixa você avançar com o debugger
yarn playwright test pedidos.spec.ts --debug
```

## Arrange, Act, Assert

Todo teste desta aula segue três partes. Não precisa escrever isso no código; é só o jeito de pensar.

| Parte | Em inglês | O que faz |
| --- | --- | --- |
| Preparar | Arrange (Given) | Abre a página, confere que chegou no lugar certo, deixa o dado pronto |
| Agir | Act (When) | Faz o que o usuário faria: digitar o pedido e clicar em buscar |
| Conferir | Assert (Then) | Olha o resultado e falha se não for o esperado |

**Checkpoint** é um `expect` no meio do Arrange. Ele confirma a tela antes da ação. Se falhar, o problema é a navegação, não a busca.

```ts
await page.goto('http://localhost:5173/')
await expect(page.getByTestId('hero-section').getByRole('heading')).toContainText('Velô Sprint')
await page.getByRole('link', { name: 'Consultar Pedido' }).click()
await expect(page.getByRole('heading')).toContainText('Consultar Pedido')
```

## Como achar um elemento

O Playwright oferece vários jeitos. Preferir o que uma pessoa enxerga (papel, nome, texto). `data-testid` entra quando o texto muda ou se repete. XPath fica como último recurso: quebra fácil se o HTML mudar de lugar.

### Pelo papel e pelo nome acessível (o que ficou no teste)

O `<label>Número do Pedido</label>` dá nome ao input. O botão mostra o texto `Buscar Pedido`.

```ts
await page.getByRole('textbox', { name: 'Número do Pedido' }).fill(orderId)
await page.getByRole('button', { name: 'Buscar Pedido' }).click()
```

`getByLabel` faz a mesma coisa no input, porque lê o `<label>`:

```ts
await page.getByLabel('Número do Pedido').fill(orderId)
```

### Pelo placeholder

O input tem `placeholder="Ex: VLO-ABC123"`. Serve quando não há label. Placeholder some quando a pessoa digita, então é mais frágil que o label.

```ts
await page.getByPlaceholder('Ex: VLO-ABC123').fill(orderId)
```

### Pelo `data-testid`

`getByTestId` acha o atributo `data-testid`. É estável porque não depende de texto traduzido nem da posição no HTML.

Na aula vimos estes exemplos. No app de hoje o input **não** tem `search-order-id`, e o `data-testid` do botão está comentado em `OrderLookup.tsx`. Por isso o teste usa `getByRole`.

```ts
await page.getByTestId('search-order-id').fill(orderId)
await page.getByTestId('search-order-button').click()
```

### Por XPath

XPath descreve o caminho no HTML. Funciona, mas é difícil de ler e quebra se alguém embrulhar o input em outra `div`.

```ts
// sobe do label para o pai (/..) e pega o input irmão
await page.locator('//label[text()="Número do Pedido"]/../input').fill(orderId)

// botão cujo texto é exatamente "Buscar Pedido"
await page.locator('//button[text()="Buscar Pedido"]').click()
```

## Esperar o resultado aparecer

A busca é assíncrona. O card não existe no instante do clique.

`waitForTimeout(10000)` **sempre** dorme 10 segundos, mesmo se o card apareceu em 200 ms. O teste fica lento à toa. Não usar.

`expect(...).toBeVisible({ timeout: 10_000 })` tenta de novo até achar o elemento ou estourar 10 segundos. Se aparecer rápido, o teste segue na hora. O `_` em `10_000` é só leitura: vale `10000`.

```ts
const card = page.getByTestId(`order-result-${orderId}`)
await expect(card).toBeVisible({ timeout: 10_000 })
```

## Assert do pedido aprovado

O card do resultado tem `data-testid={`order-result-${id}`}` (`order-result-VLO-P5VBLX`). Procurar o código e o status **dentro** desse card evita achar outro "APROVADO" solto na página.

`{ exact: true }` exige o texto inteiro. Sem isso, `APROVADO` também casaria com um texto maior que só contém essa palavra.

```ts
const card = page.getByTestId(`order-result-${orderId}`)
await expect(card).toBeVisible({ timeout: 10_000 })
await expect(card.getByText(orderId, { exact: true })).toBeVisible()
await expect(card.getByText('APROVADO', { exact: true })).toBeVisible()
```

Esse é o assert que ficou no teste.

### Outras formas vistas na aula (desafio)

O HTML do card é mais ou menos assim:

```html
<div data-testid="order-result-VLO-P5VBLX">
  <div>
    <p>Pedido</p>
    <p>VLO-P5VBLX</p>
  </div>
  <!-- algumas divs acima, o status -->
  APROVADO
</div>
```

**XPath até o código.** `//p[text()="Pedido"]` acha o parágrafo. `/..` sobe para o pai. `//p[text()="VLO-P5VBLX"]` procura o código dentro desse pai.

```ts
const orderCodeLocator = page.locator('//p[text()="Pedido"]/..//p[text()="VLO-P5VBLX"]')
await expect(orderCodeLocator).toBeVisible()
```

**Sem XPath, subindo para o pai.** `getByRole('paragraph')` é o `<p>`. `hasText: /^Pedido$/` exige o texto exato (`^` começa, `$` termina). `.locator('..')` sobe um nível, igual ao `/..` do XPath. Aí o pai precisa conter o código.

```ts
const containerPedido = page
  .getByRole('paragraph')
  .filter({ hasText: /^Pedido$/ })
  .locator('..')

await expect(containerPedido).toContainText('VLO-P5VBLX', { timeout: 10_000 })
```

**Status subindo níveis.** `/../..` sobe dois pais. `/../../..` sobe três, até o bloco que também tem `APROVADO`. O mesmo com dois `.locator('..')` a partir do container do código.

```ts
const statusLocator = page
  .locator('//p[text()="Pedido"]/../../..')
  .getByText('APROVADO', { exact: true })
await expect(statusLocator).toBeVisible()

const containerStatus = containerPedido.locator('..').locator('..')
await expect(containerStatus).toContainText('APROVADO')
```

Essas formas ensinam a ler a árvore do HTML. No teste do dia a dia o `data-testid` do card é mais seguro: não depende de quantas `div` existem em volta.

## Pedido que não existe

O segundo teste gera um código com `generateOrderCode()` para não bater num pedido real.

`level: 3` pede um heading `h3`. A página usa `<h3>Pedido não encontrado</h3>`. Se alguém trocar para `h2`, o teste falha e avisa.

```ts
const titleLocator = page.getByRole('heading', {
  name: 'Pedido não encontrado',
  level: 3,
})
await expect(titleLocator).toBeVisible()

const messageLocator = page.locator('p', {
  hasText: 'Verifique o número do pedido e tente novamente',
})
await expect(messageLocator).toBeVisible()
```

### Snapshot de acessibilidade

O codegen também grava um retrato dos papéis da região (imagem, heading, parágrafo). `toMatchAriaSnapshot` compara a página com esse retrato. Se o texto ou o nível do heading mudar, o teste quebra.

```ts
await expect(page.locator('#root')).toMatchAriaSnapshot(`
  - img
  - heading "Pedido não encontrado" [level=3]
  - paragraph: Verifique o número do pedido e tente novamente
`)
```

`#root` é a div onde o React monta a página. O snapshot olha o que está acessível ali, não o CSS.
