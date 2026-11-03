# Gerar o APK pelo EAS Build e instalar

## Caminho mais simples no Windows

Extraia todo o ZIP, entre em `ritmo-estudos-poo` e dê duplo clique em `GERAR_APK.cmd`. O script muda para a pasta correta, instala, testa, verifica dependências, solicita login Expo quando necessário, vincula o projeto e inicia o build Android com o perfil `preview`.

Mantenha o terminal aberto até o EAS terminar. O script então baixa o APK e registra o ID do build e o SHA-256. Se o computador bloquear o arquivo de comando baixado, abra a pasta no VS Code e use os comandos abaixo.

## Comandos equivalentes

Na pasta que contém `package.json`:

```powershell
npm ci
npm test
npm run check
npx --yes eas-cli@27.2.0 login
npx --yes eas-cli@27.2.0 init
npm run apk:build
npm run apk:download
```

O processo fornecido usa o fluxo No VCS do EAS e fixa EAS_PROJECT_ROOT na pasta absoluta do app. Não é necessário inicializar um repositório para esse fluxo. A configuração é aplicada internamente pelo comando npm run apk:build e pelo GERAR_APK.cmd.

No `init`, escolha a sua conta e confirme a criação ou vinculação do projeto `ritmo-estudos-poo`. O EAS adiciona o `projectId` real ao `app.json`. O pacote não contém um ID inventado ou pertencente a outra conta.

No primeiro build Android deste app, escolha gerar uma nova keystore quando o EAS perguntar. Se o projeto já foi assinado, reutilize a chave correta. O perfil usa uma compilação de instalação direta, com o JavaScript incluído no aplicativo.

## Configuração fornecida

```json
{
  "cli": { "version": ">= 27.2.0", "appVersionSource": "local" },
  "build": {
    "preview": {
      "distribution": "internal",
      "developmentClient": false,
      "android": { "buildType": "apk" }
    }
  }
}
```

- Versão do app: `2.0.0`.
- `android.versionCode`: `2`.
- Pacote: `com.diego.ritmoestudospoo`.
- Perfil de build: `preview`.
- O APK esperado fica em `evidencias/apk/Ritmo-2.0.0.apk` depois do download.

## Acompanhar e baixar

Se o terminal for fechado durante o build:

```powershell
npx --yes eas-cli@27.2.0 build:list --platform android --limit 5
```

Espere a situação finalizada na página do build. Depois execute `npm run apk:download`. O script seleciona o build Android finalizado mais recente do perfil `preview`, da versão `2.0.0` e deste identificador de app. Também é possível baixar o `.apk` pelo link oferecido pelo EAS.

Se houver vários builds da mesma versão, confira o ID e a data do build que será entregue. O processo não deve selecionar um APK de outra atividade.

## Instalação e prova de funcionamento

1. Transfira o `.apk` para o Android, ou abra o link do build no navegador do aparelho.
2. Abra o arquivo e permita a instalação para o aplicativo que você está usando, quando o Android solicitar.
3. Instale o Ritmo e abra pelo ícone próprio.
4. Encerre o Expo Go e o servidor Metro no computador.
5. Cadastre uma disciplina, uma sessão e uma meta por sessões no APK.
6. Agende e conclua uma revisão; confira a sessão e o progresso.
7. Inicie um foco de 1 minuto, pause e retome. Salve ao terminar.
8. Feche completamente o Ritmo, reabra e mostre os registros preservados.
9. Repita uma consulta ou cadastro em modo avião para comprovar operação local.
10. Guarde capturas e um vídeo curto em `evidencias/instalacao/` e preencha `REGISTRO_DA_INSTALACAO.md`.

A instalação de APKs diretamente pode exigir ajustes adicionais conforme o fabricante. Registre a instalação no aparelho escolhido; não conclua a evidência apenas mostrando o app dentro do Expo Go.

## Falhas frequentes

| Mensagem                           | Ação                                                                                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json` não encontrado      | Execute dentro de `ritmo-estudos-poo` ou use o arquivo `.cmd` fornecido.                                                               |
| `An Expo user account is required` | Execute o login no EAS CLI e repita o build.                                                                                             |
| `projectId` ausente                | Execute `eas init` pela versão do CLI indicada.                                                                                          |
| Rede indisponível no `check`       | Restaure a conexão e tente novamente. Uma conferência local pode ser feita com `EXPO_OFFLINE=1`, mas o build remoto precisa de internet. |
| Download sem build finalizado      | Aguarde a conclusão no EAS e execute `npm run apk:download` novamente.                                                                   |
| Android não permite atualizar      | Confira pacote e assinatura. Desinstalar a versão anterior apaga seus dados locais; preserve-os antes se forem necessários.              |
| Build falhou                       | Guarde o link e o trecho do log com o primeiro erro. Um bundle exportado não comprova um build nativo bem-sucedido.                      |

Referências: https://docs.expo.dev/build-reference/apk/ e https://docs.expo.dev/build/setup/.

## Se o erro de compactação citar AppData

Isso indica que o empacotamento está alcançando uma raiz acima do aplicativo. Use o GERAR_APK_SEM_GIT.cmd fornecido: copie-o para a pasta com package.json, app.json, eas.json e .easignore e abra-o. Ele fixa as duas variáveis dentro do próprio processo, independentemente da janela de terminal de onde foi iniciado.

A validação do script não comprova upload ou build remoto; a confirmação é a conclusão real no EAS. O fluxo No VCS é documentado em https://docs.expo.dev/build-reference/project-upload/.
