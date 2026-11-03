import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, View } from 'react-native';
import { useQuery, useStudy } from '../context/StudyContext';
import { FocusTimer } from '../models/FocusTimer';
import { formatDate, formatMinutes, toISODate } from '../utils/dates';
import { colors, ui } from '../theme';
import {
  Badge,
  Button,
  Chips,
  ConfirmDialog,
  EmptyState,
  Field,
  FormModal,
  Icon,
  IconButton,
  Progress,
  Search,
} from '../components/UI';

const PRIORITIES = {
  high: { text: 'Alta', color: '#B44945', soft: '#FCECE9' },
  normal: { text: 'Normal', color: colors.primary, soft: colors.primarySoft },
  low: { text: 'Baixa', color: '#6975C5', soft: '#EFEFF9' },
};

export default function PlannerScreen({ subjects, onForm, onNavigate, mode, onModeChange }) {
  return (
    <View style={ui.screen}>
      <View style={{ paddingHorizontal: 22, paddingBottom: 12 }}>
        <Chips
          label="Meu planejamento"
          value={mode}
          onChange={onModeChange}
          items={[
            { value: 'agenda', label: 'Agenda de revisões' },
            { value: 'focus', label: 'Cronômetro de foco' },
          ]}
        />
      </View>
      {mode === 'agenda' ? (
        <RevisionAgenda subjects={subjects} onForm={onForm} onNavigate={onNavigate} />
      ) : (
        <FocusScreen subjects={subjects} onNavigate={onNavigate} />
      )}
    </View>
  );
}

