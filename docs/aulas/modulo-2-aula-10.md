# Módulo 2 — Aula 10: Timeout no Playwright

Notas da configuração em `velo/playwright.config.ts`.

Timeout é o tempo máximo que o Playwright espera antes de falhar. O número é sempre em **milissegundos**. `5_000` é 5 segundos. O `_` não muda o valor; só deixa o número mais fácil de ler. `10_000` e `10000` são a mesma coisa.

Cada timeout cuida de uma coisa diferente. Eles convivem: um teste pode estourar o relógio da ação e, ao mesmo tempo, ainda estar dentro do relógio do teste inteiro.

## Os quatro tempos deste projeto

```ts
export default defineConfig({
  timeout: 60_000,

  expect: {
    timeout: 5_000,
  },

  use: {
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
  },
})
```

| Config | Neste projeto | Padrão do Playwright | O que ele cronometra |
| --- | --- | --- | --- |
| `timeout` | 60 s | 30 s | O teste inteiro, do começo ao fim |
| `expect.timeout` | 5 s | 5 s | Cada `expect` (`toBeVisible`, `toContainText`, …) |
| `actionTimeout` | 5 s | `0` | Cada ação (`click`, `fill`, …) |
| `navigationTimeout` | 10 s | `0` | Cada navegação (`goto`, `reload`, …) |

`0` em `actionTimeout` ou `navigationTimeout` significa “sem relógio próprio”. A ação pode demorar o quanto precisar, até o `timeout` do teste inteiro cortar. Por isso a aula diz que `0` herda o timeout do teste.

## `timeout`: o teste inteiro

É o relógio grande. Neste projeto, um teste tem no máximo 60 segundos para abrir a página, buscar o pedido e validar o resultado. O padrão do Playwright é 30 segundos.

Se a soma de tudo passar de 60 s, o teste falha mesmo que uma ação isolada ainda esteja dentro do próprio limite.

```ts
timeout: 60_000 // 60s. Padrão: 30s
```

## `expect.timeout`: cada conferência

Cada `expect` espera o resultado aparecer, tentando de novo até dar certo ou estourar o tempo. Aqui o limite é 5 segundos, que já é o padrão.

```ts
expect: {
  timeout: 5_000 // 5s para toBeVisible, toContainText, etc.
}
```

Na Aula 9 o card do pedido usa um tempo só naquela linha:

```ts
await expect(card).toBeVisible({ timeout: 10_000 })
```

Esse `{ timeout: 10_000 }` vale **apenas para esse** `expect`. Ele substitui os 5 s da config. Os `expect` seguintes, sem esse objeto, continuam com 5 s.

## `actionTimeout`: cada clique e cada digitação

`click`, `fill` e ações parecidas esperam o elemento ficar pronto para a ação (visível e habilitado). Se em 5 s o botão não puder ser clicado, aquela linha falha. O teste não fica parado até os 60 s.

```ts
actionTimeout: 5_000 // 5s para click, fill, etc.
```

O padrão é `0`: a ação não tem limite próprio e só para quando o teste inteiro estoura.

Dá para mudar uma ação só, do mesmo jeito que no `expect`:

```ts
await page.getByRole('button', { name: 'Buscar Pedido' }).click({ timeout: 2_000 })
```

## `navigationTimeout`: cada ida de página

`goto` e `reload` esperam a navegação terminar. Aqui o limite é 10 segundos. Abrir `http://localhost:5173/` pode demorar mais que um clique, por isso este número é maior que o `actionTimeout`.

```ts
navigationTimeout: 10_000 // 10s para goto, reload, etc.
```

O padrão também é `0`: sem limite próprio, vale o timeout do teste.

## Qual relógio ganha

Do mais específico para o mais geral:

1. O `{ timeout }` escrito na linha do teste.
2. `actionTimeout`, `navigationTimeout` ou `expect.timeout`, conforme a linha seja ação, navegação ou `expect`.
3. O `timeout` do teste inteiro, que continua valendo por cima de todos. Nenhuma linha pode fazer o teste passar de 60 s.

Exemplo com o pedido aprovado:

- `page.goto(...)` usa `navigationTimeout` (10 s).
- `fill` e `click` usam `actionTimeout` (5 s).
- `toBeVisible({ timeout: 10_000 })` espera até 10 s, ignorando os 5 s do `expect`.
- `toContainText` e os outros `expect` usam os 5 s da config.
- Se tudo isso junto passar de 60 s, o `timeout` do teste falha o caso.
