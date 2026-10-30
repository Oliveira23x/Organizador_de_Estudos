# Validação da entrega

Verificação concluída em **29/10/2026**.

## Ambiente utilizado

- Node.js 24.22.1 e npm 11.9.0 em Linux.
- Expo SDK 58, React 19.3.0 e React Native 0.88.1.
- Expo web com SQLite/WebAssembly real, em Chromium 133.
- Interface conferida em viewports de 390 × 844 e 360 × 800 pixels.

## Resultados

| Verificação | Resultado |
| --- | --- |
| `npm test` | 12 testes aprovados; 0 falhas |
| `npm run check` | Dependências alinhadas ao SDK |
| `npm run export:android` | Bundle Android gerado com sucesso pelo Metro/Hermes |
| Fluxo da interface web | 13 verificações concluídas; 0 erros JavaScript não tratados |
| Persistência no teste SQLite | Arquivo fechado, reaberto e consultado com os registros preservados |
| Persistência na interface web | Aplicação recarregada com os registros editados preservados |
| Capturas | 8 imagens reais incluídas |

### Testes fornecidos no projeto

Os testes usam o SQLite real do Node e executam os mesmos modelos, serviço, repositórios e esquema do aplicativo. São cobertos:

1. Migração idempotente e integridade referencial.
2. CRUD de disciplinas, busca literal, ordenação e parâmetros.
3. Mensagem para nomes duplicados.
4. CRUD de sessões, JOIN, filtros e ordenação.
5. Rejeição de entradas inválidas antes da gravação.
6. Proteção de disciplinas com registros vinculados.
7. Metas por período e disciplina, cálculo da situação e CRUD.
8. Indicadores de tempo, semana, sequência e distribuição.
9. Encapsulamento e validações de metas.
10. Datas locais, mudança de ano e ano bissexto.
11. Inclusão transacional de exemplos sem sobrescrever registros.
12. Persistência após fechar e reabrir um arquivo SQLite.

### Fluxos verificados na interface

1. Inicialização do expo-sqlite no navegador e inclusão dos exemplos.
2. Cadastro, edição e busca SQL de disciplina pela interface.
3. Validação de zero minuto, correção e gravação de sessão pela interface.
4. Meta vinculada calculada em 50% a partir da sessão de 30 minutos.
5. Edição da sessão atualiza a meta automaticamente para 100% e concluída.
6. Bloqueio da exclusão de disciplina com registros vinculados.
7. Sessão editada permanece disponível após recarregar a aplicação.
8. Cancelar exclusão preserva o registro; exclusões confirmadas removem sessão, meta e disciplina.
9. Filtro por período e ordenação por duração disponíveis na interface.
10. Edição de meta pela interface concluída e título original restaurado.
11. Filtro SQL de metas concluídas confere o resultado esperado.
12. Nome duplicado identificado por consulta SQLite antes de salvar, com mensagem compreensível.
13. Layout conferido em larguras de 390 e 360 pixels, sem overflow horizontal da página.

## Alcance da verificação

A execução visual foi verificada no Expo web usando os componentes React Native do projeto e o SQLite do pacote `expo-sqlite`. A exportação Android valida o bundle e a resolução das dependências nativas. A abertura no Expo Go em aparelho físico ou emulador ainda deve ser conferida pelo aluno no ambiente da apresentação.

O ZIP contém o projeto-fonte completo. As dependências são instaladas com `npm ci`. A exportação de validação não é distribuída como APK; o fluxo de execução da entrega usa o Expo Go compatível ou ambiente de desenvolvimento compatível.

## Como reproduzir

Na pasta do projeto:

```powershell
npm ci
npm test
npm run check
npm run export:android
npm start
```

Para repetir a conferência visual no computador, execute `npm run web` e siga o roteiro em `APRESENTACAO.md`. Para a entrega individual, demonstre também fechar completamente e reabrir o aplicativo no mesmo dispositivo.
