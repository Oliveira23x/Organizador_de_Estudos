import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, ui } from '../theme';
import { formatDate, formatMinutes } from '../utils/dates';

export function Icon({ name, size = 20, color = colors.primary, ...rest }) {
  return <Ionicons name={name} size={size} color={color} {...rest} />;
}

export function Button({
  title,
  icon,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  testID,
}) {
  const foreground =
    variant === 'primary' ? '#FFFFFF' : variant === 'danger' ? colors.danger : colors.primary;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={foreground} />
      ) : icon ? (
        <Icon name={icon} size={18} color={foreground} />
      ) : null}
      <Text style={{ color: foreground, fontSize: 14, fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress, danger, disabled }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && { backgroundColor: colors.primarySoft },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Icon name={icon} size={18} color={danger ? colors.danger : colors.muted} />
    </Pressable>
  );
}

export function Badge({ text, color = colors.primary, soft = colors.primarySoft, icon }) {
  return (
    <View style={[styles.badge, { backgroundColor: soft }]}>
      {icon && <Icon name={icon} size={12} color={color} />}
      <Text style={{ fontSize: 11, fontWeight: '700', color }}>{text}</Text>
    </View>
  );
}

export function Field({ label, hint, multiline, ...props }) {
  return (
    <View>
      <Text style={ui.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#9AA59C"
        style={[ui.input, multiline && { minHeight: 90, textAlignVertical: 'top' }]}
        multiline={multiline}
        {...props}
      />
      {hint && <Text style={[ui.small, { marginTop: 6 }]}>{hint}</Text>}
    </View>
  );
}

export function Chips({ items, value, onChange, label }) {
  return (
    <View style={{ gap: 8 }}>
      {label && <Text style={[ui.label, { marginBottom: 0 }]}>{label}</Text>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
      >
        {items.map((item) => (
          <Pressable
            key={String(item.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: value === item.value }}
            accessibilityLabel={`${label || 'Filtro'}: ${item.label}`}
            onPress={() => onChange(item.value)}
            style={[styles.chip, value === item.value && styles.chipSelected]}
          >
            <Text
              style={[
                styles.chipText,
                value === item.value && { color: colors.primary, fontWeight: '700' },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function Search({ value, onChangeText, placeholder = 'Buscar...' }) {
  return (
    <View style={styles.search}>
      <Icon name="search-outline" size={18} color={colors.muted} />
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor="#96A199"
        value={value}
        onChangeText={onChangeText}
        style={{ flex: 1, minHeight: 44, fontSize: 14, color: colors.ink }}
      />
      {value ? (
        <IconButton icon="close-outline" label="Limpar busca" onPress={() => onChangeText('')} />
      ) : null}
    </View>
  );
}

export function SectionHeader({ title, action, onPress }) {
  return (
    <View style={ui.between}>
      <Text style={ui.sectionTitle}>{title}</Text>
      {action && (
        <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>{action} →</Text>
        </Pressable>
      )}
    </View>
  );
}

export function EmptyState({ icon = 'leaf-outline', title, text, action, onAction }) {
  return (
    <View style={[ui.card, { alignItems: 'center', paddingVertical: 32, gap: 12 }]}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={29} />
      </View>
      <Text style={[ui.sectionTitle, { textAlign: 'center' }]}>{title}</Text>
      <Text style={[ui.subtitle, { textAlign: 'center', maxWidth: 300 }]}>{text}</Text>
      {action && <Button title={action} onPress={onAction} style={{ marginTop: 5 }} />}
    </View>
  );
}

export function QueryState({ query, empty, children }) {
  if (query.loading && !query.data)
    return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;
  if (query.error)
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title="Não foi possível carregar"
        text={query.error}
        action="Tentar novamente"
        onAction={query.retry}
      />
    );
  if (!query.data || (Array.isArray(query.data) && !query.data.length)) return empty || null;
  return children(query.data);
}

export function FormModal({
  visible,
  title,
  subtitle,
  onClose,
  onSubmit,
  busy,
  error,
  onDismissError,
  children,
}) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  useEffect(() => {
    if (error) scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [error]);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalKeyboard}
        >
          <View
            style={[
              styles.modalPanel,
              { paddingBottom: Math.max(insets.bottom, 16), marginTop: Math.max(insets.top, 20) },
            ]}
          >
            <View style={{ alignItems: 'center', paddingVertical: 10 }}>
              <View style={{ width: 38, height: 4, backgroundColor: '#DCE4D9', borderRadius: 4 }} />
            </View>
            <View style={[ui.between, { paddingHorizontal: 22, paddingBottom: 14 }]}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[ui.title, { fontSize: 23 }]}>{title}</Text>
                {subtitle && <Text style={ui.small}>{subtitle}</Text>}
              </View>
              <IconButton
                icon="close"
                label="Fechar formulário"
                disabled={busy}
                onPress={onClose}
              />
            </View>
            <ScrollView
              ref={scrollRef}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 24, gap: 18 }}
            >
              {error && (
                <Notice notice={{ type: 'error', message: error }} onDismiss={onDismissError} />
              )}
              {children}
            </ScrollView>
            <View
              style={{
                paddingHorizontal: 22,
                paddingTop: 12,
                borderTopWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Button title="Salvar" icon="checkmark" onPress={onSubmit} loading={busy} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function ConfirmDialog({ item, busy, onCancel, onConfirm }) {
  return (
    <Modal
      visible={Boolean(item)}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!busy) onCancel();
      }}
    >
      <View style={[styles.modalBackdrop, { justifyContent: 'center', padding: 24 }]}>
        <View
          style={[
            ui.card,
            { width: '100%', maxWidth: 450, alignSelf: 'center', gap: 18, padding: 24 },
          ]}
        >
          <View style={[styles.emptyIcon, { backgroundColor: colors.dangerSoft }]}>
            <Icon name="trash-outline" size={26} color={colors.danger} />
          </View>
          <Text style={ui.sectionTitle}>Excluir este registro?</Text>
          <Text style={ui.subtitle}>{item?.message} Esta ação não pode ser desfeita.</Text>
          <View style={ui.row}>
            <Button
              title="Cancelar"
              variant="secondary"
              disabled={busy}
              onPress={onCancel}
              style={{ flex: 1 }}
            />
            <Button
              title="Excluir"
              variant="danger"
              loading={busy}
              onPress={onConfirm}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function Notice({ notice, onDismiss }) {
  if (!notice) return null;
  const error = notice.type === 'error';
  return (
    <View
      accessibilityRole="alert"
      style={[styles.notice, { backgroundColor: error ? colors.dangerSoft : colors.primarySoft }]}
    >
      <Icon
        name={error ? 'alert-circle-outline' : 'checkmark-circle-outline'}
        size={21}
        color={error ? colors.danger : colors.primary}
      />
      <Text
        style={{
          flex: 1,
          fontSize: 13,
          lineHeight: 19,
          color: error ? colors.danger : colors.primaryDark,
        }}
      >
        {notice.message}
      </Text>
      <IconButton icon="close" label="Fechar mensagem" onPress={onDismiss} />
    </View>
  );
}

export function Progress({ value, color = colors.primary }) {
  const safeValue = Math.min(100, Math.max(0, value || 0));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: safeValue }}
      style={styles.track}
    >
      <View
        style={{ width: `${safeValue}%`, height: 7, borderRadius: 5, backgroundColor: color }}
      />
    </View>
  );
}

export function SessionCard({ item, onEdit, onDelete, compact }) {
  return (
    <View style={[ui.card, { padding: 16, gap: 10 }]}>
      <View style={ui.between}>
        <View style={[ui.row, { flex: 1 }]}>
          <View style={[styles.subjectIcon, { backgroundColor: `${item.subject_color}16` }]}>
            <Icon name="book-outline" color={item.subject_color} size={19} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.itemTitle}>{item.topic}</Text>
            <Text style={ui.small}>{item.subject_name}</Text>
          </View>
        </View>
        <Badge text={formatMinutes(item.minutes)} icon="time-outline" />
      </View>
      <View style={ui.between}>
        <Text style={ui.small}>{formatDate(item.studied_on)}</Text>
        {!compact && (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <IconButton
              icon="create-outline"
              label={`Editar sessão ${item.topic}`}
              onPress={onEdit}
            />
            <IconButton
              icon="trash-outline"
              label={`Excluir sessão ${item.topic}`}
              danger
              onPress={onDelete}
            />
          </View>
        )}
      </View>
      {!compact && Boolean(item.notes) && (
        <Text style={[ui.small, { paddingTop: 8, borderTopWidth: 1, borderColor: colors.border }]}>
          {item.notes}
        </Text>
      )}
    </View>
  );
}

export const GOAL_STATUS = {
  active: { text: 'Em andamento', color: colors.primary, soft: colors.primarySoft },
  completed: { text: 'Concluída', color: '#647547', soft: '#EDF2DE' },
  overdue: { text: 'Prazo encerrado', color: colors.danger, soft: colors.dangerSoft },
  scheduled: { text: 'Planejada', color: '#6975C5', soft: '#EFEFF9' },
};

export function GoalCard({ item, onEdit, onDelete, compact }) {
  const status = GOAL_STATUS[item.status] || GOAL_STATUS.active;
  return (
    <View style={[ui.card, { gap: 14 }]}>
      <View style={ui.between}>
        <Badge {...status} />
        <Text style={ui.small}>{item.subject_name || 'Todas as disciplinas'}</Text>
      </View>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <View style={{ gap: 8 }}>
        <View style={ui.between}>
          <Text style={ui.small}>
            {formatMinutes(item.studied_minutes)} de {formatMinutes(item.target_minutes)}
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primary }}>
            {item.progress}%
          </Text>
        </View>
        <Progress value={item.progress} color={item.subject_color || colors.primary} />
      </View>
      <View style={ui.between}>
        <Text style={[ui.small, { flex: 1 }]}>
          {compact
            ? `Até ${formatDate(item.end_on)}`
            : `${formatDate(item.start_on)} → ${formatDate(item.end_on)}`}
        </Text>
        {!compact && (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <IconButton
              icon="create-outline"
              label={`Editar meta ${item.title}`}
              onPress={onEdit}
            />
            <IconButton
              icon="trash-outline"
              label={`Excluir meta ${item.title}`}
              danger
              onPress={onDelete}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondary: { backgroundColor: colors.primarySoft },
  danger: { backgroundColor: colors.dangerSoft },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  chipSelected: { borderColor: '#B6D3C2', backgroundColor: colors.primarySoft },
  chipText: { color: colors.muted, fontSize: 12 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 13,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    backgroundColor: colors.primarySoft,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(20, 43, 35, 0.42)', justifyContent: 'flex-end' },
  modalKeyboard: { width: '100%', maxWidth: 600, alignSelf: 'center', maxHeight: '94%' },
  modalPanel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flexShrink: 1,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 13,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 10,
  },
  track: { height: 7, backgroundColor: '#EDF0E9', borderRadius: 5, overflow: 'hidden' },
  subjectIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, lineHeight: 21 },
});
