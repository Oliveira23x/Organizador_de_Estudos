import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useQuery, useStudy } from '../context/StudyContext';
import {
  dateInput,
  formatMinutes,
  fromBRDate,
  isISODate,
  toISODate,
  weekStart,
} from '../utils/dates';
import { colors, ui } from '../theme';
import {
  Badge,
  Button,
  Chips,
  ConfirmDialog,
  EmptyState,
  Field,
  FilterPanel,
  GoalCard,
  Icon,
  IconButton,
  Search,
  Notice,
  SessionCard,
} from '../components/UI';

function RecordList({ title, subtitle, action, onAdd, filters, query, empty, renderItem, footer }) {
  return (
    <FlatList
      style={ui.screen}
      contentContainerStyle={ui.content}
      keyboardShouldPersistTaps="handled"
      data={query.error ? [] : query.data || []}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => renderItem(item)}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListHeaderComponent={
        <View style={{ gap: 18, marginBottom: 18 }}>
          <View style={{ gap: 6 }}>
            <Text style={ui.title}>{title}</Text>
            <Text style={ui.subtitle}>{subtitle}</Text>
          </View>
          <Button title={action} icon="add" onPress={onAdd} />
          {filters}
          {query.data?.length > 0 && !query.error && (
            <Text style={ui.small}>
              {query.data.length}{' '}
              {query.data.length === 1 ? 'registro encontrado' : 'registros encontrados'}
            </Text>
          )}
        </View>
      }
      ListEmptyComponent={
        query.loading ? (
          <ActivityIndicator color={colors.primary} style={{ margin: 32 }} />
        ) : query.error ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Não foi possível carregar"
            text={query.error}
            action="Tentar novamente"
            onAction={query.retry}
          />
        ) : (
          empty
        )
      }
      ListFooterComponent={footer}
    />
  );
}

function useDeletion(type) {
  const { mutate, busy } = useStudy();
  const [item, setItem] = useState(null);
  const confirm = async () => {
    await mutate(
      (service) =>
        type === 'subject'
          ? service.deleteSubject(item.id)
          : service[type === 'session' ? 'sessions' : 'goals'].delete(item.id),
      'Registro excluído com sucesso.',
    );
    // Se a regra impedir a exclusão, fecha a confirmação e mostra a mensagem na tela.
    setItem(null);
  };
  return {
    request: (row, name) => setItem({ id: row.id, message: `“${name}” será removido.` }),
    dialog: (
      <ConfirmDialog item={item} busy={busy} onCancel={() => setItem(null)} onConfirm={confirm} />
    ),
  };
}

export function SubjectsScreen({ onForm }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');
  const query = useQuery((s) => s.subjects.list({ search, sort }), [search, sort]);
  const deletion = useDeletion('subject');
  return (
    <View style={ui.screen}>
      <RecordList
        title="Disciplinas"
        subtitle="Organize o que você quer aprender."
        action="Nova disciplina"
        onAdd={() => onForm('subject')}
        query={query}
        filters={
          <View style={{ gap: 12 }}>
            <Search value={search} onChangeText={setSearch} placeholder="Buscar disciplina..." />
            <Chips
              label="Ordenar por"
              value={sort}
              onChange={setSort}
              items={[
                { value: 'name', label: 'Nome A–Z' },
                { value: 'time', label: 'Mais estudadas' },
                { value: 'recent', label: 'Mais recentes' },
              ]}
            />
          </View>
        }
        empty={
          <EmptyState
            icon="library-outline"
            title={search ? 'Nenhuma disciplina encontrada' : 'Seu próximo aprendizado começa aqui'}
            text={
              search
                ? 'Tente outro termo na busca.'
                : 'Cadastre sua primeira disciplina para organizar as sessões de estudo.'
            }
          />
        }
        renderItem={(item) => (
          <View style={[ui.card, { gap: 14 }]}>
            <View style={ui.between}>
              <View style={[ui.row, { flex: 1 }]}>
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 15,
                    backgroundColor: `${item.color}16`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="book-outline" color={item.color} size={23} />
                </View>
                <Text style={{ flex: 1, color: colors.ink, fontSize: 17, fontWeight: '700' }}>
                  {item.name}
                </Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <IconButton
                  icon="create-outline"
                  label={`Editar disciplina ${item.name}`}
                  onPress={() => onForm('subject', item)}
                />
                <IconButton
                  icon="trash-outline"
                  label={`Excluir disciplina ${item.name}`}
                  danger
                  onPress={() => deletion.request(item, item.name)}
                />
              </View>
            </View>
            {Boolean(item.description) && <Text style={ui.subtitle}>{item.description}</Text>}
            <View
              style={[
                ui.between,
                { paddingTop: 12, borderTopWidth: 1, borderColor: colors.border },
              ]}
            >
              <Text style={ui.small}>
                {item.session_count}{' '}
                {item.session_count === 1 ? 'sessão registrada' : 'sessões registradas'}
              </Text>
              <Badge
                text={formatMinutes(item.total_minutes)}
                color={item.color}
                soft={`${item.color}16`}
                icon="time-outline"
              />
            </View>
          </View>
        )}
      />
      {deletion.dialog}
    </View>
  );
}

