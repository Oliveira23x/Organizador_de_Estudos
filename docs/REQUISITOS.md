# Conferência dos requisitos - Atividade 2

| Requisito                                   | Situação comprovada                              | Evidência                                                                                                |
| ------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Duas ou mais novas funcionalidades          | Implementado e testado                           | Agenda de revisões, cronômetro persistente e metas por sessões                                           |
| Interface e experiência aprimoradas         | Verificado no Expo web                           | Cinco áreas, atalhos, filtros recolhíveis, progresso e estados vazios                                    |
| Filtros e consultas aprimorados             | Testado                                          | Datas personalizadas, duração, tipo de meta, revisões por atraso e prioridade                            |
| Classes, objetos e encapsulamento           | Implementado e testado                           | Modelos com campos privados, serviços e repositórios                                                     |
| Herança, ponto faltante na Atividade 1      | Implementado e testado                           | `TimeGoal extends Goal` e `SessionGoal extends Goal`                                                     |
| Polimorfismo, ponto faltante na Atividade 1 | Implementado e testado                           | Mesma chamada `progress()` usa métodos sobrescritos e resultados diferentes                              |
| Campos vazios, inválidos e falhas           | Testado                                          | Validações, mensagens, confirmações e rollback em falha simulada                                         |
| CRUD                                        | Testado                                          | SQLite real e fluxos da interface para disciplinas, sessões, metas e revisões                            |
| Persistência local                          | Testado                                          | Fechamento e reabertura do arquivo; migração sem perda e retomada do foco                                |
| Arquivo APK pelo EAS Build                  | **Pendente de autenticação Expo e build remoto** | Perfil `preview`, `buildType: apk`, script e guia prontos; tentativa bloqueada por conta não autenticada |
| Instalação e funcionamento em Android       | **Pendente no dispositivo/emulador**             | Roteiro e ficha em `evidencias/REGISTRO_DA_INSTALACAO.md`                                                |
| Explicação individual                       | Material preparado; apresentação a realizar      | Roteiro, código de demonstração e PDF de apresentação                                                    |

## Entregáveis

| Entregável               | Onde está e o que falta                                                   |
| ------------------------ | ------------------------------------------------------------------------- |
| Código-fonte atualizado  | Projeto completo, versão 2.0.0                                            |
| APK                      | Será criado pelo EAS; baixar para `evidencias/apk/` após build finalizado |
| Relatório breve          | `Relatorio_Atividade_2_Ritmo.pdf` e `VALIDACAO.md`                        |
| Evidências de execução   | Nove capturas web e resultados dos testes fornecidos                      |
| Evidências de instalação | Ainda precisam ser produzidas no Android                                  |
| Apresentação individual  | `APRESENTACAO.md` e PDF da apresentação                                   |

**A entrega só satisfaz integralmente os requisitos do professor depois que o APK real e as evidências de instalação forem acrescentados.** O bundle JavaScript gerado pelo Metro não substitui o APK.
