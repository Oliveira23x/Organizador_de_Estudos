# Ritmo Estudos POO - Novo projeto completo

Projeto separado em `ritmo-estudos-poo`, baseado no aplicativo atualizado. Inclui a implementação de **herança e polimorfismo** nas regras reais das metas: `Goal` é a classe base abstrata, e `TimeGoal` e `SessionGoal` são as subclasses concretas. Cada uma sobrescreve métodos usados pelo cálculo herdado de progresso.

Para conferir os conceitos no código e preparar sua explicação, leia `docs/HERANCA_E_POLIMORFISMO.md` e execute `npm run demo:poo`.

O novo projeto possui slug Expo e identificador Android próprios. Os arquivos são completos e podem ser executados após extrair o ZIP e instalar as dependências.

Evolução do projeto individual da Atividade 1, em **React Native + Expo + JavaScript + SQLite**. A versão acrescenta agenda de revisões, cronômetro de foco persistente e metas por quantidade de sessões. Herança e polimorfismo são usados nas regras das metas.

## Começar sem erro de pasta

1. Extraia **todo** o ZIP.
2. Abra a pasta `ritmo-estudos-poo`, que contém `package.json`, `App.js`, `INICIAR.cmd` e `GERAR_APK.cmd`.
3. No Windows, dê duplo clique em **INICIAR.cmd** para testar, ou em **GERAR_APK.cmd** para instalar dependências, testar, entrar na sua conta Expo e gerar o APK.

Para usar o terminal do VS Code, abra essa mesma pasta e execute:

```powershell
npm ci
npm start
```

O projeto usa Expo SDK 58. Use o Expo Go compatível em Android ou um ambiente compatível. O APK produzido pelo perfil `preview` funciona como aplicativo próprio, sem depender do Expo Go ou do servidor de desenvolvimento.

Node.js: linha 22 LTS a partir de 22.13, ou linha 24 LTS a partir de 24.3. O Node 22.21.1 atende. Versões fixadas em `package-lock.json`.

## Situação desta entrega

- Código atualizado: concluído.
- Herança e polimorfismo: implementados e testados.
- Novas funcionalidades e filtros: implementados e testados.
- Testes: 24 com SQLite real e 14 verificações na interface web.
- Bundle Android: exportado com sucesso.
- APK pelo EAS: **pendente de autenticação na sua conta Expo**.
- Instalação e execução do APK em Android: **pendentes de teste no dispositivo**.

A tentativa de iniciar o EAS neste ambiente retornou `An Expo user account is required to proceed.`. Portanto, não existe APK gerado nesta entrega. `eas.json` está configurado para produzi-lo, e `GERAR_APK.cmd` executa o processo na sua conta. Veja `docs/GERAR_APK.md`.

## O que mudou

### 1. Agenda de revisões

Aba **Planejar > Agenda de revisões**. Cadastro, consulta, edição e exclusão de revisões com disciplina, data, duração prevista, prioridade e notas. Filtros por disciplina, situação, atraso e prioridade; busca e ordenação SQL. Ao concluir, o usuário confirma o tempo real e uma sessão é criada no histórico na mesma transação. Repetir a conclusão não duplica o estudo. Excluir uma revisão não apaga sessões já registradas.

### 2. Cronômetro de foco com retomada

Aba **Planejar > Cronômetro de foco**. Seleção de disciplina e conteúdo, duração entre 1 e 180 minutos, pausa, retomada, descarte com confirmação e salvamento do tempo estudado. O estado é persistido em SQLite; o tempo continua contando ao sair ou fechar o app, até o limite escolhido. A sessão só é salva com confirmação e com pelo menos um minuto completo. O dia do estudo é a data em que o usuário conclui o foco. O cronômetro não emite alarmes em segundo plano.

### 3. Metas por quantidade de sessões

Além das metas por tempo, o aluno pode definir uma quantidade de sessões no período. Os objetos concretos `TimeGoal` e `SessionGoal` herdam de `Goal` e sobrescrevem métodos usados no cálculo. As listas consultam `SUM` ou `COUNT`, conforme o tipo, e permitem filtrar por tipo, título, situação e disciplina.

### Interface e consultas

Navegação em cinco áreas, atalhos para planejamento, alertas de revisões para hoje e atrasadas, filtros recolhíveis, indicação de filtros ativos e limpeza de filtros. Sessões agora aceitam intervalo de datas personalizado validado e faixas de duração, com SQL parametrizado.

## POO: pontos para mostrar ao professor

| Conceito          | Evidência no código                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Classes e objetos | Modelos, serviços, repositórios e objetos instanciados pelo serviço                                                         |
| Encapsulamento    | Campos privados `#data`, getters e cópias em `toRecord()`                                                                   |
| Herança           | `class TimeGoal extends Goal` e `class SessionGoal extends Goal`                                                            |
| Polimorfismo      | `goal.progress(record)` chama `currentValue()` e `targetValue()` sobrescritos por cada subtipo                              |
| Sobrescrita       | `currentValue`, `targetValue` e `progressLabel` nas duas subclasses                                                         |
| Comprovação       | Teste de uma coleção de objetos Goal com as mesmas métricas: meta de 120 minutos retorna 50%; meta de 4 sessões retorna 25% |

