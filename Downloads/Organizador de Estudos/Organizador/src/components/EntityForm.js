import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SUBJECT_COLORS } from '../models/Subject';
import { useStudy } from '../context/StudyContext';
import { addDays, dateInput, formatDate, fromBRDate, toISODate } from '../utils/dates';
import { colors, ui } from '../theme';
import { Chips, Field, FormModal, Icon } from './UI';

export default function EntityForm({ type, record, subjects, onClose }) {
  const { mutate, busy, notice, dismissNotice } = useStudy();
  const today = toISODate();
  const [form, setForm] = useState(() => ({
    name: '',
    description: '',
    color: SUBJECT_COLORS[0],
    subject_id: type === 'session' ? (subjects[0]?.id ?? null) : null,
    topic: '',
    minutes: '',
    notes: '',
    title: '',
    target_minutes: '',
    ...record,
    studied_on: formatDate(record?.studied_on || today),
    start_on: formatDate(record?.start_on || today),
    end_on: formatDate(record?.end_on || addDays(today, 7)),
    minutes: record?.minutes == null ? '' : String(record.minutes),
    target_minutes: record?.target_minutes == null ? '' : String(record.target_minutes),
  }));
  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const field = (key) => ({
    value: form[key],
    onChangeText: (value) => update(key, value),
    editable: !busy,
  });
  const dateField = (key) => ({
    value: form[key],
    onChangeText: (value) => update(key, dateInput(value)),
    keyboardType: 'number-pad',
    maxLength: 10,
    placeholder: 'DD/MM/AAAA',
    editable: !busy,
  });
  const info = {
    subject: { single: 'disciplina', plural: 'Disciplina', save: 'saveSubject' },
    session: { single: 'sessão', plural: 'Sessão', save: 'saveSession' },
    goal: { single: 'meta', plural: 'Meta', save: 'saveGoal' },
  }[type];

  async function submit() {
    const data =
      type === 'subject'
        ? form
        : type === 'session'
          ? { ...form, studied_on: fromBRDate(form.studied_on) }
          : { ...form, start_on: fromBRDate(form.start_on), end_on: fromBRDate(form.end_on) };
    const ok = await mutate(
      (service) => service[info.save](data),
      `${info.plural} ${record ? 'atualizada' : 'cadastrada'} com sucesso.`,
    );
    if (ok) onClose();
  }

  return (
    <FormModal
      visible
      title={`${record ? 'Editar' : 'Nova'} ${info.single}`}
      subtitle="Preencha os campos abaixo para salvar."
      onClose={() => {
        dismissNotice();
        onClose();
      }}
      onSubmit={submit}
      busy={busy}
      error={notice?.type === 'error' ? notice.message : null}
      onDismissError={dismissNotice}
    >
      {type === 'subject' ? (
        <>
          <Field
            label="Nome da disciplina *"
            placeholder="Ex.: Programação"
            maxLength={60}
            autoCapitalize="sentences"
            {...field('name')}
          />
          <Field
            label="Descrição"
            placeholder="O que você está aprendendo?"
            maxLength={200}
            multiline
            {...field('description')}
          />
          <View>
            <Text style={ui.label}>Cor da disciplina</Text>
            <View style={[ui.row, { gap: 12 }]}>
              {SUBJECT_COLORS.map((color, index) => (
                <Pressable
                  key={color}
                  accessibilityRole="button"
                  accessibilityLabel={`Cor ${index + 1}`}
                  accessibilityState={{ selected: form.color === color }}
                  onPress={() => update('color', color)}
                  disabled={busy}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 13,
                    backgroundColor: color,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 3,
                    borderColor: form.color === color ? colors.ink : 'transparent',
                  }}
                >
                  {form.color === color && <Icon name="checkmark" color="white" size={20} />}
                </Pressable>
              ))}
            </View>
          </View>
        </>
      ) : (
        <>
          <Chips
            label={type === 'session' ? 'Disciplina *' : 'Disciplina da meta'}
            value={form.subject_id}
            onChange={(value) => {
              if (!busy) update('subject_id', value);
            }}
            items={[
              ...(type === 'goal' ? [{ value: null, label: 'Todas as disciplinas' }] : []),
              ...subjects.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
          {type === 'session' ? (
            <>
              <Field
                label="Conteúdo estudado *"
                placeholder="Ex.: Classes e objetos em JavaScript"
                maxLength={100}
                {...field('topic')}
              />
              <View style={[ui.row, { alignItems: 'flex-start' }]}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Duração em minutos *"
                    placeholder="Ex.: 50"
                    keyboardType="number-pad"
                    maxLength={4}
                    {...field('minutes')}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Data do estudo *" {...dateField('studied_on')} />
                </View>
              </View>
              <Text style={[ui.small, { marginTop: -8 }]}>
                Registre sessões já realizadas. Duração de 1 a 1.440 minutos.
              </Text>
              <Field
                label="Anotações"
                placeholder="Aprendizados, dúvidas ou próximos passos..."
                maxLength={500}
                multiline
                {...field('notes')}
              />
            </>
          ) : (
            <>
              <Field
                label="Título da meta *"
                placeholder="Ex.: Praticar programação nesta semana"
                maxLength={80}
                {...field('title')}
              />
              <Field
                label="Tempo desejado em minutos *"
                placeholder="Ex.: 300 (5 horas)"
                keyboardType="number-pad"
                maxLength={6}
                {...field('target_minutes')}
              />
              <View style={[ui.row, { alignItems: 'flex-start' }]}>
                <View style={{ flex: 1 }}>
                  <Field label="Data inicial *" {...dateField('start_on')} />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Prazo final *" {...dateField('end_on')} />
                </View>
              </View>
              <View
                style={{
                  backgroundColor: colors.primarySoft,
                  borderRadius: 14,
                  padding: 14,
                  flexDirection: 'row',
                  gap: 10,
                }}
              >
                <Icon name="sparkles-outline" size={20} />
                <Text style={[ui.small, { flex: 1, color: colors.primaryDark }]}>
                  As sessões da disciplina realizadas entre essas datas contam automaticamente para
                  a meta. Você pode criar metas gerais ou por disciplina.
                </Text>
              </View>
            </>
          )}
        </>
      )}
    </FormModal>
  );
}
