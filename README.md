# ChaCasaNova

Convite digital e lista de presentes do Chá de Casa Nova de J & Y. O projeto é uma página estática feita em HTML, CSS e JavaScript, pronta para GitHub Pages. As reservas compartilhadas são armazenadas no Cloud Firestore e atualizadas em tempo real.

## Arquitetura

- `index.html`: estrutura da página, hero, lista, modal e região de mensagens.
- `css/`: reset, variáveis visuais, estilos principais e ajustes responsivos.
- `js/presentes.js`: os 53 presentes, caminhos de imagens e links de exemplo.
- `js/firebase-config.js`: inicialização do Firebase Web SDK.
- `js/firebase-service.js`: escuta em tempo real e transação de reserva.
- `js/ui.js`: renderização dos cards, modal e toasts.
- `js/app.js`: estado da interface, validação e integração dos módulos.
- `assets/casal/`: fotografia principal de J & Y.
- `assets/presentes/`: fotos dos presentes e placeholder automático.
- `assets/decor/`: ilustrações leves usadas na composição.

## Executar localmente

Os arquivos JavaScript usam ES Modules. Por isso, abrir `index.html` diretamente com `file://` pode bloquear importações no navegador. Sirva a pasta por HTTP:

```bash
python -m http.server 5500
```

Depois acesse `http://localhost:5500`. A extensão Live Server do VS Code também funciona.

## Publicar no GitHub Pages

1. Envie o conteúdo deste repositório para o GitHub.
2. No repositório, abra **Settings > Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**.
4. Selecione a branch principal e a pasta `/ (root)`.
5. Salve e aguarde o endereço publicado.

Todos os caminhos públicos são relativos (`./assets`, `./css` e `./js`), então o site funciona em endereços como `usuario.github.io/cha-casa-nova/`.

## Atualizando o site sem cache antigo

Sempre que fizer um novo deploy com alterações visuais, CSS, JavaScript ou imagens, execute:

```bash
node scripts/update-version.mjs 2026.09.16.2
```

Use uma versão nova a cada publicação. O script atualiza automaticamente `js/version.js`, a cópia em `dist`, os parâmetros `?v=` do `index.html` e os imports locais versionados. Depois, faça commit e push normalmente.

Assim, arquivos como `styles.css?v=2026.09.16.2`, módulos JavaScript e imagens locais recebem uma URL nova, evitando que Chrome e outros navegadores reutilizem a versão antiga. URLs externas de lojas e do Firebase CDN não são alteradas.

## Trocar imagens e links

As 53 imagens otimizadas dos presentes estão em formato WebP, com fundo transparente ou claro conforme o produto, em `assets/presentes/`. Para substituir uma delas, mantenha exatamente o nome declarado em `js/presentes.js`, por exemplo `liquidificador.webp`. Enquanto o arquivo não existir, o site mostra `placeholder.svg`; nenhuma alteração de código é necessária.

Para trocar um link ou editar a lista, altere somente `js/presentes.js`. Use `exemploUrl: null` quando ainda não houver sugestão; o botão aparecerá como **Em breve**.

A fotografia principal otimizada está em `assets/casal/j-y.webp`; o JPEG original permanece como arquivo-fonte.

## Como funciona o Firestore

O site acompanha a coleção `reservas` com `onSnapshot`. Cada documento usa o ID do presente, por exemplo `reservas/liquidificador`. Uma reserva guarda apenas:

```js
{
  nome: "Nome da pessoa",
  reservadoEm: Timestamp
}
```

Ao confirmar, `runTransaction` verifica se o documento já existe e só cria a reserva se o item continuar disponível. Isso impede que duas pessoas escolham o mesmo presente. O nome não é exibido publicamente.

Para tornar um presente disponível novamente, abra o Firebase Console, entre em **Firestore Database > Data > reservas** e exclua manualmente o documento com o ID do presente. A página aberta será atualizada em tempo real.

## Segurança

A configuração Web do Firebase presente em `js/firebase-config.js` identifica o projeto no navegador e não é uma credencial administrativa. A proteção dos dados depende das regras configuradas no Firestore.

Nunca versione `serviceAccount.json`, chaves privadas, `client_secret`, credenciais do Firebase Admin ou arquivos `.env` com segredos. Eles já estão cobertos pelo `.gitignore`.

## Verificação antes de publicar

- Teste em desktop e celular.
- Confirme que os 53 cards aparecem e que imagens ausentes usam o placeholder.
- Confirme que **Exemplo** abre uma nova guia e que itens sem link mostram **Em breve**.
- Verifique modal, validação do nome, reserva, atualização entre duas abas e o estado após recarregar.
- Para o teste de concorrência, abra duas abas no mesmo item e confirme quase ao mesmo tempo; apenas uma transação deve vencer.
- Confira no Firebase Console se o documento foi criado com o ID correto.