Arquivos principais: `src/models/Goal.js`, `TimeGoal.js`, `SessionGoal.js`, `GoalFactory.js`, `src/services/StudyService.js` e `tests/evolution.test.js`.

`Goal` não pode ser instanciada diretamente. Sua implementação de `progress()` é herdada pelos dois tipos e chama os métodos sobrescritos. Os testes confirmam a cadeia de herança e que o mesmo método herdado produz 50% para uma meta de 120 minutos e 25% para uma meta de quatro sessões, usando as mesmas métricas de 60 minutos e uma sessão.

```powershell
npm run demo:poo
```

## Organização

- `src/models/`: objetos e regras de domínio.
- `src/repositories/`: SQL parametrizado, CRUD, filtros e ordenação.
- `src/services/`: operações, integridade, cálculos e transações.
- `src/database/schema.js`: migração de schema 1 para 2 sem apagar registros.
- `src/screens/`: Resumo, Disciplinas, Sessões, Metas e Planejar.
- `src/components/`: formulários, componentes e mensagens.
- `tests/`: testes de integração com SQLite real e regras de domínio.
- `scripts/baixar-apk.cjs`: download de build finalizado e registro de ID e SHA-256.
- `eas.json`: perfil `preview` com `buildType: apk`.
- `docs/`: relatório, apresentação, requisitos, validação e guia do APK.
- `capturas/`: nove capturas reais da versão web em viewport mobile.
- `evidencias/`: resultados dos testes e formulário para evidências reais de instalação.

## Validar e gerar APK

```powershell
npm test
npm run check
npm run export:android
```

`export:android` valida o bundle JavaScript; ele não gera um APK. O APK é produzido com EAS Build:

```powershell
npx --yes eas-cli@27.2.0 login
npx --yes eas-cli@27.2.0 init
npm run apk:build
npm run apk:download
```

No primeiro build, confirme a criação do projeto na sua conta e permita que o EAS gere a chave Android se você ainda não tiver uma chave para este app. Se já houver uma chave, reutilize a correspondente. Não envie senha, token ou keystore pelo chat nem inclua essas credenciais na entrega.

O download guarda o APK em `evidencias/apk/Ritmo-2.0.0.apk` e os dados reais do build em `evidencias/BUILD_EAS.json`. A pasta do APK somente aparece quando um build real terminou e foi baixado.

## Persistência e migração

O arquivo continua sendo `ritmo-estudos.db`. A migração usa `PRAGMA user_version`, adiciona os tipos de metas e cria as tabelas de revisões e foco em uma transação. Disciplinas, sessões e metas antigas são preservadas. Em uma instalação existente, atualizações precisam manter o pacote e a assinatura para preservar o armazenamento. O Expo Go e o APK possuem armazenamentos separados; os dados não são transferidos automaticamente entre eles.

Ao excluir uma sessão que veio de revisão, a revisão continua concluída e seu vínculo com a sessão fica vazio. O progresso das metas é recalculado a partir do histórico existente.

Para demonstrar persistência no APK, cadastre dados nele, feche completamente, reabra o mesmo aplicativo e mostre os registros novamente. Não desinstale nem limpe os dados durante esse teste.

## Evidências de instalação

Siga `evidencias/REGISTRO_DA_INSTALACAO.md`. Registre o build EAS concluído, o APK, a instalação no Android, a abertura pelo ícone próprio e o funcionamento sem o Metro. As capturas web desta entrega demonstram a interface; a evidência do APK deve ser produzida no dispositivo real ou emulador.

## Referências

- EAS e APK: https://docs.expo.dev/build-reference/apk/
- Conta, credenciais e primeiro build: https://docs.expo.dev/build/setup/
- Expo SQLite: https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/

Consulte `docs/APRESENTACAO.md` e o PDF da apresentação para explicar suas decisões com suas próprias palavras.

## Correção do build que cita AppData

Os comandos GERAR_APK.cmd e npm run apk:build agora definem EAS_NO_VCS=1 e a raiz absoluta da pasta do aplicativo no próprio processo que inicia o EAS. Essa configuração evita que o empacotamento use um repositório Git localizado acima do projeto. Três testes adicionais verificam a seleção da raiz, o ambiente do processo filho e a rejeição de uma pasta incorreta.

Para corrigir uma cópia que já foi vinculada à conta Expo, coloque apenas GERAR_APK_SEM_GIT.cmd ao lado de package.json, app.json, eas.json e .easignore e abra esse arquivo. Ele preserva o app.json já configurado e repete a geração usando a pasta atual.
