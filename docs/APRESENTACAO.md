# Apresentação individual - 7 a 10 minutos

## 1. Evolução do projeto - 1 minuto

Apresente o Ritmo 2.0 como evolução do Organizador de Estudos da primeira atividade. Mostre que as funções anteriores permanecem e que foram acrescentadas agenda, foco e metas por sessões. Identifique os dois pontos do retorno do professor: herança e polimorfismo.

## 2. Cadastro e meta por sessões - 1 minuto

No APK já instalado, cadastre uma disciplina e uma meta de duas sessões para hoje. Tente salvar com quantidade zero, mostre a mensagem e corrija. Explique que o progresso é calculado pelo histórico, disciplina e intervalo de datas.

## 3. Agenda de revisões - 1 a 2 minutos

Agende uma revisão, edite a prioridade e filtre por hoje. Conclua informando o tempo efetivamente estudado. Mostre a sessão criada e o progresso de 50% na meta de duas sessões. Explique que a conclusão e o registro da sessão usam uma transação: os dois acontecem juntos ou nenhum é gravado. A revisão não pode ser concluída duas vezes.

## 4. Foco com retomada - 1 a 2 minutos

Inicie um foco de um minuto. Pause, feche o aplicativo, reabra, entre em Planejar e retome. Aguarde o tempo real antes de salvar a sessão. Use esse minuto para explicar o código. O cronômetro limita o tempo à duração escolhida; a sessão só é salva com confirmação. Não há alarme em segundo plano.

## 5. Explicação de POO - 2 minutos

Abra `src/models/Goal.js`, `TimeGoal.js`, `SessionGoal.js` e `GoalFactory.js`.

- **Herança:** as duas classes usam `extends Goal` e aproveitam validação, armazenamento privado e cálculo percentual.
- **Sobrescrita:** cada subtipo redefine `currentValue`, `targetValue` e `progressLabel`.
- **Polimorfismo:** o serviço recebe um objeto Goal e chama `progress(record)` e `progressLabel(record)` sem decidir ali se deve calcular minutos ou sessões.
- **Encapsulamento:** o estado fica em campos privados e `toRecord()` retorna uma cópia.

O arquivo `examples/polimorfismo.mjs` demonstra as mesmas métricas aplicadas a objetos de subclasses diferentes:

```powershell
node examples/polimorfismo.mjs
```

Com 60 minutos e uma sessão: meta de 120 minutos fica em 50%; meta de quatro sessões fica em 25%. Mostre o teste correspondente em `tests/evolution.test.js`.

## 6. Consultas, segurança dos dados e testes - 1 minuto

Mostre o filtro por intervalo de datas e duração. Explique `WHERE`, parâmetros `?`, `ORDER BY`, `SUM` e `COUNT`. Mostre a migração por `user_version`, as chaves estrangeiras e o rollback testado. Apresente os 24 testes aprovados e as capturas da interface.

## 7. APK e instalação - 1 minuto

Depois do build real, mostre a página EAS finalizada, ID, versão, APK e hash. Abra o Ritmo pelo ícone próprio, com Expo Go fechado e Metro parado. Mostre persistência e uma operação em modo avião.

Até essa etapa ser executada, diga que o APK e a instalação estão pendentes. O material fornecido não comprova uma instalação que ainda não ocorreu.

## Perguntas para praticar

**Por que usar herança nas metas?** Há dados e validações comuns, mas regras distintas para medir avanço. A relação de especialização é natural ao domínio.

**Onde acontece o polimorfismo?** Em `presentGoal()`: o objeto concreto é criado e a mesma chamada de método produz o comportamento do subtipo. `progress()` chama métodos sobrescritos.

**Por que ainda existe uma condição SQL pelo tipo de meta?** O banco precisa filtrar e ordenar os resultados por progresso. O domínio também calcula apresentação e situação por despacho de métodos; os testes conferem os dois caminhos.

**Por que transação na revisão e no foco?** Para evitar salvar uma sessão e deixar o estado da operação incompleto. A falha desfaz a gravação parcial.

**O que mantém o cronômetro ao fechar o app?** O SQLite guarda os segundos acumulados, o início do trecho em execução e a situação. Ao retornar, a classe calcula o tempo pelo relógio e limita ao alvo.

**O que mudou no banco?** A versão 2 adiciona tipo e alvo de sessões nas metas e cria tabelas de revisões e foco, sem apagar as tabelas anteriores.

**Exportar o bundle gera APK?** Não. O bundle valida o JavaScript e os assets. O APK instalável é produzido pelo EAS Build com `buildType: apk`.
