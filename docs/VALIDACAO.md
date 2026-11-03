# Relatório técnico de validação - Ritmo 2.0

Data: 30/10/2026. Ambiente: Node 24.22.1, Expo SDK 58, React 19.3, React Native 0.88.1, SQLite real do Node e expo-sqlite/WebAssembly em Chromium 133. Interface conferida em 390 x 844 e 360 x 800 pixels.

## Resultados observados

| Verificação              | Resultado                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `npm test`               | 24 aprovados, 0 falhas                                                                     |
| Dependências             | Conferência local com metadados do SDK: alinhadas; consulta remota sofreu timeout de proxy |
| `npm run export:android` | Bundle Android/Hermes gerado com sucesso                                                   |
| Interface web            | 14 verificações concluídas, 0 erros JavaScript não tratados                                |
| SQLite v1 para v2        | Migração preservou disciplina, sessão e meta existentes                                    |
| EAS Build                | Não iniciado: CLI exigiu autenticação em conta Expo                                        |
| APK                      | Não gerado neste ambiente                                                                  |
| Instalação em Android    | Não verificada                                                                             |

## Cobertura dos 24 testes com SQLite real

Os 12 testes da Atividade 1 continuam aprovados: migração idempotente e integridade referencial; CRUD e busca de disciplinas; duplicidade; CRUD de sessões; entradas inválidas; proteção de vínculos; metas por disciplina e período; indicadores; encapsulamento; datas locais; exemplos transacionais; persistência ao fechar e reabrir.

Foram adicionados 12 testes:

1. Migração v1 para v2 preservando dados e metas antigas.
2. Herança e polimorfismo em duas subclasses concretas.
3. Metas por sessões: COUNT, período, disciplina, situação, busca e ordenação.
4. CRUD e filtros da agenda de revisões.
5. Conclusão de revisão, atualização de meta e proteção contra duplicidade.
6. Rollback em falha simulada ao concluir uma revisão.
7. Exclusões de revisão e sessão preservando a integridade do histórico.
8. Cronômetro: pausa, retomada, teto de tempo e encapsulamento.
9. Recuperação do foco do SQLite e salvamento de uma única sessão.
10. Proteção de disciplinas com revisões ou foco ativo.
11. Filtros combinados por duração, busca, disciplina e intervalo.
12. Persistência de foco, agenda e metas por sessões ao reabrir o arquivo.

## Verificações na interface

1. Exemplos, resumo, metas e indicadores da versão 2 abrem com SQLite real.
2. Cadastro de meta por sessões, validação de quantidade e cálculo polimórfico da meta existente.
3. Filtro SQL de revisões atrasadas retorna apenas os registros esperados.
4. Agenda: inclusão, edição e busca de revisão concluídas pela interface.
5. Conclusão de revisão valida duração e gera sessão no histórico sem duplicação.
6. Filtro por intervalo personalizado valida datas vazias e consulta o período aplicado.
7. Filtro SQL por duração altera corretamente o conjunto de sessões.
8. Cronômetro persiste em SQLite, reaparece após reabrir a aplicação e permite pausar e retomar.
9. Fim do foco e salvamento no histórico verificados com relógio acelerado em 65 segundos no teste.
10. Cancelar exclusão mantém a revisão; excluir revisão concluída preserva a sessão do histórico.
11. CRUD de sessões mantido na versão aprimorada, com edição e exclusão confirmadas.
12. CRUD de disciplinas permanece funcionando após a migração.
13. Meta por sessões pode ser consultada, editada e excluída.
14. Layout conferido em 390 e 360 pixels sem overflow horizontal.

O teste do fim do cronômetro usa relógio acelerado em 65 segundos. As capturas do foco mostram o início e a retomada real do estado armazenado; não representam 65 segundos de estudo real de um usuário.

## Reproduzir

```powershell
npm ci
npm test
npm run check
npm run export:android
npm run web
```

Em caso de indisponibilidade da consulta remota de dependências, pode-se fazer a conferência local no PowerShell:

```powershell
$env:EXPO_OFFLINE = "1"
npm run check
Remove-Item Env:\EXPO_OFFLINE
```

Essa alternativa não valida serviços remotos. O EAS Build exige acesso à internet, projeto vinculado e conta autenticada. Veja `GERAR_APK.md` e complete a ficha de instalação após testar o APK real.

## Conferência do projeto separado com POO

Projeto: `ritmo-estudos-poo`. Os 24 testes foram executados nesta cópia e aprovados. O teste de polimorfismo também verifica que Goal não é instanciada diretamente, as duas subclasses herdam de Goal e compartilham o mesmo método progress(), que chama os métodos sobrescritos.

`npm run demo:poo` foi executado com os resultados: TimeGoal = 50%; SessionGoal = 25%; ambos herdam de Goal. As capturas e os 14 fluxos da interface documentados acima são evidências da base funcional Ritmo 2.0, cuja interface foi mantida neste novo projeto.

## Correção de raiz no envio ao EAS

Três testes do script de build foram aprovados: a raiz do app prevalece sobre o ambiente herdado; o processo filho recebe EAS_NO_VCS=1, EAS_PROJECT_ROOT e o diretório corretos; uma pasta sem os arquivos obrigatórios é rejeitada. Os 24 testes do aplicativo continuam separados desses três testes do processo de build. O upload e o APK ainda precisam ser confirmados em uma execução autenticada no EAS.