export function SessionsScreen({ subjects, onForm, onNavigate }) {
  const [search, setSearch] = useState('');
  const [subjectId, setSubjectId] = useState(null);
  const [period, setPeriod] = useState('all');
  const [sort, setSort] = useState('recent');
  const [duration, setDuration] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customRange, setCustomRange] = useState(null);
  const [filterError, setFilterError] = useState(null);
  const today = toISODate();
  const from =
    period === 'week'
      ? weekStart(today)
      : period === 'month'
        ? `${today.slice(0, 7)}-01`
        : period === 'custom'
          ? customRange?.from
          : null;
  const to = period === 'custom' ? customRange?.to : from ? today : null;
  const query = useQuery(
    (s) =>
      s.sessions.list({
        search,
        subjectId,
        from,
        to,
        minMinutes: duration === 'long' ? 60 : null,
        maxMinutes: duration === 'short' ? 30 : null,
        sort,
      }),
    [search, subjectId, from, to, duration, today, sort],
  );
  function applyRange() {
    const start = fromBRDate(dateFrom),
      end = fromBRDate(dateTo);
    if (!isISODate(start) || !isISODate(end))
      return setFilterError('Informe as duas datas no formato DD/MM/AAAA.');
    if (start > end)
      return setFilterError('A data inicial deve ser igual ou anterior à data final.');
    setFilterError(null);
    setCustomRange({ from: start, to: end });
  }
  const deletion = useDeletion('session');
  const total = (query.data || []).reduce((sum, row) => sum + row.minutes, 0);
  return (
    <View style={ui.screen}>
      <RecordList
        title="Sessões de estudo"
        subtitle="Cada minuto é um passo à frente."
        action={subjects.length ? 'Registrar sessão' : 'Cadastrar primeira disciplina'}
        onAdd={() => (subjects.length ? onForm('session') : onNavigate('subjects'))}
        query={query}
        filters={
          <View style={{ gap: 12 }}>
            <Search
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar conteúdo ou disciplina..."
            />
            <FilterPanel
              title="Filtros das sessões"
              active={Boolean(
                subjectId || period !== 'all' || duration !== 'all' || sort !== 'recent',
              )}
            >
              <Chips
                label="Disciplina"
                value={subjectId}
                onChange={setSubjectId}
                items={[
                  { value: null, label: 'Todas' },
                  ...subjects.map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
              <Chips
                label="Período"
                value={period}
                onChange={setPeriod}
                items={[
                  { value: 'all', label: 'Todo o histórico' },
                  { value: 'week', label: 'Esta semana' },
                  { value: 'month', label: 'Este mês' },
                  { value: 'custom', label: 'Personalizado' },
                ]}
              />
              <Chips
                label="Duração da sessão"
                value={duration}
                onChange={setDuration}
                items={[
                  { value: 'all', label: 'Qualquer duração' },
                  { value: 'short', label: 'Até 30 min' },
                  { value: 'long', label: '1 hora ou mais' },
                ]}
              />
              {period === 'custom' && (
                <View style={[ui.card, { gap: 12 }]}>
                  {filterError && (
                    <Notice
                      notice={{ type: 'error', message: filterError }}
                      onDismiss={() => setFilterError(null)}
                    />
                  )}
                  <Field
                    label="Filtro: data inicial"
                    value={dateFrom}
                    onChangeText={(v) => setDateFrom(dateInput(v))}
                    keyboardType="number-pad"
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                  />
                  <Field
                    label="Filtro: data final"
                    value={dateTo}
                    onChangeText={(v) => setDateTo(dateInput(v))}
                    keyboardType="number-pad"
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                  />
                  <Button title="Aplicar período" variant="secondary" onPress={applyRange} />
                  <Text style={ui.small}>
                    {customRange
                      ? `Período aplicado: ${customRange.from.split('-').reverse().join('/')} a ${customRange.to.split('-').reverse().join('/')}`
                      : 'Preencha e aplique as duas datas para filtrar.'}
                  </Text>
                </View>
              )}
              <Chips
                label="Ordenar por"
                value={sort}
                onChange={setSort}
                items={[
                  { value: 'recent', label: 'Mais recentes' },
                  { value: 'oldest', label: 'Mais antigas' },
                  { value: 'duration', label: 'Maior duração' },
                ]}
              />
              <Button
                title="Limpar filtros das sessões"
                variant="secondary"
                onPress={() => {
                  setSearch('');
                  setSubjectId(null);
                  setPeriod('all');
                  setDuration('all');
                  setSort('recent');
                  setCustomRange(null);
                  setDateFrom('');
                  setDateTo('');
                  setFilterError(null);
                }}
              />
            </FilterPanel>
            {query.data?.length > 0 && (
              <View
                style={[
                  ui.between,
                  { backgroundColor: colors.primarySoft, padding: 14, borderRadius: 14 },
                ]}
              >
                <Text style={{ color: colors.primaryDark, fontSize: 13 }}>
                  Tempo no período selecionado
                </Text>
                <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '800' }}>
                  {formatMinutes(total)}
                </Text>
              </View>
            )}
          </View>
        }
        empty={
          <EmptyState
            icon="timer-outline"
            title="Nenhuma sessão por aqui"
            text="Registre um estudo ou ajuste os filtros para consultar seu histórico."
          />
        }
        renderItem={(item) => (
          <SessionCard
            item={item}
            onEdit={() => onForm('session', item)}
            onDelete={() => deletion.request(item, item.topic)}
          />
        )}
      />
      {deletion.dialog}
    </View>
  );
}

