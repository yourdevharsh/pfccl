import { useCallback, useEffect, useRef, useState } from "react";
import { meetingApi, repositoryApi } from "./api";
import { mergeCompanyIntoList, mergeDetailIntoCompany } from "./utils/dataMerge";
import { getCurrentYear } from "./config/treeConfig";

function detailCacheKey(companyId, detailKey) {
  return `${companyId}:${detailKey}`;
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
  const meetingsRef = useRef({});

  useEffect(() => {
    companiesRef.current = companies;
  }, [companies]);

  useEffect(() => {
    meetingsRef.current = meetingsByCompany;
  }, [meetingsByCompany]);

  const replaceCompanies = useCallback((nextOrUpdater) => {
    const next = typeof nextOrUpdater === "function" ? nextOrUpdater(companiesRef.current) : nextOrUpdater;
    companiesRef.current = next;
    setCompanies(next);
  }, []);

  const refreshMeetingOverview = useCallback(async () => {
    try {
      const [dashboardResponse, eventsResponse] = await Promise.all([
        meetingApi.getDashboard(),
        meetingApi.getEvents(),
      ]);
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
      const [rootResponse, divisionsResponse] = await Promise.all([
        repositoryApi.getRoot(),
        repositoryApi.getDivisions(),
      ]);
      setRoot(rootResponse?.data ?? rootResponse);
      setDivisions(divisionsResponse?.data ?? divisionsResponse ?? []);
      refreshMeetingOverview();
    } catch (requestError) {
      setError(requestError.message || "Unable to load repository metadata.");
    } finally {
      setLoading(false);
    }
  }, [refreshMeetingOverview]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const fetchCompanies = useCallback(async (division, year, status = "ALL") => {
    const cacheKey = `${division}:${year}:${status}`;
    if (companyRequestCache.current.has(cacheKey)) {
      return companyRequestCache.current.get(cacheKey);
    }

    const promise = repositoryApi
      .getCompanies(division, year, status)
      .then((response) => {
        const rows = response?.data ?? response ?? [];
        replaceCompanies((current) => {
          let next = current;
          rows.forEach((company) => {
            next = mergeCompanyIntoList(next, company);
          });
          return next;
        });
        return rows;
      })
      .catch((requestError) => {
        companyRequestCache.current.delete(cacheKey);
        throw requestError;
      });

    companyRequestCache.current.set(cacheKey, promise);
    return promise;
  }, [replaceCompanies]);

  const ensureCompany = useCallback(async (companyId) => {
    const cached = companiesRef.current.find((company) => company.id === companyId);
    if (cached?.__fullLoaded) return cached;

    if (companyRequestCache.current.has(`company:${companyId}`)) {
      return companyRequestCache.current.get(`company:${companyId}`);
    }

    const promise = repositoryApi
      .getCompany(companyId)
      .then((response) => {
        const incoming = { ...(response?.data ?? response), __fullLoaded: true };
        replaceCompanies((current) => mergeCompanyIntoList(current, incoming));
        return incoming;
      })
      .catch((requestError) => {
        companyRequestCache.current.delete(`company:${companyId}`);
        throw requestError;
      });

    companyRequestCache.current.set(`company:${companyId}`, promise);
    return promise;
  }, [replaceCompanies]);

  const ensureDetail = useCallback(async (companyId, detailKey) => {
    const cacheKey = detailCacheKey(companyId, detailKey);
    if (detailLoadedCache.current.has(cacheKey)) return;

    if (detailRequestCache.current.has(cacheKey)) {
      return detailRequestCache.current.get(cacheKey);
    }

    setLoadingDetail(true);
    const promise = repositoryApi
      .getCompanyDetail(companyId, detailKey)
      .then((response) => {
        const detail = response?.data ?? response;
        replaceCompanies((current) =>
          current.map((company) =>
            company.id === companyId
              ? mergeDetailIntoCompany(company, detailKey, detail)
              : company,
          ),
        );
        detailLoadedCache.current.add(cacheKey);
      })
      .catch((requestError) => {
        detailRequestCache.current.delete(cacheKey);
        throw requestError;
      })
      .finally(() => setLoadingDetail(false));

    detailRequestCache.current.set(cacheKey, promise);
    return promise;
  }, [replaceCompanies]);

  const ensureMeetings = useCallback(async (companyId) => {
    if (Object.prototype.hasOwnProperty.call(meetingsRef.current, companyId)) {
      return meetingsRef.current[companyId];
    }

    if (meetingRequestCache.current.has(companyId)) {
      return meetingRequestCache.current.get(companyId);
    }

    const promise = meetingApi.getCompanyMeetings(companyId)
      .then((response) => {
        const rows = response?.data ?? response ?? [];
        meetingsRef.current = { ...meetingsRef.current, [companyId]: rows };
        setMeetingsByCompany((current) => ({ ...current, [companyId]: rows }));
        return rows;
      })
      .catch((requestError) => {
        meetingRequestCache.current.delete(companyId);
        throw requestError;
      });

    meetingRequestCache.current.set(companyId, promise);
    return promise;
  }, []);

  useEffect(() => {
    async function hydrateSelection() {
      if (!selectedNodeId || selectedNodeId === "pfccl") return;

      let companyId = null;
      let detailKey = null;

      for (const company of companiesRef.current) {
        if (selectedNodeId === company.id) {
          companyId = company.id;
          break;
        }
        if (selectedNodeId.startsWith(`${company.id}-`)) {
          companyId = company.id;
          detailKey = selectedNodeId.slice(`${company.id}-`.length);
          break;
        }
      }

      if (!companyId) return;

      try {
        await ensureCompany(companyId);
        if (detailKey) {
          await ensureDetail(companyId, detailKey);
          if (detailKey === "meetings") await ensureMeetings(companyId);
        }
      } catch (requestError) {
        setError(requestError.message || "Unable to load selected details.");
      }
    }

    hydrateSelection();
  }, [selectedNodeId, ensureCompany, ensureDetail, ensureMeetings]);

  useEffect(() => {
    Object.entries(selectedYearByDivision || {}).forEach(([division, year]) => {
      const status = selectedStatusByDivision?.[division] || "ALL";
      fetchCompanies(division, year, status).catch((requestError) => {
        setError(requestError.message || "Unable to load companies.");
      });
    });
  }, [selectedYearByDivision, selectedStatusByDivision, fetchCompanies]);

  useEffect(() => {
    if (selectedNodeId !== "umpp" && selectedNodeId !== "itp") return;
    fetchCompanies(selectedNodeId, "all", "ALL").catch((requestError) => {
      setError(requestError.message || "Unable to load division companies.");
    });
  }, [selectedNodeId, fetchCompanies]);

  const persistCompanyUpdate = useCallback((companyId, updater) => {
    const current = companiesRef.current.find((company) => company.id === companyId);
    if (!current) return;

    const nextCompany = updater(current);
    const nextList = companiesRef.current.map((company) =>
      company.id === companyId ? nextCompany : company,
    );
    replaceCompanies(nextList);

    const previousQueue = saveQueues.current.get(companyId) || Promise.resolve();
    const nextQueue = previousQueue
      .catch(() => {})
      .then(() => {
        const { __fullLoaded, ...payload } = nextCompany;
        return repositoryApi.updateCompany(companyId, payload);
      })
      .catch((requestError) => {
        setError(requestError.message || "Unable to save changes.");
      });
    saveQueues.current.set(companyId, nextQueue);
  }, [replaceCompanies]);

  const addCompany = useCallback(async (division) => {
    const currentYear = getCurrentYear();
    try {
      const response = await repositoryApi.createCompany({
        division,
        incorporationDate: `${currentYear}-01-01`,
        status: "ACTIVE",
        meetingProfile: "STANDARD_120",
      });
      const company = response?.data ?? response;
      replaceCompanies(mergeCompanyIntoList(companiesRef.current, company));
      await refreshMeetingOverview();
      return company;
    } catch (requestError) {
      setError(requestError.message || "Unable to create company.");
      return null;
    }
  }, [replaceCompanies, refreshMeetingOverview]);

  const deleteCompany = useCallback(async (companyId) => {
    try {
      await repositoryApi.deleteCompany(companyId);
      replaceCompanies(companiesRef.current.filter((company) => company.id !== companyId));
      meetingsRef.current = { ...meetingsRef.current };
      delete meetingsRef.current[companyId];
      setMeetingsByCompany((current) => {
        const next = { ...current };
        delete next[companyId];
        return next;
      });
      await refreshMeetingOverview();
    } catch (requestError) {
      setError(requestError.message || "Unable to delete company.");
    }
  }, [replaceCompanies, refreshMeetingOverview]);

  const uploadFiles = useCallback(async ({ companyId, detailKey, field, files }) => {
    const response = await repositoryApi.uploadFiles({ companyId, detailKey, field, files });
    const updatedCompany = response?.company ?? response?.data?.company;
    const detail = response?.detail ?? response?.data?.detail;
    if (updatedCompany) {
      replaceCompanies(mergeCompanyIntoList(companiesRef.current, updatedCompany));
    } else if (detail) {
      replaceCompanies((current) => current.map((company) => company.id === companyId ? mergeDetailIntoCompany(company, detailKey, detail) : company));
    } else {
      detailLoadedCache.current.delete(detailCacheKey(companyId, detailKey));
      await ensureDetail(companyId, detailKey);
    }
    return response;
  }, [ensureDetail, replaceCompanies]);

  const deleteFile = useCallback(async ({ companyId, detailKey, field, fileId }) => {
    const response = await repositoryApi.deleteFile({ companyId, detailKey, field, fileId });
    const updatedCompany = response?.company ?? response?.data?.company;
    const detail = response?.detail ?? response?.data?.detail;
    if (updatedCompany) {
      replaceCompanies(mergeCompanyIntoList(companiesRef.current, updatedCompany));
    } else if (detail) {
      replaceCompanies((current) => current.map((company) => company.id === companyId ? mergeDetailIntoCompany(company, detailKey, detail) : company));
    } else {
      detailLoadedCache.current.delete(detailCacheKey(companyId, detailKey));
      await ensureDetail(companyId, detailKey);
    }
    return response;
  }, [ensureDetail, replaceCompanies]);

  const replaceCompanyMeetings = useCallback((companyId, rows) => {
    meetingsRef.current = { ...meetingsRef.current, [companyId]: rows };
    setMeetingsByCompany((current) => ({ ...current, [companyId]: rows }));
  }, []);

  const createMeeting = useCallback(async (companyId, payload) => {
    const response = await meetingApi.createMeeting(companyId, payload);
    await ensureMeetings(companyId);
    const rows = await meetingApi.getCompanyMeetings(companyId);
    replaceCompanyMeetings(companyId, rows?.data ?? rows ?? []);
    await refreshMeetingOverview();
    return response?.data ?? response;
  }, [ensureMeetings, replaceCompanyMeetings, refreshMeetingOverview]);

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
    root,
    divisions,
    companies,
    loading,
    loadingDetail,
    error,
    setError,
    fetchCompanies,
    ensureCompany,
    ensureDetail,
    ensureMeetings,
    updateCompany: persistCompanyUpdate,
    addCompany,
    deleteCompany,
    uploadFiles,
    deleteFile,
    meetingsByCompany,
    meetingDashboard,
    meetingEvents,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    recordEarlyBoardMeeting,
    refreshMeetingOverview,
  };
}
