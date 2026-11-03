import { StyleSheet } from 'react-native';

export const colors = {
  background: '#F6F7F3',
  surface: '#FFFFFF',
  ink: '#203D36',
  muted: '#78877F',
  primary: '#197568',
  primaryDark: '#184D42',
  primarySoft: '#E7F1EB',
  border: '#E6EBE4',
  danger: '#B44945',
  dangerSoft: '#FCECE9',
  gold: '#CA9A4B',
};

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 28, gap: 20 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 13, color: colors.ink, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#DDE5DB',
    borderRadius: 13,
    backgroundColor: '#FAFBF8',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink,
    minHeight: 48,
  },
  small: { fontSize: 12, lineHeight: 18, color: colors.muted },
});
