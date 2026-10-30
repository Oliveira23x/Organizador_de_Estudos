# Mapeamento da atividade

Tema escolhido: **Tema 2 — Organizador de estudos**.

| Requisito obrigatório                   | Implementação                                                                            | Como demonstrar                                                 |
| --------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Interface organizada e adequada ao tema | Quatro telas, componentes compartilhados, estados vazios e navegação inferior            | Abrir Resumo, Disciplinas, Sessões e Metas                      |
| Cadastro e validação                    | Classes `Subject`, `StudySession` e `Goal`; limites, campos obrigatórios e datas válidas | Tentar salvar uma sessão com zero minuto                        |
| SQLite local                            | `expo-sqlite`, arquivo `ritmo-estudos.db` e inicialização em `schema.js`                 | Fechar completamente e reabrir o app                            |
| Inclusão                                | `saveSubject`, `saveSession` e `saveGoal`, com `INSERT` parametrizado                    | Cadastrar disciplina, sessão e meta                             |
| Consulta                                | Métodos `list` nos repositórios, com `SELECT` e `JOIN`                                   | Abrir o histórico e consultar uma disciplina                    |
| Alteração                               | Métodos `save` com `UPDATE` quando há `id`                                               | Alterar o tempo de uma sessão                                   |
| Exclusão                                | Botões de lixeira, confirmação e `DELETE`                                                | Excluir uma sessão temporária                                   |
| Classes e objetos                       | Modelos, serviço e repositórios são classes; formulários geram instâncias dos modelos    | Mostrar `new StudySession(data)` no serviço                     |
| Encapsulamento                          | Campos privados `#id`, `#name` e `#data`, acessados por métodos                          | Mostrar `toRecord()` retornando uma cópia                       |
| Validações de negócio                   | Método `validate()` nos modelos e `ensureSubject()` no serviço                           | Informar data futura, disciplina inexistente ou prazo invertido |
| Filtros e ordenação SQL                 | `WHERE`, `LIKE`, datas e disciplina; `ORDER BY` com opções permitidas                    | Filtrar sessões por período e ordenar por duração               |
| Indicadores                             | `SUM`, `COUNT`, `GROUP BY`, série diária, sequência e progresso das metas                | Editar uma sessão e mostrar os indicadores atualizados          |
| Tratamento de erros                     | `try/catch` na conexão, consultas, mutações e transações; `readableError()`              | Tentar repetir o nome de uma disciplina                         |
| Permanência dos dados                   | Banco em arquivo local, reaberto ao iniciar                                              | Demonstrar o roteiro de persistência no README                  |

## Entregáveis

| Entregável                              | Local                                            |
| --------------------------------------- | ------------------------------------------------ |
| Código-fonte completo e organizado      | Raiz, pasta `src` e arquivos de configuração     |
| Aplicativo executável                   | Projeto Expo completo; instruções no `README.md` |
| Capturas das principais funcionalidades | Pasta `capturas`                                 |
| Apresentação individual                 | Roteiro em `docs/APRESENTACAO.md`                |

O pacote é um projeto Expo completo. Não é um APK e não exige backend. O aluno deve executar no ambiente escolhido e realizar a apresentação individual.
