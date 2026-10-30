# Ritmo — Organizador de Estudos

Projeto mobile individual do **Tema 2**. Desenvolvido em **React Native com Expo e JavaScript**, com persistência local em **SQLite**. O código usa classes, campos privados, validações, repositórios SQL e tratamento de erros.

## Como executar

1. Extraia o ZIP inteiro. Entre na pasta `organizador-estudos`, que contém `package.json`, `App.js` e `package-lock.json`.
2. Abra essa pasta no VS Code e abra o terminal nela.
3. Execute:

```powershell
npm ci
npm start
```

No Android, abra o projeto pelo QR Code no **Expo Go compatível com SDK 58**. Computador e celular devem estar na mesma rede. O SQLite já está incluído no Expo Go compatível; não é necessário servidor, conta, Firebase nem um banco externo.

Se o dispositivo não conseguir alcançar o computador pela rede local, tente:

```powershell
npx expo start --tunnel
```

O Expo pode solicitar a instalação do suporte a túnel. Essa opção precisa de acesso à internet durante o desenvolvimento.

### Requisitos do ambiente

- Node.js **22 LTS a partir de 22.13**, ou **24 LTS a partir de 24.3**. O Node **22.21.1 é compatível** com este projeto.
- npm e Expo Go para SDK 58 no Android, ou ambiente de desenvolvimento compatível.
- Dependências fixadas pelo `package-lock.json`; prefira `npm ci`.
- Versões usadas: Expo 58, React 19.3, React Native 0.88.1 e `expo-sqlite` 58.

Para instalar um Expo Go compatível com o SDK do projeto, consulte <https://expo.dev/go>. A versão publicada na loja pode diferir do SDK desejado. Em iPhone físico, confira as opções oficiais para a versão correspondente antes de executar; este pacote prioriza o fluxo Android.

### Se aparecer um erro

| Erro                                             | Como resolver                                                                                            |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `ENOENT` ou `package.json` não encontrado        | Abra o terminal na pasta que contém o `package.json` deste projeto. Não execute na pasta acima.          |
| Projeto incompatível com Expo Go                 | Confira a versão do cliente. Este projeto usa SDK 58. Instale o cliente correspondente em `expo.dev/go`. |
| Cache antigo ou importação de outro projeto      | Pare o terminal e execute `npm run start:clean`.                                                         |
| Dependências divergentes após alterações manuais | Execute `npx expo install --fix` e depois `npm run check`.                                               |
| QR Code não abre                                 | Verifique a mesma rede, o firewall e a disponibilidade do modo `--tunnel`.                               |

Não é necessário criar um projeto novo nem copiar arquivos para outro aplicativo. O ZIP contém o projeto completo.

## Funcionalidades

### Resumo

- Tempo de estudo na semana e no histórico completo.
- Quantidade de sessões e sequência de dias estudados.
- Gráfico dos últimos sete dias e distribuição do tempo por disciplina.
- Metas em andamento e últimas sessões.
- Botão opcional para carregar exemplos quando o aplicativo estiver vazio.

### Disciplinas

- Cadastrar, consultar, editar e excluir nome, descrição e cor.
- Buscar por nome ou descrição.
- Ordenar por nome, tempo acumulado ou cadastro mais recente.
- Ver quantidade de sessões e tempo total.
- Impedir exclusão enquanto houver sessões ou metas vinculadas.

### Sessões

- Cadastrar, consultar, editar e excluir disciplina, conteúdo, duração, data e anotações.
- Buscar por conteúdo ou disciplina.
- Filtrar por disciplina, esta semana ou este mês.
- Ordenar por data ou duração.
- Mostrar a soma do tempo dos registros filtrados.

### Metas

- Cadastrar, consultar, editar e excluir título, disciplina opcional, minutos desejados, início e prazo.
- Criar metas gerais ou de uma disciplina específica.
- Filtrar por situação e disciplina; ordenar por prazo, progresso ou cadastro.
- Calcular automaticamente o progresso usando as sessões no intervalo da meta.
- Identificar metas em andamento, concluídas, planejadas ou com prazo encerrado.

## Regras de negócio

- Nome da disciplina: 2 a 60 caracteres; não pode se repetir sem diferenciar maiúsculas/minúsculas ASCII.
- Sessão: disciplina existente, conteúdo com pelo menos 2 caracteres, duração inteira entre 1 e 1.440 minutos e data válida que não esteja no futuro.
- Meta: título com 3 a 80 caracteres, tempo inteiro entre 1 e 100.000 minutos, início e prazo válidos. O prazo não pode anteceder o início.
- Datas na interface: `DD/MM/AAAA`; datas no banco: `AAAA-MM-DD`.
- Para manter as validações de datas simples, o intervalo de anos aceito é 2000 a 2100.
- Períodos de metas incluem as duas datas. Sessões fora do intervalo não contam.
- A mesma sessão pode contribuir para mais de uma meta sobreposta. Os indicadores de tempo somam as sessões uma única vez.
- Uma meta concluída mantém esse status após o prazo. Alterar ou excluir uma sessão pode reduzir seu progresso e mudar seu status.
- A semana começa na segunda-feira. A sequência considera dias consecutivos a partir de hoje ou de ontem, até terminar o dia atual.
- Alterações e exclusões são refletidas nos indicadores; o progresso não é digitado manualmente.

