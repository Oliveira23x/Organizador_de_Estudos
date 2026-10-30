import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { readableError } from '../utils/errors';

const StudyContext = createContext(null);

export function StudyProvider({ service, children }) {
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(() => setRevision((r) => r + 1), []);
  const dismissNotice = useCallback(() => setNotice(null), []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    // Recalcula prazos e o dia atual se o app permanecer aberto durante a virada do dia.
    let currentDay = new Date().toDateString();
    const interval = setInterval(() => {
      const nextDay = new Date().toDateString();
      if (nextDay !== currentDay) {
        currentDay = nextDay;
        refresh();
      }
    }, 30000);
    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [refresh]);

  useEffect(() => {
    if (!notice || notice.type === 'error') return undefined;
    const timer = setTimeout(dismissNotice, 4000);
    return () => clearTimeout(timer);
  }, [notice, dismissNotice]);

  const mutate = useCallback(
    async (operation, successMessage) => {
      if (busyRef.current) return false;
      busyRef.current = true;
      setBusy(true);
      setNotice(null);
      try {
        await operation(service);
        refresh();
        setNotice({ type: 'success', message: successMessage });
        return true;
      } catch (error) {
        setNotice({ type: 'error', message: readableError(error) });
        return false;
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [service, refresh],
  );

  return (
    <StudyContext.Provider
      value={{ service, revision, refresh, mutate, busy, notice, dismissNotice }}
    >
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  return useContext(StudyContext);
}

export function useQuery(query, dependencies = []) {
  const { service, revision } = useStudy();
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((old) => ({ ...old, loading: true, error: null }));
    (async () => {
      try {
        const data = await query(service);
        if (alive) setState({ data, loading: false, error: null });
      } catch (error) {
        if (alive) setState({ data: null, loading: false, error: readableError(error) });
      }
    })();
    return () => {
      alive = false;
    };
  }, [service, revision, retry, ...dependencies]);
  return { ...state, retry: () => setRetry((n) => n + 1) };
}
