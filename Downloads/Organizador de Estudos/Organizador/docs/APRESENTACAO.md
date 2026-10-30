# Roteiro de apresentação individual — 5 a 7 minutos

## 1. Problema e proposta — 30 segundos

“Escolhi o tema Organizador de Estudos porque é comum estudar várias disciplinas sem saber quanto tempo dedicamos a cada uma. O Ritmo registra disciplinas, sessões de estudo e metas pessoais. Os indicadores ajudam a acompanhar a rotina.”

Apresente a tela Resumo e as quatro abas.

## 2. Cadastro e validação — 1 minuto

1. Abra Disciplinas e cadastre `Desenvolvimento Mobile`.
2. Escolha uma cor e salve.
3. Abra Sessões, selecione a disciplina e preencha `Componentes no React Native`.
4. Digite `0` na duração e mostre a mensagem de validação.
5. Corrija para `30`, use a data de hoje e salve.

Explique: “O formulário coleta os valores, mas as regras ficam na classe StudySession. O serviço só grava depois que o objeto é validado.”

## 3. Meta e indicadores — 1 minuto

1. Crie uma meta dessa disciplina: `Estudar mobile nesta semana`.
2. Defina 60 minutos, começando hoje e terminando daqui a sete dias.
3. Mostre o progresso de 50% calculado a partir da sessão de 30 minutos.
4. Volte ao Resumo e mostre o tempo total e a distribuição por disciplina.

Explique que o progresso considera disciplina e intervalo da meta. A mesma sessão pode participar de metas sobrepostas, mas não é duplicada nos indicadores de tempo.

## 4. Consulta, alteração e exclusão — 1 minuto

1. Em Sessões, filtre pela disciplina e por esta semana.
2. Ordene por maior duração.
3. Edite a sessão de 30 para 60 minutos.
4. Mostre que a meta passou para 100% e foi concluída.
5. Cadastre uma sessão temporária e exclua com confirmação.
6. Tente excluir a disciplina que ainda tem histórico; mostre a mensagem de proteção.

## 5. Persistência — 45 segundos

Feche completamente o aplicativo, reabra o mesmo projeto e mostre que a disciplina, a sessão e a meta continuam disponíveis.

“Os registros são gravados no arquivo SQLite do dispositivo. O app não depende de um servidor para consultar e alterar os dados depois que está carregado.”

## 6. Explicação do código — 1 a 2 minutos

Abra os arquivos nesta ordem:

| Arquivo                               | O que explicar                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------- |
| `src/models/StudySession.js`          | Classe, construtor, campos privados, validação de duração e data; método `toRecord()` |
| `src/models/Goal.js`                  | Cálculo de percentual e definição da situação da meta                                 |
| `src/services/StudyService.js`        | Criação dos objetos, verificação da disciplina e regras de negócio                    |
| `src/database/schema.js`              | Três tabelas, chaves estrangeiras, índices e migração com `user_version`              |
| `src/repositories/StudyRepository.js` | `INSERT`, `SELECT`, `UPDATE`, `DELETE`, parâmetros, `JOIN`, `WHERE` e `ORDER BY`      |
| `src/context/StudyContext.js`         | `try/catch`, mensagens e atualização das telas após salvar ou excluir                 |

### Exemplo curto de consulta SQL

```sql
SELECT s.*, d.name AS subject_name, d.color AS subject_color
FROM sessions s
JOIN subjects d ON d.id = s.subject_id
WHERE s.subject_id = ? AND s.studied_on >= ?
ORDER BY s.minutes DESC;
```

“O JOIN traz o nome e a cor da disciplina. O WHERE filtra. O ORDER BY organiza por duração. Os valores são passados como parâmetros para manter separados o comando SQL e os dados.”

## Perguntas que podem aparecer

**Onde está a POO?** Nos modelos, serviço e repositórios. Os modelos agrupam dados e comportamentos; os campos privados protegem o estado interno.

**Por que usar SQLite?** O requisito pede persistência local; o SQLite permite relações, consultas e agregações no próprio dispositivo.

**Qual é a diferença entre validação e restrição do banco?** O modelo orienta o usuário com mensagens claras. O banco também aplica restrições estruturais, como chaves estrangeiras e limites.

**Por que não excluir uma disciplina com registros?** Para não apagar ou deixar sem referência o histórico. As sessões e metas podem ser removidas ou alteradas antes.

**A meta é concluída manualmente?** Não. A soma das sessões no período determina o progresso e a conclusão. Esse cálculo é atualizado quando uma sessão muda.

**O que acontece se o aplicativo reiniciar?** Ele reabre o mesmo arquivo e consulta novamente os registros.

**Como os erros são tratados?** As operações assíncronas são envolvidas em `try/catch`. Erros de validação e SQLite são convertidos em mensagens compreensíveis.

## Preparação final

- Execute o projeto no celular ou ambiente compatível antes da apresentação.
- Use os exemplos opcionais apenas para conhecer as telas; pratique também o cadastro manual.
- Confira suas próprias capturas e as regras de negócio.
- Leia os arquivos indicados e explique com suas palavras.
- Tenha o projeto aberto na pasta correta e o Expo Go correspondente ao SDK 58.