## Organização do código

```text
organizador-estudos/
  App.js                       Inicialização, navegação e conexão SQLite
  index.js                     Registro do componente principal
  app.json                     Configuração do Expo
  metro.config.js              SQLite/WebAssembly na versão web
  package.json                 Dependências e comandos
  package-lock.json            Instalação reproduzível
  src/
    components/
      UI.js                    Componentes visuais e confirmações
      EntityForm.js            Formulários de cadastro e edição
    context/
      StudyContext.js          Atualização das telas e tratamento de erros
    database/
      schema.js                Tabelas, índices, integridade e migração
    models/
      Subject.js               Classe da disciplina e campos privados
      StudySession.js          Classe da sessão e validações
      Goal.js                  Classe da meta, progresso e situação
      ValidationError.js       Exceções de validação
    repositories/
      StudyRepository.js       CRUD, JOIN, filtros e ordenação com SQL
    services/
      StudyService.js          Regras de negócio e indicadores
    screens/
      DashboardScreen.js       Tela Resumo
      ManageScreens.js         Disciplinas, sessões e metas
    utils/
      dates.js                 Datas e duração
      errors.js                Mensagens compreensíveis
    theme.js                   Cores e estilos compartilhados
  tests/
    study.test.js              Testes de integração e regras
    helpers/sqliteAdapter.js   SQLite real para os testes no Node
  capturas/                    Capturas reais do Expo web em tamanho mobile
  docs/
    APRESENTACAO.md            Roteiro individual e explicação do código
    REQUISITOS.md              Mapeamento dos critérios da atividade
    VALIDACAO.md               Ambiente, testes e limites da verificação
```

## Persistência e banco de dados

O arquivo `ritmo-estudos.db` é aberto pelo `expo-sqlite` no armazenamento local do aplicativo. A conexão executa `PRAGMA foreign_keys = ON`, ativa WAL e verifica `PRAGMA user_version` para aplicar a migração inicial.

O banco possui três tabelas: `subjects`, `sessions` e `goals`. Sessões sempre pertencem a uma disciplina. Metas podem pertencer a uma disciplina ou abranger todas. Chaves estrangeiras usam `ON DELETE RESTRICT` para preservar o histórico.

Todos os dados preenchidos são enviados ao SQLite com parâmetros `?`. As opções de `ORDER BY` vêm de listas fechadas. O aplicativo não interpola textos do usuário dentro do SQL.

### Como demonstrar que os dados permanecem salvos

1. Cadastre uma disciplina chamada `Teste de persistência`.
2. Registre uma sessão de 30 minutos com a data atual nessa disciplina.
3. Crie uma meta de 60 minutos, com início hoje e prazo daqui a sete dias. O progresso será 50%.
4. Feche completamente o aplicativo e reabra o mesmo projeto no mesmo Expo Go.
5. Mostre os registros nas três telas e o progresso calculado.
6. Edite a duração para 60 minutos e confira a meta concluída.

Reiniciar o app ou o servidor de desenvolvimento não apaga o arquivo. Desinstalar o cliente/aplicativo ou limpar seus dados remove o armazenamento local. A versão web e o celular têm bancos separados.

## Validação e execução no computador

```powershell
npm test
npm run check
npm run export:android
```

Os testes usam o SQLite real do Node, exercitando os mesmos modelos, serviços, consultas e esquema usados no app. A exportação Android verifica a geração do bundle JavaScript; não cria um APK.

Para visualizar no navegador:

```powershell
npm run web
```

O `metro.config.js` habilita WebAssembly e os cabeçalhos necessários para SQLite no navegador. Use um navegador moderno e a URL oferecida pelo Expo, sem abrir o HTML diretamente. Essa opção também permite demonstrar a interface no computador. Se publicar uma exportação web fora do Expo, o servidor deverá manter esses cabeçalhos.

As capturas fornecidas são da aplicação real executada no Expo web com viewport mobile e dados de exemplo. Para comprovar a execução no dispositivo, faça também suas próprias capturas no celular durante a apresentação.

## Referências técnicas

- Expo SDK: <https://docs.expo.dev/versions/latest/>
- Expo SQLite: <https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/>
- Compatibilidade do Expo Go: <https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/>
- Cliente compatível por plataforma: <https://expo.dev/go>

Leia `docs/APRESENTACAO.md` para demonstrar o aplicativo e explicar a implementação com suas próprias palavras.
