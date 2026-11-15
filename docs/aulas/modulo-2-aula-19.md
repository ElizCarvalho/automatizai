# Módulo 2 — Aula 19: Trace

Notas de `trace` em `velo/playwright.config.ts`.

Trace é a gravação de uma execução. O Playwright guarda o que a página fez em cada passo e entrega um `trace.zip`. Você abre esse zip e assiste o teste de novo, com a tela, a ação e o erro no mesmo lugar.

```ts
use: {
  trace: 'on-first-retry',
}
```

## As três opções da aula

| Valor | O que acontece | Quando usar |
| --- | --- | --- |
| `'off'` | Não grava nada. A suíte roda mais rápido | Dia a dia, quando você não precisa revisar a execução |
| `'on'` | Grava e guarda o zip de todo teste, passou ou falhou. A execução demora mais | Mostrar um cenário, investigar, ou gerar evidência |
| `'retain-on-failure'` | Grava todo teste e apaga o zip se ele passou. Sobram só as falhas | Suíte já confiável: não precisa provar o teste que passou, só entender o que quebrou |

`'off'` é o mais rápido porque o Playwright não tira foto nem copia a página durante o teste.

`'on'` é o mais pesado. Cada passo vira informação no zip, então o teste leva mais tempo e ocupa mais disco.

`'retain-on-failure'` não fica rápido como `'off'`. A gravação acontece do mesmo jeito. A diferença é no fim: se o teste passou, o zip é apagado. O que você vê na pasta é o trace das falhas. Combina com um time que já confia na automação e não precisa anexar prova de todo cenário verde.

## O que o zip guarda

No Trace Viewer cada painel é uma dessas gravações:

- **Actions.** A lista do que o teste fez, na ordem: `goto`, `click`, `fill`, `expect`.
- **Timeline.** Uma faixa de fotos da tela ao longo do tempo. Dá para arrastar e ver o momento em que a página mudou.
- **Snapshots.** Cópia da página antes e depois de cada ação. Dá para inspecionar o HTML daquele instante, não só a foto.
- **Console.** O que o browser escreveu no console.
- **Network.** Cada request: URL, status e o tempo.
- **Source.** O trecho do teste que executou aquela ação.
- **Errors.** A mensagem e o passo em que o teste quebrou.

A timeline cobre o papel dos prints soltos: cada passo já tem a tela correspondente, sem alguém tirar foto no meio.

## Como abrir

O zip fica em `velo/test-results/`, numa pasta com o nome do teste. Na pasta `velo`:

```bash
yarn playwright show-trace test-results/caminho/trace.zip
```

O relatório HTML (`yarn playwright show-report`) também abre o trace do teste.

Quem não tem o projeto abre [trace.playwright.dev](https://trace.playwright.dev/) e solta o zip na página. O arquivo é lido no browser; o site não envia a gravação para um servidor.

Para gravar uma execução sem mudar a config:

```bash
yarn playwright test pedidos.spec.ts --trace on
```

## O que está no arquivo hoje

A config está em `'on-first-retry'`. Esse valor grava o trace só na primeira vez que um teste é repetido depois de falhar.

Nesta config a repetição está assim:

```ts
retries: process.env.CI ? 2 : 0,
```

Na sua máquina `retries` é 0. Sem repetição, `'on-first-retry'` não gera zip. No CI, o teste falha uma vez sem trace e a primeira retentativa é que grava.

## Zip no card do Jira

Sim. O `trace.zip` pode ser a evidência do cenário no card, no lugar de uma sequência de prints.

Um comentário com o zip substitui vários anexos. Quem revisa baixa o arquivo e abre no Trace Viewer: vê a tela de cada passo, a ação e, se quebrou, o erro. A pessoa de QA deixa de capturar e subir print por print daquele fluxo automatizado.

Um jeito prático:

1. Rodar o cenário com `--trace on`, ou deixar `'retain-on-failure'` e usar o zip da falha.
2. Anexar o `trace.zip` num comentário do card.
3. Escrever o que o arquivo mostra, por exemplo: "consulta do pedido VLO-P5VBLX aprovado".

Os prints manuais continuam úteis no que a automação não cobre. O trace documenta o caminho que o teste percorreu.

Dois limites:

- O Jira recusa anexo grande. No Jira Cloud o teto comum é 100 MB por arquivo. Um trace de fluxo longo, com `'on'`, pode passar disso.
- O zip inclui a rede e a tela. Se o teste mostrar dado de cliente, senha ou token, o card passa a guardar isso. Vale para evidência de teste; não vale para vazar segredo.
