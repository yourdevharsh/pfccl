import { useCallback, useRef, useState } from "react";

// Keeps UI state snapshots rather than database mutations.  The repository
// owns the snapshot contents; this hook deliberately stays domain-agnostic.
export default function useChangeTracker() {
  const historyRef = useRef([]);
  const baselineRef = useRef(null);
  const [changeCount, setChangeCount] = useState(0);

  const record = useCallback((snapshot) => {
    if (!baselineRef.current) baselineRef.current = snapshot;
    historyRef.current.push(snapshot);
    setChangeCount(historyRef.current.length);
  }, []);

  const undo = useCallback(() => {
    const snapshot = historyRef.current.pop();
    setChangeCount(historyRef.current.length);
    if (!historyRef.current.length) baselineRef.current = null;
    return snapshot || null;
  }, []);

  const revert = useCallback(() => {
    const snapshot = baselineRef.current;
    historyRef.current = [];
    baselineRef.current = null;
    setChangeCount(0);
    return snapshot || null;
  }, []);

  const clear = useCallback(() => {
    historyRef.current = [];
    baselineRef.current = null;
    setChangeCount(0);
  }, []);

  return { changeCount, record, undo, revert, clear };
}