function RevisionAgenda({ subjects, onForm, onNavigate }) {
  const { mutate, busy, dismissNotice } = useStudy();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [subjectId, setSubjectId] = useState(null);
  const [priority, setPriority] = useState('all');
  const [sort, setSort] = useState('date');
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [completing, setCompleting] = useState(null);
  const today = toISODate();
  const query = useQuery(
    (s) => s.revisions.list({ search, status, subjectId, priority, sort, today }),
    [search, status, subjectId, priority, sort, today],
  );
  const count = (query.data || []).length;
  async function remove() {
    await mutate(
      (s) => s.revisions.delete(deleting.id),
      'Revisão excluída. O histórico de estudos foi preservado.',
    );
    setDeleting(null);
  }

  return (
    <View style={ui.screen}>
      <FlatList
        style={ui.screen}
        contentContainerStyle={ui.content}
        keyboardShouldPersistTaps="handled"
        data={query.error ? [] : query.data || []}
        keyExtractor={(item) => String(item.id)}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 18 }}>
            <View style={{ gap: 6 }}>
              <Text style={ui.title}>Agenda de revisões</Text>
              <Text style={ui.subtitle}>Planeje, revise e acompanhe sua evolução.</Text>
            </View>
            <Button
              title={subjects.length ? 'Agendar revisão' : 'Cadastrar primeira disciplina'}
              icon="add"
              onPress={() => (subjects.length ? onForm('revision') : onNavigate('subjects'))}
            />
            <Search
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar revisão ou disciplina..."
            />
            <Chips
              label="Situação da revisão"
              value={status}
              onChange={setStatus}
              items={[
                { value: 'all', label: 'Todas' },
                { value: 'today', label: 'Hoje' },
                { value: 'overdue', label: 'Atrasadas' },
                { value: 'pending', label: 'Pendentes' },
                { value: 'done', label: 'Concluídas' },
              ]}
            />
            <Button
              title={expanded ? 'Recolher filtros da agenda' : 'Mais filtros da agenda'}
              icon="options-outline"
              variant="secondary"
              onPress={() => setExpanded((v) => !v)}
            />
            {expanded && (
              <View style={[ui.card, { gap: 14 }]}>
                <Chips
                  label="Disciplina da revisão"
                  value={subjectId}
                  onChange={setSubjectId}
                  items={[
                    { value: null, label: 'Todas' },
                    ...subjects.map((s) => ({ value: s.id, label: s.name })),
                  ]}
                />
                <Chips
                  label="Prioridade da revisão"
                  value={priority}
                  onChange={setPriority}
                  items={[
                    { value: 'all', label: 'Todas' },
                    { value: 'high', label: 'Alta' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'low', label: 'Baixa' },
                  ]}
                />
                <Chips
                  label="Ordenar revisões"
                  value={sort}
                  onChange={setSort}
                  items={[
                    { value: 'date', label: 'Data' },
                    { value: 'priority', label: 'Prioridade' },
                    { value: 'recent', label: 'Mais recentes' },
                  ]}
                />
                <Button
                  title="Limpar filtros da agenda"
                  variant="secondary"
                  onPress={() => {
                    setSearch('');
                    setStatus('all');
                    setSubjectId(null);
                    setPriority('all');
                    setSort('date');
                  }}
                />
              </View>
            )}
            {!query.loading && !query.error && (
              <Text style={ui.small}>
                {count} {count === 1 ? 'revisão encontrada' : 'revisões encontradas'}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          query.loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : query.error ? (
            <EmptyState
              title="Não foi possível carregar"
              text={query.error}
              action="Tentar novamente"
              onAction={query.retry}
            />
          ) : (
            <EmptyState
              icon="calendar-outline"
              title="Abra espaço para revisar"
              text="Agende sua próxima revisão ou ajuste os filtros para consultar seu planejamento."
            />
          )
        }
        renderItem={({ item }) => {
          const done = item.status === 'done';
          const overdue = !done && item.planned_on < today;
          return (
            <View style={[ui.card, { gap: 12 }]}>
              <View style={ui.between}>
                <Badge
                  text={
                    done
                      ? 'Concluída'
                      : overdue
                        ? 'Atrasada'
                        : item.planned_on === today
                          ? 'Hoje'
                          : 'Agendada'
                  }
                  color={overdue ? colors.danger : colors.primary}
                  soft={overdue ? colors.dangerSoft : colors.primarySoft}
                />
                <Badge {...PRIORITIES[item.priority]} />
              </View>
              <Text style={[ui.sectionTitle, { fontSize: 17 }]}>{item.title}</Text>
              <View style={ui.row}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: item.subject_color,
                  }}
                />
                <Text style={ui.subtitle}>{item.subject_name}</Text>
              </View>
              <View style={ui.between}>
                <Text style={ui.small}>
                  {formatDate(item.planned_on)} · {formatMinutes(item.planned_minutes)} previstos
                </Text>
                <View style={{ flexDirection: 'row' }}>
                  <IconButton
                    icon="create-outline"
                    label={`Editar revisão ${item.title}`}
                    onPress={() => onForm('revision', item)}
                  />
                  <IconButton
                    icon="trash-outline"
                    label={`Excluir revisão ${item.title}`}
                    danger
                    onPress={() => setDeleting(item)}
                  />
                </View>
              </View>
              {Boolean(item.notes) && <Text style={ui.small}>{item.notes}</Text>}
              {done ? (
                <Text style={[ui.small, { color: colors.primary }]}>
                  Concluída em {formatDate(item.completed_on)}
                  {item.session_id
                    ? ' · estudo registrado no histórico'
                    : ' · sessão removida do histórico'}
                </Text>
              ) : (
                <Button
                  title={`Concluir revisão: ${item.title}`}
                  icon="checkmark-circle-outline"
                  variant="secondary"
                  onPress={() => {
                    dismissNotice();
                    setCompleting(item);
                  }}
                />
              )}
            </View>
          );
        }}
      />
      <ConfirmDialog
        item={
          deleting
            ? {
                message: `A revisão “${deleting.title}” será removida. Sessões já registradas permanecerão no histórico.`,
              }
            : null
        }
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
      />
      {completing && (
        <CompleteRevisionModal item={completing} onClose={() => setCompleting(null)} />
      )}
    </View>
  );
}

