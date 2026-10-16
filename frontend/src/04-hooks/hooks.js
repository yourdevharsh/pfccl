import { useCallback, useEffect, useRef, useState } from "react";
import { meetingApi, repositoryApi } from "../05-services/api";
import { mergeCompanyIntoList, mergeDetailIntoCompany } from "../07-utils/dataMerge";
import { getCurrentYear } from "../06-config/treeConfig";
import useChangeTracker from "../01-app-shell/03-details-workspace/useChangeTracker";

function detailCacheKey(companyId, detailKey) {
  return `${companyId}:${detailKey}`;
}

function parseSelectionNode(selectedNodeId) {
  if (
    !selectedNodeId ||
    selectedNodeId === "pfccl" ||
    selectedNodeId === "umpp" ||
    selectedNodeId === "itp"
  )
    return { companyId: null, detailKey: null };
  const detailKeys = [
    "master-data",
    "meetings",
    "filings",
    "transfer",
    "certificates",
    "miscellaneous",
  ];
  const detailKey = detailKeys.find((key) =>
    selectedNodeId.endsWith(`-${key}`),
  );
  return detailKey
    ? { companyId: selectedNodeId.slice(0, -(detailKey.length + 1)), detailKey }
    : { companyId: selectedNodeId, detailKey: null };
}

