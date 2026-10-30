# Lunar · PDF book viewer

Visualizador de PDF como livro, com virada de páginas, modo de página única, zoom, navegação pelo teclado e tela cheia. Interface em português, adaptada a celulares. O PDF é processado no navegador e não é enviado ao servidor. Limites: 50 MB e 500 páginas. Arquivos protegidos por senha devem ser desbloqueados antes de abrir. A visualização não certifica adequação para impressão.

## Desenvolvimento

Node.js 24 recomendado (mínimo 22).

```sh
npm ci
npm run dev
```

## Validação

```sh
npm test
npm run build
npm run preview
```

Os testes usam Chromium em `/usr/bin/chromium`; defina `CHROMIUM_PATH` se estiver em outro caminho. Eles geram PDFs e verificam upload, renderização, navegação, zoom, substituição, erro de arquivo inválido e layout móvel. Fontes, worker e recursos do PDF.js são servidos pela própria aplicação.

## Vercel

Importe `diariolunar/viewer` na Vercel com o preset Vite. O build é `npm run build` e a saída é `dist` (configurados em `vercel.json`). A aplicação não precisa de banco de dados nem de variáveis de ambiente. A publicação por CLI exige autenticação na Vercel:

```sh
npx vercel --prod --yes
```

Credenciais de publicação não devem ser incluídas no código, no Git ou em variáveis `VITE_*`.
