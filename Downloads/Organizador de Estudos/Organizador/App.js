import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { openDatabaseAsync } from 'expo-sqlite';
import { initializeDatabase } from './src/database/schema';
import { StudyService } from './src/services/StudyService';
import { StudyProvider, useQuery, useStudy } from './src/context/StudyContext';
import { Button, EmptyState, Icon, Notice } from './src/components/UI';
import EntityForm from './src/components/EntityForm';
import DashboardScreen from './src/screens/DashboardScreen';
import { GoalsScreen, SessionsScreen, SubjectsScreen } from './src/screens/ManageScreens';
import { colors, ui } from './src/theme';

let connection;
async function connect() {
  if (!connection)
    connection = (async () => {
      let db;
      try {
        db = await openDatabaseAsync('ritmo-estudos.db');
        await initializeDatabase(db);
        return new StudyService(db);
      } catch (error) {
        if (db) await db.closeAsync().catch(() => {});
        connection = null;
        throw error;
      }
    })();
  return connection;
}

export default function App() {
  const [service, setService] = useState(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setFailed(false);
    connect()
      .then((value) => {
        if (active) setService(value);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        {service ? (
          <StudyProvider service={service}>
            <Workspace />
          </StudyProvider>
        ) : (
          <View style={[ui.screen, { justifyContent: 'center', padding: 24 }]}>
            {failed ? (
              <EmptyState
                icon="alert-circle-outline"
                title="Não foi possível abrir seus estudos"
                text="Feche e reabra o aplicativo ou tente novamente. Seus dados não serão apagados."
                action="Tentar novamente"
                onAction={() => setRetry((n) => n + 1)}
              />
            ) : (
              <View style={{ alignItems: 'center', gap: 15 }}>
                <Icon name="leaf-outline" size={38} />
                <Text style={ui.title}>ritmo</Text>
                <ActivityIndicator color={colors.primary} />
                <Text style={ui.small}>Preparando seu espaço de estudos...</Text>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const TABS = [
  { id: 'dashboard', title: 'Resumo', icon: 'grid-outline', activeIcon: 'grid' },
  { id: 'subjects', title: 'Disciplinas', icon: 'book-outline', activeIcon: 'book' },
  { id: 'sessions', title: 'Sessões', icon: 'time-outline', activeIcon: 'time' },
  { id: 'goals', title: 'Metas', icon: 'flag-outline', activeIcon: 'flag' },
];

function Workspace() {
  const [tab, setTab] = useState('dashboard');
  const [editor, setEditor] = useState(null);
  const { notice, dismissNotice } = useStudy();
  const subjectQuery = useQuery((s) => s.subjects.list());
  const subjects = subjectQuery.data || [];
  const onForm = (type, record = null) => {
    dismissNotice();
    setEditor({ type, record });
  };
  const close = () => setEditor(null);
  const props = { subjects, onForm, onNavigate: setTab };
  return (
    <View style={styles.workspace}>
      <View style={styles.header}>
        <View style={[ui.row, { gap: 8 }]}>
          <View style={styles.logo}>
            <Icon name="leaf" size={19} color="#F3F6E4" />
          </View>
          <View>
            <Text style={styles.wordmark}>
              ritmo<Text style={{ color: colors.gold }}>.</Text>
            </Text>
            <Text style={styles.brandLabel}>ORGANIZADOR DE ESTUDOS</Text>
          </View>
        </View>
        <View style={ui.row}>
          <View style={{ width: 5, height: 5, backgroundColor: '#7C9E72', borderRadius: 3 }} />
          <Text style={ui.small}>Meu espaço</Text>
        </View>
      </View>
      {!editor && notice && (
        <View style={{ paddingHorizontal: 22, paddingBottom: 10 }}>
          <Notice notice={notice} onDismiss={dismissNotice} />
        </View>
      )}
      {subjectQuery.error && !editor && (
        <View style={{ paddingHorizontal: 22, paddingBottom: 10 }}>
          <Notice
            notice={{ type: 'error', message: subjectQuery.error }}
            onDismiss={subjectQuery.retry}
          />
        </View>
      )}
      <View style={{ flex: 1 }}>
        {tab === 'dashboard' ? (
          <DashboardScreen {...props} />
        ) : tab === 'subjects' ? (
          <SubjectsScreen {...props} />
        ) : tab === 'sessions' ? (
          <SessionsScreen {...props} />
        ) : (
          <GoalsScreen {...props} />
        )}
      </View>
      <View style={styles.nav}>
        {TABS.map((item) => {
          const selected = item.id === tab;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityLabel={item.title}
              accessibilityState={{ selected }}
              onPress={() => setTab(item.id)}
              style={styles.navItem}
            >
              <View style={[styles.navIcon, selected && { backgroundColor: colors.primarySoft }]}>
                <Icon
                  name={selected ? item.activeIcon : item.icon}
                  size={21}
                  color={selected ? colors.primary : '#929D93'}
                />
              </View>
              <Text
                style={{
                  color: selected ? colors.primary : '#89968D',
                  fontSize: 10,
                  fontWeight: selected ? '800' : '500',
                }}
              >
                {item.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {editor && (
        <EntityForm
          key={`${editor.type}-${editor.record?.id || 'new'}`}
          {...editor}
          subjects={subjects}
          onClose={close}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  workspace: { flex: 1, width: '100%', maxWidth: 650, alignSelf: 'center' },
  header: {
    paddingHorizontal: 22,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  logo: {
    width: 34,
    height: 37,
    borderRadius: 12,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -1.4,
    lineHeight: 29,
  },
  brandLabel: {
    fontSize: 7,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 0.7,
    marginTop: 2,
  },
  nav: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    paddingTop: 9,
    paddingBottom: 10,
  },
  navItem: { flex: 1, alignItems: 'center', gap: 5, minHeight: 54 },
  navIcon: { paddingHorizontal: 17, paddingVertical: 5, borderRadius: 11 },
});
