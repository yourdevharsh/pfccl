import { useCallback, useEffect, useRef, useState } from "react";
import { meetingApi, repositoryApi } from "./api";
import { mergeCompanyIntoList, mergeDetailIntoCompany } from "./utils/dataMerge";
import { getCurrentYear } from "./config/treeConfig";

function detailCacheKey(companyId, detailKey) {
  return `${companyId}:${detailKey}`;
}

function parseSelectionNode(selectedNodeId) {
  if (!selectedNodeId || selectedNodeId === "pfccl" || selectedNodeId === "umpp" || selectedNodeId === "itp") return { companyId: null, detailKey: null };
  const detailKeys = ["master-data", "meetings", "filings", "transfer", "certificates", "miscellaneous"];
  const detailKey = detailKeys.find((key) => selectedNodeId.endsWith(`-${key}`));
  return detailKey
    ? { companyId: selectedNodeId.slice(0, -(detailKey.length + 1)), detailKey }
    : { companyId: selectedNodeId, detailKey: null };
}

export function useRepositoryData({ selectedNodeId, selectedYearByDivision, selectedStatusByDivision }) {
  const [companies, setCompanies] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [root, setRoot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [meetingsByCompany, setMeetingsByCompany] = useState({});
  const [meetingDashboard, setMeetingDashboard] = useState({ companies: [] });
  const [meetingEvents, setMeetingEvents] = useState({ events: [] });

  const companiesRef = useRef([]);
  const companyRequestCache = useRef(new Map());
  const detailRequestCache = useRef(new Map());
  const detailLoadedCache = useRef(new Set());
  const meetingRequestCache = useRef(new Map());
  const saveQueues = useRef(new Map());
  const saveTimers = useRef(new Map());
  const meetingsRef = useRef({});

  useEffect(() => { companiesRef.current = companies; }, [companies]);
  useEffect(() => { meetingsRef.current = meetingsByCompany; }, [meetingsByCompany]);

  const replaceCompanies = useCallback((nextOrUpdater) => {
    const next = typeof nextOrUpdater === "function" ? nextOrUpdater(companiesRef.current) : nextOrUpdater;
    companiesRef.current = next;
    setCompanies(next);
  }, []);

  const refreshRepositoryMeta = useCallback(async () => {
    try {
      const response = await repositoryApi.getRoot();
      setRoot(response?.data ?? response);
    } catch (requestError) {
      setError(requestError.message || "Unable to refresh repository summary.");
    }
  }, []);

  const refreshMeetingOverview = useCallback(async () => {
    try {
      const [dashboardResponse, eventsResponse] = await Promise.all([meetingApi.getDashboard(), meetingApi.getEvents()]);
      setMeetingDashboard(dashboardResponse?.data ?? dashboardResponse ?? { companies: [] });
      setMeetingEvents(eventsResponse?.data ?? eventsResponse ?? { events: [] });
    } catch (requestError) {
      setError(requestError.message || "Unable to load Board Meeting reminders.");
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [rootResponse, divisionsResponse] = await Promise.all([repositoryApi.getRoot(), repositoryApi.getDivisions()]);
      setRoot(rootResponse?.data ?? rootResponse);
      setDivisions(divisionsResponse?.data ?? divisionsResponse ?? []);
      await refreshMeetingOverview();
    } catch (requestError) {
      setError(requestError.message || "Unable to load repository metadata.");
    } finally {
      setLoading(false);
    }
  }, [refreshMeetingOverview]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  // Keep date-bound reminders live while the application is open. A light
  // 60-second refresh avoids stale Board Meeting events after another user,
  // tab, or import changes a meeting.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      refreshMeetingOverview();
    };
    const interval = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(interval);
  }, [refreshMeetingOverview]);

  const fetchCompanies = useCallback(async (division, year, status = "ALL") => {
    const cacheKey = `${division}:${year}:${status}`;
    if (companyRequestCache.current.has(cacheKey)) return companyRequestCache.current.get(cacheKey);
    const promise = repositoryApi.getCompanies(division, year, status)
      .then((response) => {
        const rows = response?.data ?? response ?? [];
        replaceCompanies((current) => rows.reduce((acc, company) => mergeCompanyIntoList(acc, company), current));
        return rows;
      })
      .catch((requestError) => { companyRequestCache.current.delete(cacheKey); throw requestError; });
    companyRequestCache.current.set(cacheKey, promise);
    return promise;
  }, [replaceCompanies]);

  const ensureCompany = useCallback(async (companyId) => {
    const cached = companiesRef.current.find((company) => company.id === companyId);
    if (cached?.__fullLoaded) return cached;
    if (companyRequestCache.current.has(`company:${companyId}`)) return companyRequestCache.current.get(`company:${companyId}`);
    const promise = repositoryApi.getCompany(companyId)
      .then((response) => {
        const incoming = { ...(response?.data ?? response), __fullLoaded: true };
        replaceCompanies((current) => mergeCompanyIntoList(current, incoming));
        return incoming;
      })
      .catch((requestError) => { companyRequestCache.current.delete(`company:${companyId}`); throw requestError; });
    companyRequestCache.current.set(`company:${companyId}`, promise);
    return promise;
  }, [replaceCompanies]);

  const ensureDetail = useCallback(async (companyId, detailKey) => {
    const cacheKey = detailCacheKey(companyId, detailKey);
    if (detailLoadedCache.current.has(cacheKey)) return;
    if (detailRequestCache.current.has(cacheKey)) return detailRequestCache.current.get(cacheKey);
    setLoadingDetail(true);
    const promise = repositoryApi.getCompanyDetail(companyId, detailKey)
      .then((response) => {
        const detail = response?.data ?? response;
        replaceCompanies((current) => current.map((company) => company.id === companyId ? mergeDetailIntoCompany(company, detailKey, detail) : company));
        detailLoadedCache.current.add(cacheKey);
        return detail;
      })
      .catch((requestError) => { detailRequestCache.current.delete(cacheKey); throw requestError; })
      .finally(() => setLoadingDetail(false));
    detailRequestCache.current.set(cacheKey, promise);
    return promise;
  }, [replaceCompanies]);

  const ensureMeetings = useCallback(async (companyId) => {
    if (Object.prototype.hasOwnProperty.call(meetingsRef.current, companyId)) return meetingsRef.current[companyId];
    if (meetingRequestCache.current.has(companyId)) return meetingRequestCache.current.get(companyId);
    const promise = meetingApi.getCompanyMeetings(companyId)
      .then((response) => {
        const rows = response?.data ?? response ?? [];
        meetingsRef.current = { ...meetingsRef.current, [companyId]: rows };
        setMeetingsByCompany((current) => ({ ...current, [companyId]: rows }));
        return rows;
      })
      .catch((requestError) => { meetingRequestCache.current.delete(companyId); throw requestError; });
    meetingRequestCache.current.set(companyId, promise);
    return promise;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function hydrateSelection() {
      const { companyId, detailKey } = parseSelectionNode(selectedNodeId);
      if (!companyId) return;
      try {
        await ensureCompany(companyId);
        if (cancelled) return;
        if (detailKey) {
          await ensureDetail(companyId, detailKey);
          if (detailKey === "meetings") await ensureMeetings(companyId);
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError.message || "Unable to load selected details.");
      }
    }
    hydrateSelection();
    return () => { cancelled = true; };
  }, [selectedNodeId, ensureCompany, ensureDetail, ensureMeetings]);

  useEffect(() => {
    Object.entries(selectedYearByDivision || {}).forEach(([division, year]) => {
      const status = selectedStatusByDivision?.[division] || "ALL";
      fetchCompanies(division, year, status).catch((requestError) => setError(requestError.message || "Unable to load companies."));
    });
  }, [selectedYearByDivision, selectedStatusByDivision, fetchCompanies]);

  useEffect(() => {
    if (selectedNodeId !== "umpp" && selectedNodeId !== "itp") return;
    fetchCompanies(selectedNodeId, "all", "ALL").catch((requestError) => setError(requestError.message || "Unable to load division companies."));
  }, [selectedNodeId, fetchCompanies]);

  const persistCompanyUpdate = useCallback((companyId, updater) => {
    const current = companiesRef.current.find((company) => company.id === companyId);
    if (!current) return;
    const nextCompany = updater(current);
    replaceCompanies((currentList) => currentList.map((company) => company.id === companyId ? nextCompany : company));

    const oldTimer = saveTimers.current.get(companyId);
    if (oldTimer) clearTimeout(oldTimer);
    saveTimers.current.set(companyId, setTimeout(() => {
      const previousQueue = saveQueues.current.get(companyId) || Promise.resolve();
      const nextQueue = previousQueue.catch(() => {}).then(async () => {
        const latest = companiesRef.current.find((company) => company.id === companyId);
        if (!latest) return;
        const { __fullLoaded, ...payload } = latest;
        const saved = await repositoryApi.updateCompany(companyId, payload);
        replaceCompanies((currentList) => mergeCompanyIntoList(currentList, saved?.data ?? saved));
        await Promise.all([refreshRepositoryMeta(), refreshMeetingOverview()]);
      }).catch((requestError) => setError(requestError.message || "Unable to save changes."));
      saveQueues.current.set(companyId, nextQueue);
    }, 300));
  }, [replaceCompanies, refreshMeetingOverview, refreshRepositoryMeta]);

  const addCompany = useCallback(async (division) => {
    try {
      const currentYear = getCurrentYear();
      const response = await repositoryApi.createCompany({ division, incorporationDate: `${currentYear}-01-01`, status: "ACTIVE", meetingProfile: "STANDARD_120" });
      const company = response?.data ?? response;
      replaceCompanies((current) => mergeCompanyIntoList(current, company));
      await Promise.all([refreshRepositoryMeta(), refreshMeetingOverview()]);
      return company;
    } catch (requestError) {
      setError(requestError.message || "Unable to create company.");
      return null;
    }
  }, [replaceCompanies, refreshMeetingOverview, refreshRepositoryMeta]);

  const deleteCompany = useCallback(async (companyId) => {
    try {
      await repositoryApi.deleteCompany(companyId);
      replaceCompanies((current) => current.filter((company) => company.id !== companyId));
      const nextMeetingMap = { ...meetingsRef.current };
      delete nextMeetingMap[companyId];
      meetingsRef.current = nextMeetingMap;
      setMeetingsByCompany(nextMeetingMap);
      await Promise.all([refreshRepositoryMeta(), refreshMeetingOverview()]);
    } catch (requestError) {
      setError(requestError.message || "Unable to delete company.");
    }
  }, [replaceCompanies, refreshMeetingOverview, refreshRepositoryMeta]);

  const refreshCompanyDetail = useCallback(async (companyId, detailKey) => {
    detailLoadedCache.current.delete(detailCacheKey(companyId, detailKey));
    return ensureDetail(companyId, detailKey);
  }, [ensureDetail]);

  const refreshMeetings = useCallback(async (companyId) => {
    const response = await meetingApi.getCompanyMeetings(companyId);
    const rows = response?.data ?? response ?? [];
    meetingsRef.current = { ...meetingsRef.current, [companyId]: rows };
    setMeetingsByCompany((current) => ({ ...current, [companyId]: rows }));
    return rows;
  }, []);

  const uploadFiles = useCallback(async ({ companyId, detailKey, field, files }) => {
    const response = await repositoryApi.uploadFiles({ companyId, detailKey, field, files });
    const updatedCompany = response?.company ?? response?.data?.company;
    if (updatedCompany) replaceCompanies((current) => mergeCompanyIntoList(current, updatedCompany));
    else await refreshCompanyDetail(companyId, detailKey);
    if (detailKey === "meetings" && String(field).startsWith("meeting.")) await refreshMeetings(companyId);
    return response;
  }, [refreshCompanyDetail, refreshMeetings, replaceCompanies]);

  const deleteFile = useCallback(async ({ companyId, detailKey, field, fileId }) => {
    const response = await repositoryApi.deleteFile({ companyId, detailKey, field, fileId });
    const updatedCompany = response?.company ?? response?.data?.company;
    if (updatedCompany) replaceCompanies((current) => mergeCompanyIntoList(current, updatedCompany));
    else await refreshCompanyDetail(companyId, detailKey);
    if (detailKey === "meetings" && String(field).startsWith("meeting.")) await refreshMeetings(companyId);
    return response;
  }, [refreshCompanyDetail, refreshMeetings, replaceCompanies]);

  const replaceCompanyMeetings = useCallback((companyId, rows) => {
    meetingsRef.current = { ...meetingsRef.current, [companyId]: rows };
    setMeetingsByCompany((current) => ({ ...current, [companyId]: rows }));
  }, []);

  const createMeeting = useCallback(async (companyId, payload) => {
    const response = await meetingApi.createMeeting(companyId, payload);
    const rows = await meetingApi.getCompanyMeetings(companyId);
    replaceCompanyMeetings(companyId, rows?.data ?? rows ?? []);
    await refreshMeetingOverview();
    return response?.data ?? response;
  }, [replaceCompanyMeetings, refreshMeetingOverview]);

  const updateMeeting = useCallback(async (companyId, meetingId, payload) => {
    const response = await meetingApi.updateMeeting(companyId, meetingId, payload);
    const rows = await meetingApi.getCompanyMeetings(companyId);
    replaceCompanyMeetings(companyId, rows?.data ?? rows ?? []);
    await refreshMeetingOverview();
    return response?.data ?? response;
  }, [replaceCompanyMeetings, refreshMeetingOverview]);

  const deleteMeeting = useCallback(async (companyId, meetingId) => {
    await meetingApi.deleteMeeting(companyId, meetingId);
    const rows = await meetingApi.getCompanyMeetings(companyId);
    replaceCompanyMeetings(companyId, rows?.data ?? rows ?? []);
    await refreshMeetingOverview();
  }, [replaceCompanyMeetings, refreshMeetingOverview]);

  const recordEarlyBoardMeeting = useCallback(async (companyId, heldDate) => {
    const response = await meetingApi.recordEarlyBoardMeeting(companyId, heldDate);
    const rows = await meetingApi.getCompanyMeetings(companyId);
    replaceCompanyMeetings(companyId, rows?.data ?? rows ?? []);
    await refreshMeetingOverview();
    return response?.data ?? response;
  }, [replaceCompanyMeetings, refreshMeetingOverview]);

  return {
    root, divisions, companies, loading, loadingDetail, error, setError,
    fetchCompanies, ensureCompany, ensureDetail, ensureMeetings,
    updateCompany: persistCompanyUpdate, addCompany, deleteCompany,
    uploadFiles, deleteFile, meetingsByCompany, meetingDashboard, meetingEvents,
    createMeeting, updateMeeting, deleteMeeting, recordEarlyBoardMeeting,
    refreshMeetingOverview, refreshRepositoryMeta,
  };
}