export function useRepositoryData({
  selectedNodeId,
  selectedYearByDivision,
  selectedStatusByDivision,
}) {
  const [companies, setCompanies] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [root, setRoot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [meetingsByCompany, setMeetingsByCompany] = useState({});
  const [meetingDashboard, setMeetingDashboard] = useState({ companies: [] });
  const [meetingEvents, setMeetingEvents] = useState({ events: [] });
  const [savingChanges, setSavingChanges] = useState(false);

  const companiesRef = useRef([]);
  const companyRequestCache = useRef(new Map());
  const detailRequestCache = useRef(new Map());
  const detailLoadedCache = useRef(new Set());
  const meetingRequestCache = useRef(new Map());
  const meetingsRef = useRef({});
  const pendingFileOperations = useRef([]);
  const pendingMeetingOperations = useRef([]);
  const pendingCompanyIds = useRef(new Set());
  const changeTracker = useChangeTracker();

  useEffect(() => {
    companiesRef.current = companies;
  }, [companies]);
  useEffect(() => {
    meetingsRef.current = meetingsByCompany;
  }, [meetingsByCompany]);

  const replaceCompanies = useCallback((nextOrUpdater) => {
    const next =
      typeof nextOrUpdater === "function"
        ? nextOrUpdater(companiesRef.current)
        : nextOrUpdater;
    companiesRef.current = next;
    setCompanies(next);
  }, []);

  const replaceCompanyMeetings = useCallback((companyId, rows) => {
    meetingsRef.current = { ...meetingsRef.current, [companyId]: rows };
    setMeetingsByCompany((current) => ({ ...current, [companyId]: rows }));
  }, []);

  const restoreSnapshot = useCallback((snapshot) => {
    if (!snapshot) return;
    replaceCompanies(snapshot.companies);
    meetingsRef.current = snapshot.meetings;
    setMeetingsByCompany(snapshot.meetings);
    pendingFileOperations.current = snapshot.fileOperations;
    pendingMeetingOperations.current = snapshot.meetingOperations;
    pendingCompanyIds.current = snapshot.companyIds;
  }, [replaceCompanies]);

  const cloneSnapshot = useCallback(() => ({
    companies: structuredClone(companiesRef.current),
    meetings: structuredClone(meetingsRef.current),
    fileOperations: [...pendingFileOperations.current],
    meetingOperations: [...pendingMeetingOperations.current],
    companyIds: new Set(pendingCompanyIds.current),
  }), []);

  const recordChange = useCallback(() => {
    changeTracker.record(cloneSnapshot());
  }, [changeTracker, cloneSnapshot]);

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
      const [dashboardResponse, eventsResponse] = await Promise.all([
        meetingApi.getDashboard(),
        meetingApi.getEvents(),
      ]);
      setMeetingDashboard(
        dashboardResponse?.data ?? dashboardResponse ?? { companies: [] },
      );
      setMeetingEvents(
        eventsResponse?.data ?? eventsResponse ?? { events: [] },
      );
    } catch (requestError) {
      setError(
        requestError.message || "Unable to load Board Meeting reminders.",
      );
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
      await refreshMeetingOverview();
    } catch (requestError) {
      setError(requestError.message || "Unable to load repository metadata.");
    } finally {
      setLoading(false);
    }
  }, [refreshMeetingOverview]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

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

  const fetchCompanies = useCallback(
    async (division, year, status = "ALL") => {
      const cacheKey = `${division}:${year}:${status}`;
      if (companyRequestCache.current.has(cacheKey))
        return companyRequestCache.current.get(cacheKey);
      const promise = repositoryApi
        .getCompanies(division, year, status)
        .then((response) => {
          const rows = response?.data ?? response ?? [];
          replaceCompanies((current) =>
            rows.reduce(
              (acc, company) => mergeCompanyIntoList(acc, company),
              current,
            ),
          );
          return rows;
        })
        .catch((requestError) => {
          companyRequestCache.current.delete(cacheKey);
          throw requestError;
        });
      companyRequestCache.current.set(cacheKey, promise);
      return promise;
    },
    [replaceCompanies],
  );

  const ensureCompany = useCallback(
    async (companyId) => {
      const cached = companiesRef.current.find(
        (company) => company.id === companyId,
      );
      if (cached?.__fullLoaded) return cached;
      if (companyRequestCache.current.has(`company:${companyId}`))
        return companyRequestCache.current.get(`company:${companyId}`);
      const promise = repositoryApi
        .getCompany(companyId)
        .then((response) => {
          const incoming = {
            ...(response?.data ?? response),
            __fullLoaded: true,
          };
          replaceCompanies((current) =>
            mergeCompanyIntoList(current, incoming),
          );
          return incoming;
        })
        .catch((requestError) => {
          companyRequestCache.current.delete(`company:${companyId}`);
          throw requestError;
        });
      companyRequestCache.current.set(`company:${companyId}`, promise);
      return promise;
    },
    [replaceCompanies],
  );

  const ensureDetail = useCallback(
    async (companyId, detailKey) => {
      const cacheKey = detailCacheKey(companyId, detailKey);
      if (detailLoadedCache.current.has(cacheKey)) return;
      if (detailRequestCache.current.has(cacheKey))
        return detailRequestCache.current.get(cacheKey);
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
          return detail;
        })
        .catch((requestError) => {
          detailRequestCache.current.delete(cacheKey);
          throw requestError;
        })
        .finally(() => setLoadingDetail(false));
      detailRequestCache.current.set(cacheKey, promise);
      return promise;
    },
    [replaceCompanies],
  );

  const ensureMeetings = useCallback(async (companyId) => {
    if (Object.prototype.hasOwnProperty.call(meetingsRef.current, companyId))
      return meetingsRef.current[companyId];
    if (meetingRequestCache.current.has(companyId))
      return meetingRequestCache.current.get(companyId);
    const promise = meetingApi
      .getCompanyMeetings(companyId)
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
        if (!cancelled)
          setError(requestError.message || "Unable to load selected details.");
      }
    }
    hydrateSelection();
    return () => {
      cancelled = true;
    };
  }, [selectedNodeId, ensureCompany, ensureDetail, ensureMeetings]);

  useEffect(() => {
    Object.entries(selectedYearByDivision || {}).forEach(([division, year]) => {
      const status = selectedStatusByDivision?.[division] || "ALL";
      fetchCompanies(division, year, status).catch((requestError) =>
        setError(requestError.message || "Unable to load companies."),
      );
    });
  }, [selectedYearByDivision, selectedStatusByDivision, fetchCompanies]);

  useEffect(() => {
    if (selectedNodeId !== "umpp" && selectedNodeId !== "itp") return;
    fetchCompanies(selectedNodeId, "all", "ALL").catch((requestError) =>
      setError(requestError.message || "Unable to load division companies."),
    );
  }, [selectedNodeId, fetchCompanies]);

  const persistCompanyUpdate = useCallback(
    (companyId, updater) => {
      const current = companiesRef.current.find(
        (company) => company.id === companyId,
      );
      if (!current) return;
      const nextCompany = updater(current);
      recordChange();
      pendingCompanyIds.current.add(companyId);
      replaceCompanies((currentList) =>
        currentList.map((company) =>
          company.id === companyId ? nextCompany : company,
        ),
      );
    },
    [recordChange, replaceCompanies],
  );

  const addCompany = useCallback(
    async (division) => {
      try {
        const currentYear = getCurrentYear();
        const response = await repositoryApi.createCompany({
          division,
          incorporationDate: `${currentYear}-01-01`,
          status: "ACTIVE",
          meetingProfile: "STANDARD_120",
        });
        const company = response?.data ?? response;
        replaceCompanies((current) => mergeCompanyIntoList(current, company));
        await Promise.all([refreshRepositoryMeta(), refreshMeetingOverview()]);
        return company;
      } catch (requestError) {
        setError(requestError.message || "Unable to create company.");
        return null;
      }
    },
    [replaceCompanies, refreshMeetingOverview, refreshRepositoryMeta],
  );

  const deleteCompany = useCallback(
    async (companyId) => {
      try {
        await repositoryApi.deleteCompany(companyId);
        replaceCompanies((current) =>
          current.filter((company) => company.id !== companyId),
        );
        const nextMeetingMap = { ...meetingsRef.current };
        delete nextMeetingMap[companyId];
        meetingsRef.current = nextMeetingMap;
        setMeetingsByCompany(nextMeetingMap);
        await Promise.all([refreshRepositoryMeta(), refreshMeetingOverview()]);
      } catch (requestError) {
        setError(requestError.message || "Unable to delete company.");
      }
    },
    [replaceCompanies, refreshMeetingOverview, refreshRepositoryMeta],
  );

  const refreshCompanyDetail = useCallback(
    async (companyId, detailKey) => {
      detailLoadedCache.current.delete(detailCacheKey(companyId, detailKey));
      return ensureDetail(companyId, detailKey);
    },
    [ensureDetail],
  );

  const refreshMeetings = useCallback(async (companyId) => {
    const response = await meetingApi.getCompanyMeetings(companyId);
    const rows = response?.data ?? response ?? [];
    meetingsRef.current = { ...meetingsRef.current, [companyId]: rows };
    setMeetingsByCompany((current) => ({ ...current, [companyId]: rows }));
    return rows;
  }, []);

  const changeFileList = useCallback((companyId, detailKey, field, transform) => {
    if (detailKey === "meetings" && String(field).startsWith("meeting.")) {
      const [, meetingId, property] = String(field).split(".");
      replaceCompanyMeetings(companyId, (meetingsRef.current[companyId] || []).map((meeting) =>
        meeting.id === meetingId
          ? { ...meeting, [property]: transform(Array.isArray(meeting[property]) ? meeting[property] : []) }
          : meeting,
      ));
      return;
    }
    const property = { "master-data": "master", meetings: "meetings", filings: "filings", transfer: "transfer", certificates: "certificates", miscellaneous: "misc" }[detailKey];
    if (!property) return;
    const path = String(field).replace(new RegExp(`^${property}\\.`), "").split(".");
    replaceCompanies((rows) => rows.map((company) => {
      if (company.id !== companyId) return company;
      const next = structuredClone(company);
      let target = next[property] ||= {};
      path.slice(0, -1).forEach((part) => { target = target[part] ||= {}; });
      const last = path.at(-1);
      target[last] = transform(Array.isArray(target[last]) ? target[last] : []);
      return next;
    }));
  }, [replaceCompanies, replaceCompanyMeetings]);

  const uploadFiles = useCallback(async ({ companyId, detailKey, field, files }) => {
    const additions = Array.from(files || []).map((file) => ({
      id: `draft-file-${crypto.randomUUID()}`,
      originalName: file.name,
      name: file.name,
      mimeType: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      __draftFile: true,
    }));
    if (!additions.length) return;
    recordChange();
    pendingFileOperations.current.push({ type: "upload", companyId, detailKey, field, files: Array.from(files), draftIds: additions.map((file) => file.id) });
    changeFileList(companyId, detailKey, field, (current) => [...current, ...additions]);
  }, [changeFileList, recordChange]);

  const deleteFile = useCallback(async ({ companyId, detailKey, field, fileId }) => {
    recordChange();
    const matchingUpload = pendingFileOperations.current.findIndex((operation) => operation.type === "upload" && operation.companyId === companyId && operation.draftIds.includes(fileId));
    if (matchingUpload >= 0) {
      const [operation] = pendingFileOperations.current.splice(matchingUpload, 1);
      operation.files.forEach((file) => URL.revokeObjectURL(file.url));
    } else {
      pendingFileOperations.current.push({ type: "delete", companyId, detailKey, field, fileId });
    }
    changeFileList(companyId, detailKey, field, (current) => current.filter((file) => file.id !== fileId));
  }, [changeFileList, recordChange]);

  const createMeeting = useCallback(
    async (companyId, payload) => {
      recordChange();
      const meeting = { ...payload, id: `draft-meeting-${crypto.randomUUID()}`, documents: [] };
      pendingMeetingOperations.current.push({ type: "create", companyId, meeting });
      replaceCompanyMeetings(companyId, [...(meetingsRef.current[companyId] || []), meeting]);
      return meeting;
    },
    [recordChange, replaceCompanyMeetings],
  );

  const updateMeeting = useCallback(
    async (companyId, meetingId, payload) => {
      recordChange();
      pendingMeetingOperations.current.push({ type: "update", companyId, meetingId, payload });
      replaceCompanyMeetings(companyId, (meetingsRef.current[companyId] || []).map((meeting) =>
        meeting.id === meetingId ? { ...meeting, ...payload } : meeting,
      ));
      return payload;
    },
    [recordChange, replaceCompanyMeetings],
  );

  const deleteMeeting = useCallback(
    async (companyId, meetingId) => {
      recordChange();
      pendingMeetingOperations.current.push({ type: "delete", companyId, meetingId });
      replaceCompanyMeetings(companyId, (meetingsRef.current[companyId] || []).filter((meeting) => meeting.id !== meetingId));
    },
    [recordChange, replaceCompanyMeetings],
  );

  const recordEarlyBoardMeeting = useCallback(
    async (companyId, heldDate) => {
      recordChange();
      pendingMeetingOperations.current.push({ type: "recordEarly", companyId, heldDate });
      return null;
    },
    [recordChange],
  );

  const undoChanges = useCallback(() => {
    restoreSnapshot(changeTracker.undo());
  }, [changeTracker, restoreSnapshot]);

  const revertChanges = useCallback(() => {
    restoreSnapshot(changeTracker.revert());
  }, [changeTracker, restoreSnapshot]);

  const saveChanges = useCallback(async () => {
    if (!changeTracker.changeCount || savingChanges) return;
    setError("");
    setSavingChanges(true);
    try {
      // Company fields are saved once per company, regardless of how many
      // individual keystrokes were made while editing.
      for (const companyId of pendingCompanyIds.current) {
        const company = companiesRef.current.find((item) => item.id === companyId);
        if (!company) continue;
        const { __fullLoaded, ...payload } = company;
        await repositoryApi.updateCompany(companyId, payload);
      }

      const draftMeetingIds = new Map();
      for (const operation of pendingMeetingOperations.current) {
        if (operation.type === "create") {
          const saved = await meetingApi.createMeeting(operation.companyId, operation.meeting);
          const meeting = saved?.data ?? saved;
          draftMeetingIds.set(operation.meeting.id, meeting.id);
        } else if (operation.type === "update") {
          const meetingId = draftMeetingIds.get(operation.meetingId) || operation.meetingId;
          if (!String(meetingId).startsWith("draft-meeting-"))
            await meetingApi.updateMeeting(operation.companyId, meetingId, operation.payload);
        } else if (operation.type === "delete") {
          const meetingId = draftMeetingIds.get(operation.meetingId) || operation.meetingId;
          if (!String(meetingId).startsWith("draft-meeting-"))
            await meetingApi.deleteMeeting(operation.companyId, meetingId);
        } else if (operation.type === "recordEarly") {
          await meetingApi.recordEarlyBoardMeeting(operation.companyId, operation.heldDate);
        }
      }

      for (const operation of pendingFileOperations.current) {
        const meetingMatch = String(operation.field).match(/^meeting\.([^.]*)\./);
        const field = meetingMatch && draftMeetingIds.has(meetingMatch[1])
          ? operation.field.replace(meetingMatch[1], draftMeetingIds.get(meetingMatch[1]))
          : operation.field;
        if (operation.type === "upload")
          await repositoryApi.uploadFiles({ ...operation, field });
        else
          await repositoryApi.deleteFile({ ...operation, field });
      }

      const companyIds = new Set([
        ...pendingCompanyIds.current,
        ...pendingMeetingOperations.current.map((operation) => operation.companyId),
        ...pendingFileOperations.current.map((operation) => operation.companyId),
      ]);
      await Promise.all([
        ...[...companyIds].map(async (companyId) => {
          const response = await repositoryApi.getCompany(companyId);
          replaceCompanies((current) => mergeCompanyIntoList(current, { ...(response?.data ?? response), __fullLoaded: true }));
          const meetings = await meetingApi.getCompanyMeetings(companyId);
          replaceCompanyMeetings(companyId, meetings?.data ?? meetings ?? []);
        }),
        refreshRepositoryMeta(),
        refreshMeetingOverview(),
      ]);
      pendingCompanyIds.current = new Set();
      pendingMeetingOperations.current = [];
      pendingFileOperations.current = [];
      changeTracker.clear();
    } catch (requestError) {
      setError(requestError.message || "Unable to save changes. Your unsaved changes are still available.");
    } finally {
      setSavingChanges(false);
    }
  }, [changeTracker, refreshMeetingOverview, refreshRepositoryMeta, replaceCompanies, replaceCompanyMeetings, savingChanges]);

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
    changeCount: changeTracker.changeCount,
    savingChanges,
    saveChanges,
    undoChanges,
    revertChanges,
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
    refreshRepositoryMeta,
  };
}
