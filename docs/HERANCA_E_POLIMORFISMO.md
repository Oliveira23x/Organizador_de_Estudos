# Herança e polimorfismo implementados

Este projeto contém código completo em uma pasta própria, `ritmo-estudos-poo`. Ele usa a versão atualizada do aplicativo, com disciplinas, sessões, metas, agenda e foco persistente.

## Herança

`Goal` é a classe base das metas. Ela guarda os dados em `#data`, valida informações comuns e implementa `progress()`, `status()` e `toRecord()`. A construção direta de `Goal` é bloqueada para que sejam usados os tipos concretos.

```javascript
export class TimeGoal extends Goal {
  constructor(data) {
    super({ ...data, goal_type: 'time' });
  }
}

export class SessionGoal extends Goal {
  constructor(data) {
    super({ ...data, goal_type: 'sessions', target_minutes: 1 });
  }
}
```

Os exemplos acima destacam a declaração de herança. Os arquivos completos em `src/models` também contêm os métodos sobrescritos.

## Polimorfismo

Cada subclasse implementa `currentValue()`, `targetValue()` e `progressLabel()`. A meta por tempo usa minutos; a meta por sessões usa a quantidade de sessões. O método `progress()` é herdado e chama esses métodos do objeto concreto.

```javascript
const goals = [new TimeGoal(data), new SessionGoal(data)];
const metrics = { studied_minutes: 60, studied_sessions: 1 };
const percentages = goals.map((goal) => goal.progress(metrics));
// Meta de 120 minutos: 50%. Meta de 4 sessões: 25%.
```

O cálculo não fica restrito ao exemplo: `presentGoal()` em `GoalFactory.js` é chamado pelo serviço que abastece as telas de metas e o resumo. Esse método usa `goal.progress(record)`, `goal.status(record, today)` e `goal.progressLabel(record)`.

A fábrica escolhe a subclasse ao criar o objeto. Depois disso, os métodos de cada subtipo são selecionados pelo comportamento do objeto. Os filtros e a ordenação também calculam o progresso nas consultas SQL; os testes verificam a consistência com o domínio.

## Arquivos para mostrar ao professor

| Conceito | Arquivo |
| --- | --- |
| Classe base e encapsulamento | `src/models/Goal.js` |
| Subclasse de meta por tempo | `src/models/TimeGoal.js` |
| Subclasse de meta por sessões | `src/models/SessionGoal.js` |
| Criação dos tipos e chamada polimórfica | `src/models/GoalFactory.js` |
| Uso no aplicativo | `src/services/StudyService.js` |
| Demonstração executável | `examples/polimorfismo.mjs` |
| Comprovação por teste | `tests/evolution.test.js` |

## Executar a demonstração

Na pasta que contém `package.json`:

```powershell
npm run demo:poo
npm test
```

A demonstração imprime os tipos dos objetos, comprova que ambos herdam de `Goal` e mostra os percentuais diferentes para a mesma chamada. O teste também verifica a cadeia de herança, o compartilhamento do método herdado, as sobrescritas e a proteção da classe base.

## Projeto independente

- Pasta e pacote npm: `ritmo-estudos-poo`.
- Slug Expo: `ritmo-estudos-poo`.
- Identificador Android: `com.diego.ritmoestudospoo`.
- O projeto possui os arquivos completos de configuração e suas próprias instruções.
- O APK continua dependendo de um build real pelo EAS na conta do aluno; a instalação Android precisa ser demonstrada.
