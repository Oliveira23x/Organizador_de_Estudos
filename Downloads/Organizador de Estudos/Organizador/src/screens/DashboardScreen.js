import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery, useStudy } from '../context/StudyContext';
import { colors, ui } from '../theme';
import { formatMinutes } from '../utils/dates';
import {
  Badge,
  Button,
  EmptyState,
  GoalCard,
  Icon,
  Progress,
  QueryState,
  SectionHeader,
  SessionCard,
} from '../components/UI';

function Metric({ icon, label, value, tone = colors.primary }) {
  return (
    <View style={[ui.card, { flex: 1, gap: 9, padding: 15 }]}>
      <View style={ui.between}>
        <Icon name={icon} color={tone} size={20} />
        <View style={{ width: 5, height: 5, backgroundColor: tone, borderRadius: 4 }} />
      </View>
      <Text style={{ color: colors.ink, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 }}>
        {value}
      </Text>
      <Text style={ui.small}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen({ onNavigate, onForm }) {
  const { mutate, busy } = useStudy();
  const query = useQuery((s) => s.dashboard());
  const dayNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <View style={{ gap: 6 }}>
        <Text style={styles.eyebrow}>UM POUCO MELHOR A CADA DIA</Text>
        <Text style={ui.title}>Seu ritmo, seu futuro.</Text>
        <Text style={ui.subtitle}>Reserve um tempo para aprender.</Text>
      </View>
      <QueryState query={query}>
        {(data) => (
          <>
            <View style={styles.hero}>
              <View style={styles.heroCircle} />
              <View
                style={[styles.heroCircle, { width: 160, height: 160, right: -45, top: -95 }]}
              />
              <View style={ui.between}>
                <Text style={styles.heroLabel}>TEMPO DE ESTUDO NA SEMANA</Text>
                <View style={styles.heroIcon}>
                  <Icon name="leaf-outline" size={21} color="#D9E8A4" />
                </View>
              </View>
              <Text style={styles.heroValue}>{formatMinutes(data.week_minutes)}</Text>
              <Text style={{ color: '#BFD3C3', fontSize: 12 }}>De segunda-feira até hoje</Text>
              <View style={{ height: 1, backgroundColor: '#447163', marginVertical: 17 }} />
              <View style={ui.between}>
                <View style={ui.row}>
                  <Icon name="flame-outline" color="#E4C17F" size={19} />
                  <Text style={{ color: '#ECF1E8', fontSize: 12 }}>
                    {data.streak
                      ? `${data.streak} ${data.streak === 1 ? 'dia seguido' : 'dias seguidos'} de estudo`
                      : 'Comece sua sequência hoje'}
                  </Text>
                </View>
                <Icon name="trending-up-outline" size={21} color="#CBDC9B" />
              </View>
            </View>
            <View style={[ui.row, { gap: 10 }]}>
              <Metric
                icon="time-outline"
                label="Tempo total"
                value={formatMinutes(data.total_minutes)}
              />
              <Metric
                icon="checkmark-done-outline"
                label="Sessões feitas"
                value={data.total_sessions}
                tone="#6975C5"
              />
            </View>
            {data.total_subjects === 0 && data.total_sessions === 0 && data.total_goals === 0 ? (
              <EmptyState
                icon="sparkles-outline"
                title="Seu espaço para aprender"
                text="Comece criando uma disciplina. Se quiser conhecer as telas, carregue os exemplos abaixo."
                action="Criar primeira disciplina"
                onAction={() => onForm('subject')}
              />
            ) : (
              <Button
                title="Registrar sessão de estudo"
                icon="add"
                onPress={() => (data.total_subjects ? onForm('session') : onNavigate('subjects'))}
              />
            )}
            <View style={[ui.card, { gap: 18 }]}>
              <View style={ui.between}>
                <Text style={ui.sectionTitle}>Sua constância</Text>
                <Text style={ui.small}>Últimos 7 dias</Text>
              </View>
              <View style={styles.chart}>
                {data.chart.map((day, index) => {
                  const max = Math.max(60, ...data.chart.map((d) => d.minutes));
                  const date = new Date(`${day.date}T12:00:00`);
                  return (
                    <View
                      key={day.date}
                      style={styles.barColumn}
                      accessibilityLabel={`${day.date}: ${day.minutes} minutos`}
                    >
                      <Text style={styles.barValue}>{day.minutes || '–'}</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={{
                            width: '100%',
                            height: day.minutes ? Math.max(5, (day.minutes / max) * 82) : 3,
                            borderRadius: 7,
                            backgroundColor: index === 6 ? colors.primary : '#C6DACA',
                          }}
                        />
                      </View>
                      <Text
                        style={[
                          ui.small,
                          index === 6 && { color: colors.primary, fontWeight: '800' },
                        ]}
                      >
                        {dayNames[date.getDay()]}
                      </Text>
                      <Text style={{ fontSize: 9, color: colors.muted }}>{date.getDate()}</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={[ui.small, { textAlign: 'center', marginTop: -8 }]}>
                Tempo estudado em minutos por dia
              </Text>
            </View>
            <View style={{ gap: 12 }}>
              <SectionHeader
                title="Metas em andamento"
                action="Ver todas"
                onPress={() => onNavigate('goals')}
              />
              {data.goals.length ? (
                data.goals.map((goal) => <GoalCard key={goal.id} item={goal} compact />)
              ) : (
                <View style={[ui.card, { gap: 8 }]}>
                  <Text style={ui.subtitle}>Qual é o seu próximo objetivo?</Text>
                  <Pressable accessibilityRole="button" onPress={() => onForm('goal')}>
                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>
                      Criar uma meta →
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
            {data.distribution.length > 0 && (
              <View style={[ui.card, { gap: 17 }]}>
                <SectionHeader title="Tempo por disciplina" />
                {data.distribution.map((item) => (
                  <View key={item.id} style={{ gap: 8 }}>
                    <View style={ui.between}>
                      <View style={ui.row}>
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            backgroundColor: item.color,
                            borderRadius: 3,
                          }}
                        />
                        <Text style={{ fontSize: 13, color: colors.ink }}>{item.name}</Text>
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.ink }}>
                        {formatMinutes(item.minutes)}
                      </Text>
                    </View>
                    <Progress
                      value={data.total_minutes ? (item.minutes / data.total_minutes) * 100 : 0}
                      color={item.color}
                    />
                  </View>
                ))}
              </View>
            )}
            <View style={{ gap: 12 }}>
              <SectionHeader
                title="Últimas sessões"
                action="Ver histórico"
                onPress={() => onNavigate('sessions')}
              />
              {data.recent.length ? (
                data.recent.map((item) => <SessionCard key={item.id} item={item} compact />)
              ) : (
                <Text style={ui.subtitle}>Suas sessões aparecerão aqui quando você começar.</Text>
              )}
            </View>
            <View style={[ui.row, { justifyContent: 'center', flexWrap: 'wrap', gap: 8 }]}>
              <Badge text={`${data.total_subjects} disciplinas`} icon="library-outline" />
              <Badge
                text={`${data.completed_goals}/${data.total_goals} metas concluídas`}
                icon="flag-outline"
              />
            </View>
            {!data.total_subjects && !data.total_goals && !data.total_sessions && (
              <Button
                title="Experimentar com exemplos"
                variant="secondary"
                icon="sparkles-outline"
                loading={busy}
                onPress={() =>
                  mutate(
                    (s) => s.loadExamples(),
                    'Exemplos adicionados. Explore e personalize seus estudos.',
                  )
                }
              />
            )}
            <View style={[ui.row, { justifyContent: 'center', gap: 6 }]}>
              <Icon name="checkmark-circle-outline" size={13} color={colors.muted} />
              <Text style={ui.small}>Tudo salvo neste dispositivo</Text>
            </View>
          </>
        )}
      </QueryState>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 9, fontWeight: '800', color: colors.primary, letterSpacing: 1.7 },
  hero: { padding: 21, borderRadius: 23, backgroundColor: colors.primaryDark, overflow: 'hidden' },
  heroLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.1, color: '#D6E3D6', flex: 1 },
  heroValue: {
    fontSize: 43,
    fontWeight: '800',
    letterSpacing: -1.5,
    color: '#F9F9ED',
    marginTop: 6,
    marginBottom: 4,
  },
  heroIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: '#376555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderWidth: 1,
    borderColor: '#356859',
    borderRadius: 150,
    right: -100,
    top: 25,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 2,
    height: 141,
  },
  barColumn: { flex: 1, gap: 5, alignItems: 'center' },
  barValue: { fontSize: 10, color: colors.muted, fontWeight: '500' },
  barTrack: {
    height: 82,
    width: '100%',
    maxWidth: 28,
    justifyContent: 'flex-end',
    backgroundColor: '#F1F5EE',
    borderRadius: 7,
  },
});
