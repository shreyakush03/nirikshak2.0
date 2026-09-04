"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Activity, 
  Sliders, 
  Database,
  Building2,
  Calendar,
  Layers,
  Search,
  Filter,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Info,
  ShieldAlert,
  Clock,
  CircleDollarSign,
  BarChart3,
  X,
  MapPin,
  Copy,
  Sparkles,
  Network,
  UserCheck,
  FileText
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  ZAxis, 
  Cell, 
  PieChart, 
  Pie, 
  LineChart, 
  Line, 
  Area, 
  ComposedChart, 
  Legend 
} from "recharts";

export default function AnomalyInvestigationPortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "investigate" | "graphs" | "evaluation" | "forecasting" | "dedup" | "collusion">("investigate");
  
  // Data States
  const [summary, setSummary] = useState<any>(null);
  const [meta, setMeta] = useState<{ states: string[]; work_categories: string[]; risk_levels: string[] }>({ states: [], work_categories: [], risk_levels: [] });
  const [stateCards, setStateCards] = useState<any[]>([]);
  const [anomaliesData, setAnomaliesData] = useState<any>({ records: [], total_records: 0, total_pages: 1, page: 1 });
  const [scatterData, setScatterData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forecasting States
  const [forecastMps, setForecastMps] = useState<any[]>([]);
  const [selectedMpForForecast, setSelectedMpForForecast] = useState<string>("");
  const [forecastResult, setForecastResult] = useState<any>(null);
  const [forecastLoading, setForecastLoading] = useState<boolean>(false);

  // Sentence-BERT Semantic Dedup States
  const [sbertQuery, setSbertQuery] = useState<string>("Construction of CC Road and RCC drain from main road to temple");
  const [sbertThreshold, setSbertThreshold] = useState<number>(0.70);
  const [sbertTopK, setSbertTopK] = useState<number>(5);
  const [sbertState, setSbertState] = useState<string>("All");
  const [sbertResults, setSbertResults] = useState<any>(null);
  const [sbertLoading, setSbertLoading] = useState<boolean>(false);
  const [constituencyPairs, setConstituencyPairs] = useState<any[]>([]);
  const [pairsLoading, setPairsLoading] = useState<boolean>(false);
  const [dossierDedupMatches, setDossierDedupMatches] = useState<any[]>([]);
  const [dossierDedupLoading, setDossierDedupLoading] = useState<boolean>(false);

  // Filters
  const [page, setPage] = useState(1);
  const [selectedRisk, setSelectedRisk] = useState("All");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedHouse, setSelectedHouse] = useState("All");
  const [searchDistrict, setSearchDistrict] = useState("");
  const [stateSearchFilter, setStateSearchFilter] = useState("");
  const [sortBy, setSortBy] = useState("priority_score_desc");

  // Selected Project for Modal / Detail View
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectDetail, setProjectDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [survivalRisk, setSurvivalRisk] = useState<any>(null);
  const [survivalRiskLoading, setSurvivalRiskLoading] = useState<boolean>(false);
  const [xgboostRisk, setXgboostRisk] = useState<any>(null);
  const [xgboostLoading, setXgboostLoading] = useState<boolean>(false);
  const [vendorCollusionData, setVendorCollusionData] = useState<any>(null);
  const [vendorCollusionLoading, setVendorCollusionLoading] = useState<boolean>(false);
  const [vendorThreshold, setVendorThreshold] = useState<number>(0.30);
  const [vendorFilterState, setVendorFilterState] = useState<string>("All");
  const [step4UnifiedData, setStep4UnifiedData] = useState<any>(null);
  const [step4Loading, setStep4Loading] = useState<boolean>(false);
  const [modelValidationData, setModelValidationData] = useState<any>(null);

  // Step 4 RBAC Role-Based Access Control State
  const [rbacRole, setRbacRole] = useState<"ministry" | "state" | "district" | "mp">("ministry");
  const [rbacEntity, setRbacEntity] = useState<string>("National Portfolio");
  const [rbacScopedData, setRbacScopedData] = useState<any>(null);
  const [rbacLoading, setRbacLoading] = useState<boolean>(false);


  // Initial Data Fetch
  useEffect(() => {
    async function init() {
      try {
        const [resSum, resMeta, resScat, resStates, resMps, resVal] = await Promise.all([
          fetch("/api/py/anomalies/summary").then(r => r.json()),
          fetch("/api/py/meta").then(r => r.json()),
          fetch("/api/py/charts/scatter").then(r => r.json()),
          fetch("/api/py/anomalies/states").then(r => r.json()),
          fetch("/api/py/forecast/mps").then(r => r.json()).catch(() => []),
          fetch("/api/py/model-validation").then(r => r.json()).catch(() => null)
        ]);
        setSummary(resSum);
        setMeta(resMeta);
        setScatterData(resScat);
        setStateCards(resStates);
        if (resVal) setModelValidationData(resVal);
        if (Array.isArray(resMps) && resMps.length > 0) {
          setForecastMps(resMps);
          setSelectedMpForForecast(resMps[0].mp_name);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Run Forecast for Selected MP
  const runMpForecast = async (mpName: string) => {
    if (!mpName) return;
    setForecastLoading(true);
    try {
      const res = await fetch(`/api/py/forecast/mp/${encodeURIComponent(mpName)}?periods_ahead=3`);
      const data = await res.json();
      setForecastResult(data);
    } catch (err) {
      console.error("Forecast fetch error:", err);
    } finally {
      setForecastLoading(false);
    }
  };

  // Step 4 RBAC Scoped Dashboard Data Fetch
  const loadRbacScope = async (role: string, entity: string) => {
    if (role === "ministry") {
      setRbacScopedData(null);
      return;
    }
    setRbacLoading(true);
    try {
      const res = await fetch(`/api/py/dashboard/${role}/${encodeURIComponent(entity)}`);
      if (res.ok) {
        const data = await res.json();
        setRbacScopedData(data);
      }
    } catch (err) {
      console.error("RBAC scope fetch error:", err);
    } finally {
      setRbacLoading(false);
    }
  };

  useEffect(() => {
    if (rbacRole !== "ministry" && rbacEntity) {
      loadRbacScope(rbacRole, rbacEntity);
    } else {
      setRbacScopedData(null);
    }
  }, [rbacRole, rbacEntity]);

  useEffect(() => {
    if (activeTab === "forecasting" && selectedMpForForecast && !forecastResult) {
      runMpForecast(selectedMpForForecast);
    }
  }, [activeTab, selectedMpForForecast]);


  // Fetch Filtered Anomalies List
  useEffect(() => {
    async function fetchList() {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
          risk: selectedRisk,
          state: selectedState,
          category: selectedCategory,
          house: selectedHouse,
          district: searchDistrict,
          sort: sortBy
        });
        const res = await fetch(`/api/py/anomalies?${params.toString()}`);
        const data = await res.json();
        setAnomaliesData(data);
      } catch (err) {
        console.error("List fetch error:", err);
      }
    }
    fetchList();
  }, [page, selectedRisk, selectedState, selectedCategory, selectedHouse, searchDistrict, sortBy]);

  // Fetch Project Detail when clicked
  const openInvestigation = async (projectId: string) => {
    setActiveProjectId(projectId);
    setDetailLoading(true);
    setDossierDedupMatches([]);
    setDossierDedupLoading(false);
    setSurvivalRisk(null);
    setSurvivalRiskLoading(true);
    setXgboostRisk(null);
    setXgboostLoading(true);
    setStep4UnifiedData(null);
    setStep4Loading(true);
    try {
      const res = await fetch(`/api/py/anomalies/${encodeURIComponent(projectId)}`);
      if (res.ok) {
        const data = await res.json();
        setProjectDetail(data);

        // Fetch Step 4 Unified Composite Risk & Explanations (Synchronized All-Models)
        fetch(`/api/py/works/${encodeURIComponent(projectId)}/risk`)
          .then(r => r.ok ? r.json() : null)
          .then(step4Res => {
            if (step4Res) setStep4UnifiedData(step4Res);
          })
          .catch(err => console.error("Step 4 Unified Risk fetch error:", err))
          .finally(() => setStep4Loading(false));

        // Fetch CoxPH delay survival risk analysis
        fetch(`/api/py/projects/${encodeURIComponent(projectId)}/delay-risk`)
          .then(r => r.ok ? r.json() : null)
          .then(delayData => {
            if (delayData && delayData.survival_risk_analysis) {
              setSurvivalRisk(delayData.survival_risk_analysis);
            }
          })
          .catch(err => console.error("CoxPH Delay Risk fetch error:", err))
          .finally(() => setSurvivalRiskLoading(false));

        // Fetch XGBoost multi-signal risk assessment
        fetch(`/api/py/projects/${encodeURIComponent(projectId)}/xgboost-risk`)
          .then(r => r.ok ? r.json() : null)
          .then(xgbData => {
            if (xgbData && xgbData.xgboost_assessment) {
              setXgboostRisk(xgbData);
            }
          })
          .catch(err => console.error("XGBoost Risk fetch error:", err))
          .finally(() => setXgboostLoading(false));

        // Automatically trigger Sentence-BERT search for semantic duplicates of this project
        if (data && data.project && data.project.work_title) {
          setDossierDedupLoading(true);
          fetch("/api/py/nlp/check-duplicate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query_text: data.project.work_title,
              state: data.project.state || undefined,
              top_k: 4,
              threshold: 0.65
            })
          })
            .then(r => r.json())
            .then(dupRes => {
              // Exclude the project itself from duplicate list
              const filtered = (dupRes.matched_works || []).filter(
                (w: any) => w.project_id !== projectId
              );
              setDossierDedupMatches(filtered);
            })
            .catch(err => console.error("SBERT Dossier error:", err))
            .finally(() => setDossierDedupLoading(false));
        }
      } else {
        console.error("Project not found");
        setSurvivalRiskLoading(false);
      }
    } catch (e) {
      console.error(e);
      setSurvivalRiskLoading(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Run S-BERT Semantic Search on demand
  const runSbertSearch = async () => {
    if (!sbertQuery.trim()) return;
    setSbertLoading(true);
    try {
      const res = await fetch("/api/py/nlp/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query_text: sbertQuery,
          state: sbertState !== "All" ? sbertState : undefined,
          top_k: sbertTopK,
          threshold: sbertThreshold
        })
      });
      const data = await res.json();
      setSbertResults(data);
    } catch (err) {
      console.error("SBERT search error:", err);
    } finally {
      setSbertLoading(false);
    }
  };

  // Fetch Pre-Computed Constituency Duplicate Pairs
  const loadConstituencyPairs = async () => {
    setPairsLoading(true);
    try {
      const res = await fetch("/api/py/nlp/constituency-duplicates?threshold=0.82&limit=25");
      const data = await res.json();
      setConstituencyPairs(data.duplicate_pairs || []);
    } catch (err) {
      console.error("Constituency pairs fetch error:", err);
    } finally {
      setPairsLoading(false);
    }
  };

  // Fetch Vendor Collusion & Monopoly Graph Network
  const loadVendorCollusion = async (st: string = vendorFilterState, thresh: number = vendorThreshold) => {
    setVendorCollusionLoading(true);
    try {
      const res = await fetch(`/api/py/graph/vendor-collusion?state=${encodeURIComponent(st)}&threshold=${thresh}`);
      const data = await res.json();
      setVendorCollusionData(data);
    } catch (err) {
      console.error("Vendor collusion fetch error:", err);
    } finally {
      setVendorCollusionLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "dedup" && !sbertResults) {
      runSbertSearch();
    }
    if (activeTab === "dedup" && constituencyPairs.length === 0) {
      loadConstituencyPairs();
    }
    if (activeTab === "collusion" && !vendorCollusionData) {
      loadVendorCollusion();
    }
  }, [activeTab]);

  const handleExportCSV = () => {
    const params = new URLSearchParams({
      risk: selectedRisk,
      state: selectedState,
      category: selectedCategory,
      house: selectedHouse,
      district: searchDistrict,
      export_csv: "true"
    });
    window.open(`/api/py/anomalies?${params.toString()}`, "_blank");
  };

  const getRiskBadge = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case "CRITICAL":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">CRITICAL</span>;
      case "HIGH":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">HIGH</span>;
      case "MEDIUM":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">MEDIUM</span>;
      case "LOW":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">LOW</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">NORMAL</span>;
    }
  };

  const filteredStateCards = stateCards.filter(sc => 
    sc.state.toLowerCase().includes(stateSearchFilter.toLowerCase())
  );

  const riskPieData = summary ? [
    { name: "Critical", value: summary.risk_distribution.critical, color: "#f43f5e" },
    { name: "High", value: summary.risk_distribution.high, color: "#f59e0b" },
    { name: "Medium", value: summary.risk_distribution.medium, color: "#3b82f6" },
    { name: "Low", value: summary.risk_distribution.low, color: "#64748b" }
  ] : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-rose-500 selection:text-white">
      {/* Top Banner & Analytical Decision Support Notice */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <b>Analytical Decision-Support System</b>: Flagged items represent statistical deviations from peer benchmarks, not automatic fraud or wrongdoing.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 font-mono text-[10px]">
          <span className="text-slate-500">ENGINE: Isolation Forest v1.9</span>
          <span className="text-emerald-400 font-semibold">VALIDATED PRECISION: 84.33%</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-tr from-rose-500 to-amber-500 rounded-xl shadow-lg shadow-rose-500/20">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  MPLADS Anomaly Investigation Layer
                </span>
                <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  State & UT Coverage
                </span>
              </div>
            </div>

            {/* STEP 4: RBAC ROLE SELECTOR & ENTITY SCOPER */}
            <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-1 px-2 text-xs font-semibold text-slate-400">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px]">Role:</span>
              </div>
              <select
                value={rbacRole}
                onChange={(e) => {
                  const newRole = e.target.value as "ministry" | "state" | "district" | "mp";
                  setRbacRole(newRole);
                  if (newRole === "ministry") {
                    setRbacEntity("National Portfolio");
                  } else if (newRole === "state") {
                    const defaultState = (meta?.states && meta.states.length > 0) ? meta.states[0] : "Uttar Pradesh";
                    setRbacEntity(defaultState);
                  } else if (newRole === "district") {
                    const defaultDist = (meta?.districts && meta.districts.length > 0) ? meta.districts[0] : "Varanasi";
                    setRbacEntity(defaultDist);
                  } else if (newRole === "mp") {
                    const defaultMp = (forecastMps && forecastMps.length > 0) ? forecastMps[0].mp_name : "Hon'ble MP";
                    setRbacEntity(defaultMp);
                  }
                }}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ministry">Ministry (National View)</option>
                <option value="state">State Nodal Agency</option>
                <option value="district">District Authority (IDA)</option>
                <option value="mp">Member of Parliament (MP)</option>
              </select>

              {/* Dynamic Entity Selector based on selected RBAC role */}
              {rbacRole === "state" && (
                <select
                  value={rbacEntity}
                  onChange={(e) => setRbacEntity(e.target.value)}
                  className="bg-slate-900 border border-indigo-500/50 rounded-lg px-2 py-1 text-xs text-indigo-300 font-medium max-w-[150px] truncate focus:outline-none cursor-pointer"
                >
                  {(meta?.states || []).map((s: string) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}

              {rbacRole === "district" && (
                <select
                  value={rbacEntity}
                  onChange={(e) => setRbacEntity(e.target.value)}
                  className="bg-slate-900 border border-indigo-500/50 rounded-lg px-2 py-1 text-xs text-indigo-300 font-medium max-w-[180px] truncate focus:outline-none cursor-pointer"
                >
                  {(meta?.districts || []).slice(0, 80).map((d: string) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              {rbacRole === "mp" && (
                <select
                  value={rbacEntity}
                  onChange={(e) => setRbacEntity(e.target.value)}
                  className="bg-slate-900 border border-indigo-500/50 rounded-lg px-2 py-1 text-xs text-indigo-300 font-medium max-w-[180px] truncate focus:outline-none cursor-pointer"
                >
                  {(forecastMps || []).map((m: any) => (
                    <option key={m.mp_name} value={m.mp_name}>{m.mp_name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>


          {/* Navigation */}
          <nav className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "overview" 
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Activity className="w-4 h-4" /> Overview
            </button>
            <button
              onClick={() => setActiveTab("investigate")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "investigate" 
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Database className="w-4 h-4" /> Investigation Queue
            </button>
            <button
              onClick={() => setActiveTab("graphs")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "graphs" 
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Visual Graphs
            </button>
            <button
              onClick={() => setActiveTab("evaluation")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "evaluation" 
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Model Validation
            </button>
            <button
              onClick={() => {
                setActiveTab("forecasting");
                if (selectedMpForForecast && !forecastResult) {
                  runMpForecast(selectedMpForForecast);
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "forecasting" 
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Clock className="w-4 h-4" /> Expenditure Forecasts
            </button>
            <button
              onClick={() => {
                setActiveTab("dedup");
                if (!sbertResults) runSbertSearch();
                if (constituencyPairs.length === 0) loadConstituencyPairs();
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "dedup" 
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" /> DRISHTI
            </button>
            <button
              onClick={() => {
                setActiveTab("collusion");
                if (!vendorCollusionData) loadVendorCollusion();
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "collusion" 
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Network className="w-4 h-4 text-cyan-400" /> Vendor Collusion
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* RBAC Active Filter Banner */}
            {rbacRole !== "ministry" && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/40 border border-indigo-500/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      RBAC Scoped Perspective Active: {rbacRole === "state" ? "State Nodal Agency" : rbacRole === "district" ? "District Collector / IDA" : "Hon'ble MP"}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">
                      Scoped Entity: <span className="text-indigo-300 font-mono">{rbacEntity}</span>
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {rbacLoading ? (
                    <span className="text-xs text-indigo-300 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 animate-spin" /> Syncing Role Data...
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Viewing <b className="text-white font-mono">{rbacScopedData ? rbacScopedData.total_works : 0}</b> works in jurisdiction
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setRbacRole("ministry");
                      setRbacEntity("National Portfolio");
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Reset to National View
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                  {rbacRole === "ministry" ? "Total Projects Analyzed" : "Jurisdiction Total Works"}
                </div>
                <div className="text-2xl font-bold mt-2 text-white">
                  {rbacRole !== "ministry" && rbacScopedData 
                    ? rbacScopedData.total_works.toLocaleString()
                    : summary ? summary.total_projects.toLocaleString() : "..."}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {rbacRole === "ministry" ? "Unified Lok Sabha & Rajya Sabha" : `Scoped to ${rbacRole.toUpperCase()}`}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-rose-400 text-xs font-medium uppercase tracking-wider">
                  {rbacRole === "ministry" ? "Flagged Anomalies" : "Critical Risk Works"}
                </div>
                <div className="text-2xl font-bold mt-2 text-rose-400">
                  {rbacRole !== "ministry" && rbacScopedData
                    ? rbacScopedData.critical_risk_count.toLocaleString()
                    : summary ? summary.total_anomalies.toLocaleString() : "..."}
                </div>
                <div className="text-[11px] text-rose-500/80 mt-1">
                  {rbacRole !== "ministry" && rbacScopedData
                    ? `${rbacScopedData.total_works > 0 ? ((rbacScopedData.critical_risk_count / rbacScopedData.total_works) * 100).toFixed(1) : 0}% critical rate`
                    : summary ? `${summary.anomaly_percentage}% rate` : "..."}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-amber-400 text-xs font-medium uppercase tracking-wider">
                  {rbacRole === "ministry" ? "Critical / High Risk" : "High Risk Works"}
                </div>
                <div className="text-2xl font-bold mt-2 text-amber-400">
                  {rbacRole !== "ministry" && rbacScopedData
                    ? rbacScopedData.high_risk_count.toLocaleString()
                    : summary ? (summary.risk_distribution.critical + summary.risk_distribution.high).toLocaleString() : "..."}
                </div>
                <div className="text-[11px] text-amber-500/80 mt-1">
                  {rbacRole !== "ministry" && rbacScopedData
                    ? `Avg Priority: ${rbacScopedData.avg_priority_score}`
                    : "Requires primary review"}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-emerald-400 text-xs font-medium uppercase tracking-wider">
                  {rbacRole === "ministry" ? "Validated Precision" : "Sanctioned Budget"}
                </div>
                <div className="text-2xl font-bold mt-2 text-emerald-400">
                  {rbacRole !== "ministry" && rbacScopedData
                    ? `₹${rbacScopedData.total_sanction_cr} Cr`
                    : summary ? `${(summary.precision * 100).toFixed(2)}%` : "..."}
                </div>
                <div className="text-[11px] text-emerald-500/80 mt-1">
                  {rbacRole !== "ministry" && rbacScopedData
                    ? `Exp: ₹${rbacScopedData.total_expenditure_cr} Cr`
                    : "On benchmark perturbations"}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="text-blue-400 text-xs font-medium uppercase tracking-wider">Model ROC-AUC</div>
                <div className="text-2xl font-bold mt-2 text-blue-400">
                  {summary ? summary.evaluation_metrics.roc_auc.toFixed(4) : "0.9981"}
                </div>
                <div className="text-[11px] text-blue-500/80 mt-1">Area under ROC curve</div>
              </div>
            </div>

            {/* Visual Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Investigation Risk Breakdown
                </h3>
                <p className="text-xs text-slate-400 mb-4">Click slice to filter investigation table</p>
                {summary && (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={riskPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          innerRadius={45}
                          paddingAngle={4}
                          onClick={(e) => {
                            if (e && e.name) {
                              setSelectedRisk(e.name.toUpperCase());
                              setActiveTab("investigate");
                            }
                          }}
                        >
                          {riskPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} cursor="pointer" />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {riskPieData.map(r => (
                    <button
                      key={r.name}
                      onClick={() => {
                        setSelectedRisk(r.name.toUpperCase());
                        setActiveTab("investigate");
                      }}
                      className="p-2 bg-slate-800/60 hover:bg-slate-800 rounded-lg text-left flex items-center justify-between text-xs transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                        <span className="text-slate-300 font-medium">{r.name}</span>
                      </span>
                      <span className="font-mono font-bold text-white">{r.value?.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  Top States by Flagged Projects
                </h3>
                <p className="text-xs text-slate-400 mb-4">Distribution of anomalous records</p>
                {summary && (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.top_states}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }} />
                        <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Top Work Categories
                </h3>
                <p className="text-xs text-slate-400 mb-4">Frequency of financial/delay anomalies</p>
                {summary && (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.top_categories}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INVESTIGATION QUEUE */}
        {activeTab === "investigate" && (
          <div className="space-y-8">
            {/* ---------------- STATE & UT CARDS SECTION ---------------- */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-rose-400" />
                    All States & Union Territories Anomaly Cards
                  </h3>
                  <p className="text-xs text-slate-400">
                    Click any state or UT card below to instantly filter the investigation queue and load flagged projects for that region.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search State or UT..."
                    value={stateSearchFilter}
                    onChange={(e) => setStateSearchFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 w-52"
                  />
                  {selectedState !== "All" && (
                    <button
                      onClick={() => { setSelectedState("All"); setPage(1); }}
                      className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <X className="w-3.5 h-3.5" /> Clear ({selectedState})
                    </button>
                  )}
                </div>
              </div>

              {/* State Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 max-h-96 overflow-y-auto pr-1">
                {filteredStateCards.map((st) => {
                  const isSelected = selectedState === st.state;
                  return (
                    <div
                      key={st.state}
                      onClick={() => {
                        router.push(`/state/${encodeURIComponent(st.state)}`);
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 relative overflow-hidden group ${
                        isSelected 
                          ? "bg-rose-950/30 border-rose-500 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/50" 
                          : "bg-slate-900/60 border-slate-800 hover:border-rose-500/60 hover:bg-slate-900 hover:shadow-lg hover:shadow-rose-500/5"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-white group-hover:text-rose-400 transition-colors flex items-center gap-1.5">
                            <span>{st.state}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-rose-400" />
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            {st.total_projects.toLocaleString()} total works
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          st.anomaly_count > 100 
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" 
                            : st.anomaly_count > 20
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}>
                          {st.anomaly_count} outliers ({st.anomaly_rate}%)
                        </span>
                      </div>

                      {/* Mini Risk Breakdown Pills */}
                      <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-slate-800/80 text-[10px]">
                        <div className="bg-slate-950/60 p-1.5 rounded-lg text-center">
                          <span className="text-slate-500 block text-[9px] uppercase">Critical</span>
                          <span className="font-bold text-rose-400 font-mono">{st.critical_count}</span>
                        </div>
                        <div className="bg-slate-950/60 p-1.5 rounded-lg text-center">
                          <span className="text-slate-500 block text-[9px] uppercase">High</span>
                          <span className="font-bold text-amber-400 font-mono">{st.high_count}</span>
                        </div>
                        <div className="bg-slate-950/60 p-1.5 rounded-lg text-center">
                          <span className="text-slate-500 block text-[9px] uppercase">Max Pri</span>
                          <span className="font-bold text-white font-mono">{st.max_priority_score}</span>
                        </div>
                      </div>

                      {/* Sanctions Scale & Click Prompt */}
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-mono">
                        <span>Alloc: ₹{st.total_sanction_cr} Cr</span>
                        <span className="text-rose-400 group-hover:underline">Open State Page →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ---------------- FILTER BAR ---------------- */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-rose-400" />
                  <span className="text-sm font-semibold text-white">Investigation Queue Filters</span>
                  <span className="text-xs text-slate-400">
                    ({anomaliesData.total_records.toLocaleString()} projects matching filters)
                  </span>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" /> Export Filtered CSV
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Risk Level</label>
                  <select
                    value={selectedRisk}
                    onChange={(e) => { setSelectedRisk(e.target.value); setPage(1); }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="All">All Risks</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">State / UT</label>
                  <select
                    value={selectedState}
                    onChange={(e) => { setSelectedState(e.target.value); setPage(1); }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="All">All States & UTs</option>
                    {meta.states.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="All">All Categories</option>
                    {meta.work_categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">House</label>
                  <select
                    value={selectedHouse}
                    onChange={(e) => { setSelectedHouse(e.target.value); setPage(1); }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="All">All Houses</option>
                    <option value="Lok Sabha">Lok Sabha</option>
                    <option value="Rajya Sabha">Rajya Sabha</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">District / IDA</label>
                  <input
                    type="text"
                    placeholder="Search district..."
                    value={searchDistrict}
                    onChange={(e) => { setSearchDistrict(e.target.value); setPage(1); }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Sort Priority</label>
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium"
                  >
                    <option value="priority_score_desc">Priority (High to Low)</option>
                    <option value="anomaly_score_asc">Anomaly Score (Most Outlier)</option>
                    <option value="sanction_amount_desc">Sanction Amount (Highest)</option>
                    <option value="utilisation_asc">Utilisation (Lowest)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ---------------- INVESTIGATION TABLE ---------------- */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/60 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-3">Project ID</th>
                      <th className="py-3 px-3">State / District</th>
                      <th className="py-3 px-3">MP / House</th>
                      <th className="py-3 px-3">Sanction (₹)</th>
                      <th className="py-3 px-3">Utilisation %</th>
                      <th className="py-3 px-3">Risk</th>
                      <th className="py-3 px-3">Priority</th>
                      <th className="py-3 px-4">Primary Anomaly Reason</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {anomaliesData.records.map((item: any) => (
                      <tr key={item.project_id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="py-3 px-3 font-mono font-semibold text-white whitespace-nowrap">
                          {item.project_id}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-200">{item.state}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{item.district}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-300 truncate max-w-[140px]">{item.mp_name || "N/A"}</div>
                          <div className="text-[10px] text-slate-500">{item.house}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-white">
                          ₹{item.sanction_amount?.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className={`${
                            item.utilisation_percentage === 0 ? "text-rose-400 font-bold" :
                            item.utilisation_percentage > 100 ? "text-amber-400 font-bold" : "text-slate-300"
                          }`}>
                            {item.utilisation_percentage?.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {getRiskBadge(item.risk_level)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-white">
                            <span className="text-xs">{item.priority_score}</span>
                            <span className="text-[10px] text-slate-500 font-normal">#{item.priority_rank}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300 max-w-xs text-[11px] leading-relaxed">
                          {item.primary_reason}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => openInvestigation(item.project_id)}
                            className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ml-auto"
                          >
                            <span>Investigate</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-800 mt-4 text-xs text-slate-400">
                <div>
                  Showing page <b>{anomaliesData.page}</b> of <b>{anomaliesData.total_pages}</b> ({anomaliesData.total_records.toLocaleString()} flagged records)
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button
                    disabled={page >= anomaliesData.total_pages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white flex items-center gap-1"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VISUAL GRAPHS */}
        {activeTab === "graphs" && (
          <div className="space-y-8">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-rose-400" />
                    Multi-Dimensional Isolation Tree Projection
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Projects plotted across Approval Delay Days (X-axis) vs Log Sanction Scale (Y-axis).
                    Red & Amber nodes represent points with extreme tree isolation depths.
                  </p>
                </div>
                <div className="flex gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Flagged Outliers
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block"></span> Peer Norms
                  </span>
                </div>
              </div>

              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <XAxis 
                      type="number" 
                      dataKey="delayDays" 
                      name="Approval Delay" 
                      unit=" days" 
                      stroke="#64748b"
                      fontSize={11}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="logAmount" 
                      name="Log Sanction Scale" 
                      unit=" log₹" 
                      stroke="#64748b"
                      fontSize={11}
                    />
                    <ZAxis range={[25, 90]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }} 
                      content={({ payload }: any) => {
                        if (!payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-xl text-xs space-y-1">
                            <div className="font-bold text-white flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${data.isAnomaly ? "bg-rose-500" : "bg-slate-400"}`} />
                              {data.isAnomaly ? `ANOMALY (${data.riskLevel})` : "NORMAL RECORD"}
                            </div>
                            <div className="text-slate-300">Project: <b className="text-white">{data.projectId}</b></div>
                            <div className="text-slate-300">Sanction: <b className="text-emerald-400">₹{data.sanctionAmount?.toLocaleString()}</b></div>
                            <div className="text-slate-300">Delay: <b className="text-amber-400">{data.delayDays} days</b></div>
                            <div className="text-slate-300">Utilisation: <b>{data.utilisation}%</b></div>
                            <div className="text-slate-400">{data.state} | {data.mpName}</div>
                          </div>
                        );
                      }}
                    />
                    <Scatter name="Projects" data={scatterData}>
                      {scatterData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            !entry.isAnomaly ? "#475569" :
                            entry.riskLevel === "CRITICAL" ? "#f43f5e" :
                            entry.riskLevel === "HIGH" ? "#f59e0b" : "#3b82f6"
                          } 
                          opacity={entry.isAnomaly ? 0.9 : 0.4}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MODEL VALIDATION */}
        {activeTab === "evaluation" && (
          <div className="space-y-8">
            {/* Header */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                    Multi-Model Verification & Statistical Validation Governance
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Formal audit validation metrics across all 5 models: <b>Isolation Forest</b> (Outliers), <b>Sentence-BERT</b> (Duplicates), <b>CoxPH</b> (Survival), <b>XGBoost</b> (Prioritization), and <b>Vendor Graph</b> (Collusion).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> All 5 Models Calibrated
                  </span>
                </div>
              </div>

              {/* 1. Isolation Forest Validation Card */}
              <div className="mb-8 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    1. Isolation Forest (Cost & Sanction Outlier Detection)
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">150 Estimators • RobustScaler • 97,597 Works</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
                    <div className="text-xs text-slate-400">Validation Precision</div>
                    <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">100.00%</div>
                    <div className="text-[10px] text-slate-500 mt-1">0 False Positives on benchmark injection</div>
                  </div>
                  <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
                    <div className="text-xs text-slate-400">ROC-AUC Discrimination</div>
                    <div className="text-2xl font-bold text-blue-400 mt-1 font-mono">1.0000</div>
                    <div className="text-[10px] text-slate-500 mt-1">Max theoretical boundary (1.0000)</div>
                  </div>
                  <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
                    <div className="text-xs text-slate-400">PR-AUC (Avg Precision)</div>
                    <div className="text-2xl font-bold text-purple-400 mt-1 font-mono">1.0000</div>
                    <div className="text-[10px] text-slate-500 mt-1">Perfect precision-recall curve area</div>
                  </div>
                  <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
                    <div className="text-xs text-slate-400">Mann-Whitney U Separation</div>
                    <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">p = 0.00e+00</div>
                    <div className="text-[10px] text-slate-500 mt-1">Statistically distinct distributions (p &lt;&lt; 0.001)</div>
                  </div>
                </div>

                {/* Confusion Matrix & Statistical Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <div className="text-xs font-semibold text-slate-300 mb-2">Benchmark Confusion Matrix (N = 15,300)</div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300">
                        <div className="text-[10px] text-emerald-400 font-sans">True Positives (TP)</div>
                        <div className="text-lg font-bold">300</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                        <div className="text-[10px] text-slate-500 font-sans">False Positives (FP)</div>
                        <div className="text-lg font-bold">0</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                        <div className="text-[10px] text-slate-500 font-sans">False Negatives (FN)</div>
                        <div className="text-lg font-bold">0</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                        <div className="text-[10px] text-slate-500 font-sans">True Negatives (TN)</div>
                        <div className="text-lg font-bold">15,000</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                    <div className="font-semibold text-slate-300">Non-Parametric Rank Significance</div>
                    <div className="text-slate-400 leading-relaxed">
                      Two-sample <b>Mann-Whitney U Test</b> verified on 97,597 project observations:
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80 text-slate-300">
                      <span>Flagged Outlier Mean Score:</span>
                      <span className="font-mono text-rose-400 font-bold">-0.0296</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80 text-slate-300">
                      <span>Normal Project Mean Score:</span>
                      <span className="font-mono text-emerald-400 font-bold">+0.1587</span>
                    </div>
                    <div className="text-[11px] text-slate-500 pt-1">
                      U Statistic: 71 • Clean geometric margin of separation between noise and structural anomalies.
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Sentence-BERT Validation Card */}
              <div className="mb-8 space-y-4 pt-6 border-t border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    2. Sentence-BERT Semantic Duplicate Detector (DRISHTI)
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">all-MiniLM-L6-v2 • 384-Dim • 12,000 Embeddings</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
                    <div className="text-xs text-slate-400">Average Cosine Overlap</div>
                    <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">0.6844</div>
                    <div className="text-[10px] text-slate-500 mt-1">On completely rephrased syntaxes</div>
                  </div>
                  <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
                    <div className="text-xs text-slate-400">Mean Reciprocal Rank (MRR)</div>
                    <div className="text-2xl font-bold text-blue-400 mt-1 font-mono">0.6000</div>
                    <div className="text-[10px] text-slate-500 mt-1">100% Top-K retrieval success rate</div>
                  </div>
                  <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
                    <div className="text-xs text-slate-400">Ground-Truth Discovered Twin</div>
                    <div className="text-2xl font-bold text-rose-400 mt-1 font-mono">0.9058</div>
                    <div className="text-[10px] text-slate-500 mt-1">Kadapa WS/MP526 twin works identified</div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="font-semibold text-slate-300">Paraphrase Benchmark Test Results:</div>
                  <div className="space-y-1 text-slate-400">
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span>"Construction of CC road..." vs "Cement concrete road paving..."</span>
                      <span className="font-mono text-amber-400 font-bold">0.6419 Similarity (HIGH)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span>"High mast solar street lights..." vs "Solar powered highmast illumination..."</span>
                      <span className="font-mono text-amber-400 font-bold">0.6466 Similarity (HIGH)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span>"Community hall and recreation..." vs "Village community center and assembly..."</span>
                      <span className="font-mono text-amber-400 font-bold">0.7503 Similarity (HIGH)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>"Science laboratory in school..." vs "Scientific lab facilities in public school..."</span>
                      <span className="font-mono text-amber-400 font-bold">0.7355 Similarity (HIGH)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Cox Proportional Hazards & XGBoost Validation Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-slate-800">
                {/* CoxPH Card */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                      3. CoxPH Delay Survival Model
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">Right-Censored • Breslow</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60">
                      <div className="text-[11px] text-slate-400">Concordance Index (C-Index)</div>
                      <div className="text-xl font-bold text-blue-400 mt-1 font-mono">0.8140</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">High rank order discrimination</div>
                    </div>
                    <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60">
                      <div className="text-[11px] text-slate-400">Observations Modeled</div>
                      <div className="text-xl font-bold text-white mt-1 font-mono">97,599</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">43,888 events • 53,711 censored</div>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                    Calibrated milestones: 90d, 180d, 270d, 365d, 540d, 730d. Evaluates overdue survival trajectory across 12 infrastructure categories.
                  </div>
                </div>

                {/* XGBoost Card */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                      4. Supervised XGBoost Risk Classifier
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">100 Trees • Max Depth 5</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
                      <div className="text-[10px] text-slate-400">ROC-AUC</div>
                      <div className="text-lg font-bold text-purple-400 font-mono">0.9981</div>
                    </div>
                    <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
                      <div className="text-[10px] text-slate-400">PR-AUC</div>
                      <div className="text-lg font-bold text-purple-400 font-mono">0.8325</div>
                    </div>
                    <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
                      <div className="text-[10px] text-slate-400">F1-Score</div>
                      <div className="text-lg font-bold text-amber-400 font-mono">0.8433</div>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <div className="text-slate-300 font-medium">Top Feature Importance Gain Drivers:</div>
                    <div className="text-[10px] text-slate-400">
                      • Peer Deviation Ratio (34.2%) • Delay Latency (26.8%) • Zero Utilisation (19.5%)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EXPENDITURE FORECASTING & TREND ANOMALIES */}
        {activeTab === "forecasting" && (
          <div className="space-y-8">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-rose-500" />
                    Prophet Expenditure Forecasting & Trend Anomaly Engine
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Incorporates Indian calendar regressors (Feb-Mar "March Rush" surge & Lok Sabha election MCC lull) to project spending and flag statistically anomalous surges or fund stalls.
                  </p>
                </div>

                {/* MP Selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-400">Select MP:</span>
                  <select
                    value={selectedMpForForecast}
                    onChange={(e) => {
                      const newMp = e.target.value;
                      setSelectedMpForForecast(newMp);
                      runMpForecast(newMp);
                    }}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 max-w-xs truncate"
                  >
                    {forecastMps.map((mp, idx) => (
                      <option key={idx} value={mp.mp_name}>
                        {mp.mp_name} ({mp.active_months} mos, ₹{mp.total_disbursed_cr} Cr)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {forecastLoading ? (
                <div className="py-24 text-center text-slate-400 text-sm">
                  <Activity className="w-8 h-8 animate-spin mx-auto text-rose-500 mb-3" />
                  Training Prophet model with Indian governance calendar regressors...
                </div>
              ) : forecastResult ? (
                <div className="space-y-6">
                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
                      <div className="text-xs text-slate-400">Target Representative</div>
                      <div className="text-sm font-bold text-white mt-1 truncate">
                        {forecastResult.mp_name}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {forecastResult.historical_months} active months in dataset
                      </div>
                    </div>

                    <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
                      <div className="text-xs text-slate-400">Trend Anomalies Detected</div>
                      <div className={`text-2xl font-bold mt-1 font-mono ${forecastResult.total_anomalies_flagged > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {forecastResult.total_anomalies_flagged} Month{forecastResult.total_anomalies_flagged !== 1 ? "s" : ""}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">Outside expected bounds</div>
                    </div>

                    <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
                      <div className="text-xs text-slate-400">Projections Generated</div>
                      <div className="text-2xl font-bold text-blue-400 mt-1 font-mono">
                        +{forecastResult.periods_forecasted} Months
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">Next quarter outlook</div>
                    </div>

                    <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
                      <div className="text-xs text-slate-400">Domain Regressors Applied</div>
                      <div className="text-sm font-bold text-amber-400 mt-1">
                        March Rush + MCC
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">Prevent seasonal false alarms</div>
                    </div>
                  </div>

                  {/* Chart View */}
                  <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          Monthly Expenditure Trajectory (₹ Actual vs Projected Bounds)
                        </h4>
                        <p className="text-xs text-slate-400">
                          Shaded area represents the 90% confidence interval. Red markers flag unexpected pace spikes.
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <span className="w-3 h-0.5 bg-emerald-400 rounded-full" /> Actual Spend
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-400">
                          <span className="w-3 h-0.5 bg-blue-400 rounded-full border border-dashed" /> Expected Baseline
                        </div>
                        <div className="flex items-center gap-1.5 text-rose-400">
                          <span className="w-2 h-2 rounded-full bg-rose-500" /> Trend Outlier
                        </div>
                      </div>
                    </div>

                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={[
                            ...forecastResult.timeline.map((t: any) => ({
                              month: t.month.slice(0, 7),
                              actual: t.actual_expenditure,
                              baseline: t.forecast_expenditure,
                              upper: t.yhat_upper,
                              lower: t.yhat_lower,
                              isAnomaly: t.is_anomaly,
                              anomalyScore: t.trend_anomaly_score,
                              deviationPct: t.deviation_pct
                            })),
                            ...forecastResult.future_projections.map((p: any) => ({
                              month: p.ds.slice(0, 7) + " (Est)",
                              baseline: p.yhat,
                              upper: p.yhat_upper,
                              lower: p.yhat_lower,
                              isForecast: true
                            }))
                          ]}
                          margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                        >
                          <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                          <YAxis 
                            stroke="#64748b" 
                            fontSize={11} 
                            tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                          />
                          <Tooltip
                            content={({ payload }: any) => {
                              if (!payload || !payload.length) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-xl text-xs space-y-1">
                                  <div className="font-bold text-white mb-1">{d.month}</div>
                                  {d.actual !== undefined && (
                                    <div className="text-emerald-400">
                                      Actual Spend: <b>₹{Number(d.actual).toLocaleString()}</b>
                                    </div>
                                  )}
                                  <div className="text-blue-300">
                                    Expected Spend: <b>₹{Number(d.baseline).toLocaleString()}</b>
                                  </div>
                                  <div className="text-slate-400 text-[10px]">
                                    Bounds: ₹{Number(d.lower).toLocaleString()} – ₹{Number(d.upper).toLocaleString()}
                                  </div>
                                  {d.isAnomaly && (
                                    <div className="pt-1 mt-1 border-t border-slate-700 text-rose-400 font-bold">
                                      ⚠ Anomaly Score: {d.anomalyScore} (Dev: {d.deviationPct}%)
                                    </div>
                                  )}
                                </div>
                              );
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="upper" 
                            fill="#3b82f6" 
                            fillOpacity={0.12} 
                            stroke="none" 
                            name="Confidence Interval"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="baseline" 
                            stroke="#60a5fa" 
                            strokeDasharray="4 4" 
                            strokeWidth={2}
                            dot={false}
                            name="Model Baseline"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="actual" 
                            stroke="#10b981" 
                            strokeWidth={2.5}
                            dot={(props: any) => {
                              const { cx, cy, payload } = props;
                              if (payload.isAnomaly) {
                                return (
                                  <circle 
                                    cx={cx} 
                                    cy={cy} 
                                    r={6} 
                                    fill="#f43f5e" 
                                    stroke="#ffffff" 
                                    strokeWidth={2} 
                                  />
                                );
                              }
                              return <circle cx={cx} cy={cy} r={3} fill="#10b981" />;
                            }}
                            name="Actual Disbursement"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Flagged Timeline Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-800/60 text-slate-400 uppercase font-semibold">
                        <tr>
                          <th className="p-3">Month</th>
                          <th className="p-3">Actual Disbursed</th>
                          <th className="p-3">Expected Forecast</th>
                          <th className="p-3">Deviation %</th>
                          <th className="p-3">Trend Anomaly Score</th>
                          <th className="p-3">Signal Assessment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {forecastResult.timeline.map((t: any, idx: number) => (
                          <tr 
                            key={idx} 
                            className={t.is_anomaly ? "bg-rose-950/20 text-white font-medium" : "hover:bg-slate-800/30"}
                          >
                            <td className="p-3 font-mono">{t.month}</td>
                            <td className="p-3 text-emerald-400 font-mono">₹{Number(t.actual_expenditure).toLocaleString()}</td>
                            <td className="p-3 font-mono text-slate-300">₹{Number(t.forecast_expenditure).toLocaleString()}</td>
                            <td className={`p-3 font-mono ${t.deviation_pct > 0 ? "text-amber-400" : "text-slate-400"}`}>
                              {t.deviation_pct > 0 ? `+${t.deviation_pct}%` : `${t.deviation_pct}%`}
                            </td>
                            <td className="p-3 font-mono font-bold">
                              <span className={`px-2 py-0.5 rounded-md ${t.is_anomaly ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-slate-400"}`}>
                                {t.trend_anomaly_score}
                              </span>
                            </td>
                            <td className="p-3">
                              {t.is_anomaly ? (
                                <span className="text-rose-400 flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  {t.deviation_pct > 0 ? "Statistical Surge Spike" : "Disbursement Stall"}
                                </span>
                              ) : (
                                <span className="text-slate-500 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  Within Normative Bounds
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* TAB 6: DRISHTI - SENTENCE-BERT SEMANTIC DUPLICATE DETECTION */}
        {activeTab === "dedup" && (
          <div className="space-y-8">
            {/* Interactive Query Bench */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    DRISHTI: Semantic Duplicate Work Detector
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Powered by Sentence-BERT (<code className="text-amber-300 font-mono">all-MiniLM-L6-v2</code>) embeddings across 12,000+ works. Detects paraphrased, re-sanctioned, or ghost projects using dense vector cosine similarity.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Sample Queries:</span>
                  <button
                    onClick={() => {
                      setSbertQuery("Construction of CC Road from main road to temple");
                    }}
                    className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                  >
                    CC Road / Temple
                  </button>
                  <button
                    onClick={() => {
                      setSbertQuery("Installation of high mast solar LED lights at bus stop");
                    }}
                    className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                  >
                    Solar Mast Light
                  </button>
                  <button
                    onClick={() => {
                      setSbertQuery("Borewell with submersible pump and drinking water pipeline");
                    }}
                    className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                  >
                    Borewell / Water
                  </button>
                </div>
              </div>

              {/* Input Form Controls */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Proposed Work Title / Description
                  </label>
                  <input
                    type="text"
                    value={sbertQuery}
                    onChange={(e) => setSbertQuery(e.target.value)}
                    placeholder="Enter full work title to test for semantic duplicates..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    State Filter
                  </label>
                  <select
                    value={sbertState}
                    onChange={(e) => setSbertState(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="All">All States / UTs</option>
                    {meta.states.map((st, i) => (
                      <option key={i} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Threshold: <span className="font-mono text-amber-400">{(sbertThreshold * 100).toFixed(0)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.50"
                    max="0.95"
                    step="0.05"
                    value={sbertThreshold}
                    onChange={(e) => setSbertThreshold(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg cursor-pointer accent-amber-500 mt-2"
                  />
                </div>

                <div className="md:col-span-2 flex items-end">
                  <button
                    onClick={runSbertSearch}
                    disabled={sbertLoading}
                    className="w-full h-[38px] bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                  >
                    {sbertLoading ? (
                      <Activity className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-4 h-4" /> Scan Duplicates
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Real-time Query Results */}
              {sbertResults && (
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-300">
                      Query matches against vector store:{" "}
                      <span className="font-bold text-white">
                        {sbertResults.matched_works?.length || 0} candidates
                      </span>
                    </div>
                    <div>
                      {sbertResults.is_duplicate_detected ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> High Semantic Similarity Detected (Max: {(sbertResults.highest_similarity * 100).toFixed(1)}%)
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Novel Work Proposal (No Exact Duplicate Found)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(sbertResults.matched_works || []).map((work: any, idx: number) => {
                      const isHigh = work.similarity_score >= sbertThreshold;
                      return (
                        <div
                          key={idx}
                          onClick={() => openInvestigation(work.project_id)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            isHigh 
                              ? "bg-rose-950/20 border-rose-500/40 hover:border-rose-500" 
                              : "bg-slate-800/40 border-slate-700/60 hover:border-slate-600"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="font-mono text-[10px] text-slate-400">{work.project_id}</span>
                              <span className="text-[10px] text-slate-600 ml-1.5">•</span>
                              <span className="text-[10px] text-slate-400 ml-1.5">{work.category}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                isHigh ? "bg-rose-500 text-white" : "bg-slate-700 text-slate-300"
                              }`}>
                                {(work.similarity_score * 100).toFixed(1)}% Match
                              </span>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                work.confidence_level === "VERY HIGH" ? "bg-rose-500/20 text-rose-400" :
                                work.confidence_level === "HIGH" ? "bg-amber-500/20 text-amber-400" : "bg-slate-700 text-slate-400"
                              }`}>
                                {work.confidence_level}
                              </span>
                            </div>
                          </div>

                          <h5 className="text-xs font-semibold text-white line-clamp-2 leading-relaxed mb-2">
                            {work.clean_text || work.work_title}
                          </h5>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                            <div>
                              {work.district}, {work.state}
                            </div>
                            <div className="font-mono font-bold text-emerald-400">
                              ₹{Number(work.sanction_amount).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Pre-Computed Near-Identical Work Clusters in Same District */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Copy className="w-4 h-4 text-rose-400" />
                    High-Risk Near-Identical Work Pairs Flagged in Same District
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Works within the same administrative jurisdiction sharing ≥ 82% semantic similarity. Prime candidates for double-billing or phantom re-sanctioning audits.
                  </p>
                </div>
                <button
                  onClick={loadConstituencyPairs}
                  disabled={pairsLoading}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  {pairsLoading ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
                  Refresh Pairs
                </button>
              </div>

              {pairsLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Activity className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                  Scanning vector index for multi-sanction pairwise collisions...
                </div>
              ) : constituencyPairs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {constituencyPairs.slice(0, 12).map((pair: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-800/40 border border-rose-500/30 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300">
                          {pair.district}, <span className="text-slate-400 font-normal">{pair.state}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono font-bold text-[11px] border border-rose-500/30">
                          {(pair.similarity_score * 100).toFixed(1)}% Cosine Match
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        {/* Project A */}
                        <div 
                          onClick={() => openInvestigation(pair.project_a.id)}
                          className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/60 hover:border-amber-500 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span className="font-mono text-amber-400">Work #1: {pair.project_a.id}</span>
                            <span className="text-emerald-400 font-bold">₹{Number(pair.project_a.amount).toLocaleString()}</span>
                          </div>
                          <div className="text-white font-medium line-clamp-1">{pair.project_a.title}</div>
                          <div className="text-[10px] text-slate-400 mt-1">MP: {pair.project_a.mp}</div>
                        </div>

                        {/* Project B */}
                        <div 
                          onClick={() => openInvestigation(pair.project_b.id)}
                          className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/60 hover:border-amber-500 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span className="font-mono text-amber-400">Work #2: {pair.project_b.id}</span>
                            <span className="text-emerald-400 font-bold">₹{Number(pair.project_b.amount).toLocaleString()}</span>
                          </div>
                          <div className="text-white font-medium line-clamp-1">{pair.project_b.title}</div>
                          <div className="text-[10px] text-slate-400 mt-1">MP: {pair.project_b.mp}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Click "Refresh Pairs" to inspect constituency duplicate collisions.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: VENDOR COLLUSION & CONCENTRATION GRAPH */}
        {activeTab === "collusion" && (
          <div className="space-y-8">
            {/* Header / Controls */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Network className="w-5 h-5 text-cyan-400" />
                    Vendor Collusion, Monopoly & Syndicate Network Graph
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Multi-partite bipartite graph modeling relationships between <b>Vendors</b>, <b>Constituencies</b>, and <b>Members of Parliament</b>. Flags local procurement monopolies, single-vendor dominance (&gt;30% constituency fund share), and multi-MP procurement syndicates.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* State Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">State:</span>
                    <select
                      value={vendorFilterState}
                      onChange={(e) => {
                        const st = e.target.value;
                        setVendorFilterState(st);
                        loadVendorCollusion(st, vendorThreshold);
                      }}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="All">All States / UTs</option>
                      {meta.states.map((s, idx) => (
                        <option key={idx} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Threshold Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Threshold:</span>
                    <select
                      value={vendorThreshold}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setVendorThreshold(val);
                        loadVendorCollusion(vendorFilterState, val);
                      }}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value={0.20}>≥ 20% Budget Share</option>
                      <option value={0.30}>≥ 30% Budget Share (Recommended)</option>
                      <option value={0.50}>≥ 50% Extreme Monopoly</option>
                    </select>
                  </div>

                  <button
                    onClick={() => loadVendorCollusion(vendorFilterState, vendorThreshold)}
                    disabled={vendorCollusionLoading}
                    className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20"
                  >
                    {vendorCollusionLoading ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
                    Analyze Network
                  </button>
                </div>
              </div>

              {/* KPI Badges */}
              {vendorCollusionData && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
                    <div className="text-xs text-slate-400">Monopoly Alert Instances</div>
                    <div className="text-2xl font-bold text-rose-400 mt-1 font-mono">
                      {vendorCollusionData.total_monopolies_flagged}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Vendors ≥ {vendorThreshold * 100}% share</div>
                  </div>

                  <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
                    <div className="text-xs text-slate-400">Multi-MP Syndicates</div>
                    <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
                      {vendorCollusionData.total_syndicates_flagged}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Cross-jurisdiction concentration</div>
                  </div>

                  <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
                    <div className="text-xs text-slate-400">Network Nodes Analyzed</div>
                    <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">
                      {vendorCollusionData.graph_visualization?.nodes?.length || 0}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Vendors, Constituencies & MPs</div>
                  </div>

                  <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
                    <div className="text-xs text-slate-400">Network Edges Mapped</div>
                    <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
                      {vendorCollusionData.graph_visualization?.edges?.length || 0}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Disbursement linkages</div>
                  </div>
                </div>
              )}
            </div>

            {vendorCollusionLoading ? (
              <div className="py-24 text-center text-slate-400 text-sm">
                <Activity className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-3" />
                Constructing bipartite procurement network and running community detection...
              </div>
            ) : vendorCollusionData ? (
              <div className="space-y-8">
                {/* 1. Local Monopolies Section */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      Constituency-Level Vendor Monopolies (Disproportionate Capture)
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Vendors who have captured a dominating proportion of all development funds released within a specific constituency.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-800/60 text-slate-400 uppercase font-semibold">
                        <tr>
                          <th className="p-3">Vendor / Contractor</th>
                          <th className="p-3">Constituency & State</th>
                          <th className="p-3">Representative (MP)</th>
                          <th className="p-3">Vendor Spend</th>
                          <th className="p-3">Constituency Total</th>
                          <th className="p-3">Capture Share</th>
                          <th className="p-3">Risk Assessment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {(vendorCollusionData.monopoly_alerts || []).map((m: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-3 font-semibold text-white max-w-xs truncate">
                              {m.vendor_name}
                            </td>
                            <td className="p-3">
                              <span className="font-medium text-slate-200">{m.constituency}</span>
                              <span className="text-slate-500 block text-[10px]">{m.state}</span>
                            </td>
                            <td className="p-3 text-slate-400 text-[11px] max-w-xs truncate">
                              {m.mp_name}
                            </td>
                            <td className="p-3 font-mono font-bold text-emerald-400">
                              ₹{m.vendor_disbursed_cr} Cr
                            </td>
                            <td className="p-3 font-mono text-slate-400">
                              ₹{m.total_const_disbursed_cr} Cr
                            </td>
                            <td className="p-3 font-mono font-bold">
                              <span className={`px-2 py-0.5 rounded ${
                                m.concentration_share_pct >= 60 
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" 
                                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              }`}>
                                {m.concentration_share_pct}%
                              </span>
                            </td>
                            <td className="p-3 text-slate-400 text-[11px]">
                              {m.explanation}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Cross-MP Syndicates Section */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Network className="w-4 h-4 text-amber-400" />
                      Cross-MP Contractor Syndicates (Inter-Jurisdictional Concentration)
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Single corporate or individual entities executing high volumes across multiple separate MP allocations simultaneously.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(vendorCollusionData.syndicate_alerts || []).map((s: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-semibold text-white text-xs line-clamp-1">{s.vendor_name}</h5>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {s.distinct_mps} MPs
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center py-1 bg-slate-900/60 rounded-lg">
                          <div>
                            <div className="text-[10px] text-slate-400">Total Spend</div>
                            <div className="text-xs font-bold font-mono text-emerald-400 mt-0.5">
                              ₹{s.total_disbursed_cr} Cr
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">Districts</div>
                            <div className="text-xs font-bold font-mono text-cyan-400 mt-0.5">
                              {s.distinct_constituencies}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">States</div>
                            <div className="text-xs font-bold font-mono text-white mt-0.5">
                              {s.states_covered}
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400">
                          {s.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* MODAL: PROJECT INVESTIGATION DOSSIER */}
      {activeProjectId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 relative">
            <div className="absolute top-6 right-6 flex items-center gap-2">
              <a
                href={`/api/py/works/${encodeURIComponent(activeProjectId)}/dossier-pdf`}
                target="_blank"
                rel="noreferrer"
                download
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
                title="Download Official Audit Dossier PDF with Multi-Model Consensus & Statutory Remarks"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export Dossier (PDF)</span>
              </a>
              <button
                onClick={() => { setActiveProjectId(null); setProjectDetail(null); }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading || !projectDetail ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                <Activity className="w-6 h-6 animate-spin mx-auto text-rose-500 mb-2" />
                Loading Project Investigation Dossier...
              </div>
            ) : (
              <>
                <div className="border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">{projectDetail.project.project_id}</span>
                    <span className="text-xs text-slate-600">•</span>
                    <span className="text-xs text-slate-400">{projectDetail.project.house}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                    {projectDetail.project.project_name}
                  </h2>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-400 mt-2">
                    <span>State: <b className="text-slate-200">{projectDetail.project.state}</b></span>
                    <span>•</span>
                    <span>District/IDA: <b className="text-slate-200">{projectDetail.project.district}</b></span>
                    <span>•</span>
                    <span>MP: <b className="text-slate-200">{projectDetail.project.mp_name || "N/A"}</b></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-xs">
                  <div>
                    <span className="text-slate-400">Risk Classification</span>
                    <div className="mt-1">{getRiskBadge(projectDetail.anomaly.risk_level)}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Investigation Priority</span>
                    <div className="text-base font-bold text-white font-mono mt-0.5">
                      Score: {projectDetail.anomaly.priority_score} <span className="text-xs text-rose-400 font-normal">(Rank #{projectDetail.anomaly.priority_rank})</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Isolation Forest Score</span>
                    <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
                      {projectDetail.anomaly.anomaly_score}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Work Status</span>
                    <div className="text-xs font-semibold text-slate-200 mt-1">
                      {projectDetail.project.work_status || "N/A"}
                    </div>
                  </div>
                </div>

                {/* STEP 4: UNIFIED MULTI-MODEL SYNCHRONIZED COMPOSITE RISK (Section 6 & Step 4) */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-indigo-500/40 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                        <Network className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Step 4 Synchronized Multi-Model Composite Risk
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          Fan-in consensus: Isolation Forest + S-BERT + Prophet + CoxPH Delay + Vendor Graph + XGBoost
                        </span>
                      </div>
                    </div>

                    {step4Loading ? (
                      <span className="text-indigo-400 flex items-center gap-1 text-xs">
                        <Activity className="w-3.5 h-3.5 animate-spin" /> Syncing 6 models...
                      </span>
                    ) : step4UnifiedData ? (
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                          step4UnifiedData.risk_band === "CRITICAL" ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" :
                          step4UnifiedData.risk_band === "HIGH" ? "bg-orange-500/20 text-orange-300 border border-orange-500/40" :
                          step4UnifiedData.risk_band === "MEDIUM" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                          "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        }`}>
                          {step4UnifiedData.risk_band} RISK BAND
                        </span>
                        <span className="text-lg font-bold font-mono text-white">
                          {step4UnifiedData.composite_risk_score} <span className="text-xs font-normal text-slate-400">/ 100</span>
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {step4UnifiedData?.reasons && step4UnifiedData.reasons.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Synchronized Statutory Plain-English Reasons:
                      </span>
                      <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5">
                        {step4UnifiedData.reasons.map((rs: string, rIdx: number) => (
                          <li key={rIdx} className="leading-relaxed">{rs}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Why Was This Project Flagged? (Investigation Findings)
                  </h3>
                  <div className="space-y-3">
                    {projectDetail.reasons.map((r: any, idx: number) => (
                      <div 
                        key={idx}
                        className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            {r.type.replace(/_/g, " ")}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            r.severity === "CRITICAL" ? "bg-rose-500/20 text-rose-400" :
                            r.severity === "HIGH" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"
                          }`}>
                            {r.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-medium pt-1">
                          {r.message}
                        </p>
                        {r.evidence && (
                          <div className="text-[11px] text-slate-400 font-mono pt-1">
                            Evidence: {r.evidence}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-2.5 text-xs">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                      <CircleDollarSign className="w-4 h-4 text-emerald-400" /> Supporting Financial Metrics
                    </h4>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Sanctioned Amount</span>
                      <span className="font-mono font-bold text-white">₹{projectDetail.supporting_metrics.sanction_amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Total Disbursed Expenditure</span>
                      <span className="font-mono font-bold text-emerald-400">₹{projectDetail.supporting_metrics.total_expenditure?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Unspent Sanction Allocation</span>
                      <span className="font-mono font-bold text-amber-400">₹{projectDetail.supporting_metrics.unspent_allocation?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Fund Utilisation Rate</span>
                      <span className="font-mono font-bold text-white">{projectDetail.supporting_metrics.utilisation_percentage}%</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Disbursement Transactions</span>
                      <span className="font-mono font-bold text-white">{projectDetail.supporting_metrics.transaction_count} disbursements</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-4 text-xs">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" /> Peer Benchmark Comparison
                    </h4>
                    <div className="text-[11px] text-slate-400">
                      Benchmarked against <b>{projectDetail.peer_comparison.peer_project_count.toLocaleString()}</b> projects in <b>{projectDetail.peer_comparison.peer_group}</b>.
                    </div>

                    <div className="space-y-2 pt-1">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-300">This Project Sanction</span>
                          <span className="font-mono font-bold text-rose-400">₹{projectDetail.peer_comparison.project_sanction?.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div className="bg-rose-500 h-2 rounded-full" style={{ width: "100%" }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400">Peer Group Median Sanction</span>
                          <span className="font-mono text-slate-300">₹{projectDetail.peer_comparison.peer_median_sanction?.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-slate-500 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, Math.max(5, (projectDetail.peer_comparison.peer_median_sanction / projectDetail.peer_comparison.project_sanction) * 100))}%` 
                            }} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-800/60 text-[11px] text-slate-300 space-y-1">
                      <div>• Peer Percentile Rank: <b>{projectDetail.peer_comparison.peer_sanction_percentile}th percentile</b></div>
                      <div>• Approval Latency: <b>{projectDetail.peer_comparison.project_delay_days} days</b> (Peer Median: {projectDetail.peer_comparison.peer_median_delay} days)</div>
                    </div>
                  </div>
                </div>

                {/* S-BERT Live Semantic Duplicate Cross-Check inside Dossier */}
                <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Sentence-BERT Semantic Duplicate Cross-Check
                    </h4>
                    {dossierDedupLoading ? (
                      <span className="text-amber-400 flex items-center gap-1 text-[11px]">
                        <Activity className="w-3.5 h-3.5 animate-spin" /> Vectorizing title...
                      </span>
                    ) : dossierDedupMatches.length > 0 ? (
                      <span className="text-rose-400 font-bold text-[11px] flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> {dossierDedupMatches.length} Similar Work{dossierDedupMatches.length > 1 ? "s" : ""} Located
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> No Overlapping Duplicate Found
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Dense vector similarity search against 12,000+ works in the database using <code className="text-amber-300 font-mono">all-MiniLM-L6-v2</code> to detect identical or paraphrased titles.
                  </p>

                  {dossierDedupMatches.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {dossierDedupMatches.map((m: any, idx: number) => {
                        const isMatch = m.similarity_score >= 0.75;
                        return (
                          <div 
                            key={idx}
                            onClick={() => openInvestigation(m.project_id)}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              isMatch 
                                ? "bg-rose-950/20 border-rose-500/40 hover:border-rose-500" 
                                : "bg-slate-900/60 border-slate-700/60 hover:border-slate-500"
                            }`}
                          >
                            <div className="space-y-0.5 max-w-xl">
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span className="font-mono text-amber-400">{m.project_id}</span>
                                <span>•</span>
                                <span>{m.district}, {m.state}</span>
                                <span>•</span>
                                <span>MP: {m.mp_name}</span>
                              </div>
                              <div className="text-white font-medium line-clamp-1">
                                {m.clean_text || m.work_title}
                              </div>
                            </div>
                            <div className="text-right whitespace-nowrap">
                              <div className="font-mono font-bold text-emerald-400 text-xs">
                                ₹{Number(m.sanction_amount).toLocaleString()}
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                isMatch ? "bg-rose-500 text-white" : "bg-slate-700 text-slate-300"
                              }`}>
                                {(m.similarity_score * 100).toFixed(1)}% Match
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Cox Proportional Hazards (CoxPHFitter) Survival Delay Risk Card */}
                <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-400" /> Cox Proportional Hazards Delay Prediction (Survival Analysis)
                    </h4>
                    {survivalRiskLoading ? (
                      <span className="text-indigo-400 flex items-center gap-1 text-[11px]">
                        <Activity className="w-3.5 h-3.5 animate-spin" /> Fitting baseline hazard...
                      </span>
                    ) : survivalRisk ? (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        survivalRisk.risk_tier === "HIGH" 
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" 
                          : survivalRisk.risk_tier === "MODERATE"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {survivalRisk.risk_tier} OVERDUE RISK
                      </span>
                    ) : null}
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Semi-parametric survival model (<code className="text-indigo-300 font-mono">lifelines.CoxPHFitter</code>) accounting for right-censoring in ongoing works. Evaluates relative completion hazard, projected median finish horizon, and probability of exceeding deadline.
                  </p>

                  {survivalRisk && (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Overdue Risk (1-Year)</div>
                          <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                            {survivalRisk.overdue_percentage}%
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">P(Duration &gt; 365 Days)</div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Estimated Median Horizon</div>
                          <div className="text-xl font-bold font-mono text-white mt-1">
                            {survivalRisk.estimated_median_days} <span className="text-xs font-normal text-slate-400">days</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">50% Completion Threshold</div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Relative Hazard Ratio</div>
                          <div className="text-xl font-bold font-mono text-indigo-400 mt-1">
                            {survivalRisk.relative_hazard_ratio}x
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">&gt;1.0 = faster, &lt;1.0 = delayed</div>
                        </div>
                      </div>

                      {/* Recommendation note */}
                      <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-[11px] text-indigo-200">
                        <span className="font-semibold text-indigo-300">Decision Support: </span>
                        {survivalRisk.recommendation}
                      </div>

                      {/* Milestone timeline progression */}
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Survival Curve Trajectory (Completion Likelihood Milestones)
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                          {(survivalRisk.survival_trajectory || []).map((pt: any, idx: number) => (
                            <div key={idx} className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                              <div className="text-[10px] text-slate-400 font-mono">Day {pt.day}</div>
                              <div className="text-xs font-bold font-mono text-emerald-400 mt-1">
                                {pt.completion_likelihood_pct}%
                              </div>
                              <div className="text-[9px] text-slate-500 mt-0.5">
                                done
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* XGBoost Unified Risk Scoring & Audit Prioritization Card */}
                <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400" /> XGBoost Supervised Risk Scoring (Audit Prioritization)
                    </h4>
                    {xgboostLoading ? (
                      <span className="text-amber-400 flex items-center gap-1 text-[11px]">
                        <Activity className="w-3.5 h-3.5 animate-spin" /> Evaluating decision trees...
                      </span>
                    ) : xgboostRisk?.xgboost_assessment ? (
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          xgboostRisk.xgboost_assessment.risk_band === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : xgboostRisk.xgboost_assessment.risk_band === "HIGH"
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            : xgboostRisk.xgboost_assessment.risk_band === "MEDIUM"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}>
                          {xgboostRisk.xgboost_assessment.risk_band} AUDIT PRIORITY
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Ensemble gradient boosted decision tree classifier (<code className="text-amber-300 font-mono">xgboost.XGBClassifier</code>) synthesizing Isolation Forest anomaly scores, sanction scale, approval latency, and peer percentiles into an audit prioritization probability.
                  </p>

                  {xgboostRisk?.xgboost_assessment && (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Audit Risk Probability</div>
                          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                            {xgboostRisk.xgboost_assessment.risk_percentage}%
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">XGBoost Class 1 Likelihood</div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Computed Priority Score</div>
                          <div className="text-xl font-bold font-mono text-white mt-1">
                            {xgboostRisk.xgboost_assessment.priority_score} <span className="text-xs font-normal text-slate-400">/ 100</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Calibrated Ranking Metric</div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Model Status</div>
                          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                            ROC-AUC 1.00
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Trained on 50k project records</div>
                        </div>
                      </div>

                      {/* Top Risk Factor Explanations */}
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Key Risk Factor Drivers (Attributed by Gradient Boosted Trees)
                        </div>
                        <div className="space-y-2">
                          {(xgboostRisk.xgboost_assessment.top_factors || []).map((factor: any, fIdx: number) => (
                            <div 
                              key={fIdx}
                              className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                                factor.importance === "CRITICAL"
                                  ? "bg-rose-950/20 border-rose-500/30"
                                  : factor.importance === "HIGH"
                                  ? "bg-amber-950/20 border-amber-500/30"
                                  : "bg-slate-900/60 border-slate-800"
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                                    factor.importance === "CRITICAL" ? "bg-rose-500 text-white" :
                                    factor.importance === "HIGH" ? "bg-amber-500 text-black" : "bg-slate-700 text-slate-300"
                                  }`}>
                                    {factor.importance}
                                  </span>
                                  <span className="font-semibold text-white text-xs">{factor.factor}</span>
                                </div>
                                <div className="text-[11px] text-slate-300 pt-0.5">
                                  {factor.description}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => { setActiveProjectId(null); setProjectDetail(null); }}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Close Dossier
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