export function GoalsScreen({ subjects, onForm }) {
  const [status, setStatus] = useState('all');
  const [subjectId, setSubjectId] = useState(null);
  const [sort, setSort] = useState('deadline');
  const [goalType, setGoalType] = useState('all');
  const [search, setSearch] = useState('');
  const query = useQuery(
    (s) => s.listGoals({ status, subjectId, goalType, search, sort }),
    [status, subjectId, goalType, search, sort],
  );
  const deletion = useDeletion('goal');
  return (
    <View style={ui.screen}>
      <RecordList
        title="Minhas metas"
        subtitle="Transforme intenção em progresso."
        action="Nova meta"
        onAdd={() => onForm('goal')}
        query={query}
        filters={
          <View style={{ gap: 12 }}>
            <Search value={search} onChangeText={setSearch} placeholder="Buscar meta..." />
            <Chips
              label="Tipo de meta"
              value={goalType}
              onChange={setGoalType}
              items={[
                { value: 'all', label: 'Todos os tipos' },
                { value: 'time', label: 'Por tempo' },
                { value: 'sessions', label: 'Por sessões' },
              ]}
            />
            <FilterPanel
              title="Filtros das metas"
              active={Boolean(status !== 'all' || subjectId || sort !== 'deadline')}
            >
              <Chips
                label="Situação"
                value={status}
                onChange={setStatus}
                items={[
                  { value: 'all', label: 'Todas' },
                  { value: 'active', label: 'Em andamento' },
                  { value: 'completed', label: 'Concluídas' },
                  { value: 'overdue', label: 'Prazo encerrado' },
                  { value: 'scheduled', label: 'Planejadas' },
                ]}
              />
              <Chips
                label="Disciplina"
                value={subjectId}
                onChange={setSubjectId}
                items={[
                  { value: null, label: 'Todas' },
                  ...subjects.map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
              <Chips
                label="Ordenar por"
                value={sort}
                onChange={setSort}
                items={[
                  { value: 'deadline', label: 'Prazo' },
                  { value: 'progress', label: 'Maior progresso' },
                  { value: 'recent', label: 'Mais recentes' },
                ]}
              />
              <Button
                title="Limpar filtros das metas"
                variant="secondary"
                onPress={() => {
                  setSearch('');
                  setStatus('all');
                  setSubjectId(null);
                  setSort('deadline');
                  setGoalType('all');
                }}
              />
            </FilterPanel>
          </View>
        }
        empty={
          <EmptyState
            icon="flag-outline"
            title="Um objetivo faz a diferença"
            text="Crie uma meta por tempo ou por sessões, ou ajuste os filtros para encontrar suas metas."
          />
        }
        renderItem={(item) => (
          <GoalCard
            item={item}
            onEdit={() => onForm('goal', item)}
            onDelete={() => deletion.request(item, item.title)}
          />
        )}
        footer={
          <Text style={[ui.small, { textAlign: 'center', paddingTop: 20 }]}>
            O progresso acompanha automaticamente as sessões registradas dentro do período de cada
            meta.
          </Text>
        }
      />
      {deletion.dialog}
    </View>
  );
}