function CompleteRevisionModal({ item, onClose }) {
  const { mutate, busy, notice, dismissNotice } = useStudy();
  const [minutes, setMinutes] = useState(String(item.planned_minutes));
  async function save() {
    if (
      await mutate(
        (s) => s.completeRevision(item.id, minutes),
        'Revisão concluída e sessão de estudo registrada.',
      )
    )
      onClose();
  }
  return (
    <FormModal
      visible
      title="Concluir revisão"
      subtitle={item.title}
      onClose={() => {
        dismissNotice();
        onClose();
      }}
      onSubmit={save}
      busy={busy}
      error={notice?.type === 'error' ? notice.message : null}
      onDismissError={dismissNotice}
    >
      <Text style={ui.subtitle}>
        Confirme o tempo que você realmente estudou. A sessão será registrada com a data de hoje e
        contará para suas metas.
      </Text>
      <Field
        label="Tempo realizado (min) *"
        value={minutes}
        onChangeText={setMinutes}
        keyboardType="number-pad"
        maxLength={4}
        editable={!busy}
      />
      <Text style={ui.small}>
        Você pode concluir uma revisão antecipadamente. O registro é feito uma única vez.
      </Text>
    </FormModal>
  );
}

function FocusScreen({ subjects, onNavigate }) {
  const { mutate, busy } = useStudy();
  const query = useQuery((s) => s.focus.current());
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? null);
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('25');
  const [now, setNow] = useState(Date.now());
  const [discarding, setDiscarding] = useState(false);
  useEffect(() => {
    if (!subjectId && subjects.length) setSubjectId(subjects[0].id);
  }, [subjects, subjectId]);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const row = query.data;
  const timer = row ? new FocusTimer(row) : null;
  const remaining = timer ? timer.remainingSeconds(now) : Number(duration || 0) * 60;
  const elapsed = timer ? timer.elapsedSeconds(now) : 0;
  const display = Number.isFinite(remaining)
    ? `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`
    : '00:00';
  async function run(operation, message) {
    const ok = await mutate(operation, message);
    if (ok) setNow(Date.now());
  }
  return (
    <ScrollView
      style={ui.screen}
      contentContainerStyle={ui.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: 6 }}>
        <Text style={ui.title}>Um momento de foco</Text>
        <Text style={ui.subtitle}>Uma tarefa por vez, no seu ritmo.</Text>
      </View>
      {query.loading && !row ? (
        <ActivityIndicator color={colors.primary} />
      ) : query.error ? (
        <EmptyState
          title="Não foi possível abrir o foco"
          text={query.error}
          action="Tentar novamente"
          onAction={query.retry}
        />
      ) : (
        <>
          <View
            style={[
              ui.card,
              {
                backgroundColor: colors.primaryDark,
                borderColor: colors.primaryDark,
                alignItems: 'center',
                gap: 16,
                paddingVertical: 32,
              },
            ]}
          >
            <Icon name="leaf-outline" size={28} color="#D9E8A4" />
            <Text style={{ color: '#D4E4D6', fontSize: 12 }}>
              {row
                ? remaining === 0
                  ? 'SEU TEMPO DE FOCO TERMINOU'
                  : row.status === 'paused'
                    ? 'PAUSADO · RETOME QUANDO QUISER'
                    : 'AGORA É TEMPO DE APRENDER'
                : 'PREPARE SEU PRÓXIMO ESTUDO'}
            </Text>
            <Text
              accessibilityLabel={`Tempo restante ${display}`}
              style={{
                fontSize: 64,
                letterSpacing: -2,
                fontWeight: '800',
                color: '#F9F9ED',
                fontVariant: ['tabular-nums'],
              }}
            >
              {display}
            </Text>
            {row && (
              <>
                <Text
                  style={{ color: '#E3EBDC', fontSize: 16, fontWeight: '700', textAlign: 'center' }}
                >
                  {row.topic}
                </Text>
                <Text style={{ color: '#C4D6C7', fontSize: 13 }}>{row.subject_name}</Text>
                <View style={{ width: '100%' }}>
                  <Progress value={(elapsed / (row.target_minutes * 60)) * 100} color="#D4DF9C" />
                </View>
              </>
            )}
          </View>
          {row ? (
            <>
              <View style={ui.row}>
                {row.status === 'running' ? (
                  <Button
                    title="Pausar foco"
                    icon="pause"
                    variant="secondary"
                    disabled={busy || remaining === 0}
                    style={{ flex: 1 }}
                    onPress={() => run((s) => s.pauseFocus(), 'Foco pausado.')}
                  />
                ) : (
                  <Button
                    title="Retomar foco"
                    icon="play"
                    variant="secondary"
                    disabled={busy || remaining === 0}
                    style={{ flex: 1 }}
                    onPress={() => run((s) => s.resumeFocus(), 'Foco retomado.')}
                  />
                )}
                <Button
                  title="Salvar estudo"
                  icon="checkmark"
                  loading={busy}
                  disabled={elapsed < 60}
                  style={{ flex: 1 }}
                  onPress={() => run((s) => s.finishFocus(), 'Sessão de foco salva no histórico.')}
                />
              </View>
              <Text style={ui.small}>
                Você estudou {formatMinutes(Math.floor(elapsed / 60))}. Para salvar, complete pelo
                menos 1 minuto. O tempo salvo é limitado à duração planejada e registrado no dia da
                conclusão.
              </Text>
              <Button
                title="Descartar foco"
                icon="trash-outline"
                variant="danger"
                disabled={busy}
                onPress={() => setDiscarding(true)}
              />
            </>
          ) : subjects.length ? (
            <View style={{ gap: 18 }}>
              <Chips
                label="Disciplina do foco"
                value={subjectId}
                onChange={setSubjectId}
                items={subjects.map((s) => ({ value: s.id, label: s.name }))}
              />
              <Field
                label="Conteúdo do foco *"
                value={topic}
                onChangeText={setTopic}
                maxLength={100}
                placeholder="Ex.: Praticar herança e polimorfismo"
              />
              <Chips
                label="Duração sugerida"
                value={duration}
                onChange={setDuration}
                items={[
                  { value: '15', label: '15 minutos' },
                  { value: '25', label: '25 minutos' },
                  { value: '50', label: '50 minutos' },
                ]}
              />
              <Field
                label="Duração do foco (min) *"
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
                maxLength={3}
                hint="Escolha de 1 a 180 minutos."
              />
              <Button
                title="Iniciar foco"
                icon="play"
                loading={busy}
                onPress={() =>
                  run(
                    (s) => s.startFocus({ subject_id: subjectId, topic, target_minutes: duration }),
                    'Foco iniciado. Bom estudo!',
                  )
                }
              />
            </View>
          ) : (
            <EmptyState
              icon="book-outline"
              title="Escolha o que aprender"
              text="Cadastre uma disciplina antes de iniciar seu foco."
              action="Ir para disciplinas"
              onAction={() => onNavigate('subjects')}
            />
          )}
          <View style={[ui.card, { backgroundColor: colors.primarySoft }]}>
            <Text style={[ui.small, { color: colors.primaryDark }]}>
              Seu foco fica salvo mesmo ao sair da tela ou fechar o app. O tempo continua contando
              até a duração escolhida. Ao voltar, confira e salve o estudo no histórico.
            </Text>
          </View>
        </>
      )}
      <ConfirmDialog
        item={
          discarding
            ? {
                message:
                  'O cronômetro atual será descartado e seu tempo não será adicionado ao histórico.',
              }
            : null
        }
        busy={busy}
        onCancel={() => setDiscarding(false)}
        onConfirm={async () => {
          await run((s) => s.focus.clear(), 'Foco descartado.');
          setDiscarding(false);
        }}
      />
    </ScrollView>
  );
}
