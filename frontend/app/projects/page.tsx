"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  FileText,
  ChevronDown,
  ArrowLeft
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

function AnomalyInvestigationPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as any;

  const validTabs = ["overview", "investigate", "graphs", "evaluation", "forecasting", "dedup", "collusion"];
  const initialTab = validTabs.includes(tabParam) ? tabParam : "overview";

  const [activeTab, setActiveTab] = useState<"overview" | "investigate" | "graphs" | "evaluation" | "forecasting" | "dedup" | "collusion">(initialTab);

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  
  // Data States
  const [summary, setSummary] = useState<any>(null);
  const [meta, setMeta] = useState<{ states: string[]; work_categories: string[]; risk_levels: string[]; districts?: string[] }>({ states: [], work_categories: [], risk_levels: [], districts: [] });
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

  const stateParam = searchParams.get("state") || "All";
  const districtParam = searchParams.get("district") || "";

  // Filters
  const [page, setPage] = useState(1);
  const [selectedRisk, setSelectedRisk] = useState("All");
  const [selectedState, setSelectedState] = useState(stateParam);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedHouse, setSelectedHouse] = useState("All");
  const [searchDistrict, setSearchDistrict] = useState(districtParam);
  const [stateSearchFilter, setStateSearchFilter] = useState("");
  const [sortBy, setSortBy] = useState("priority_score_desc");

  useEffect(() => {
    if (searchParams.get("state")) {
      setSelectedState(searchParams.get("state")!);
    }
    if (searchParams.get("district")) {
      setSearchDistrict(searchParams.get("district")!);
    }
  }, [searchParams]);

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
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<boolean>(false);
  const [entityDropdownOpen, setEntityDropdownOpen] = useState<boolean>(false);
  const [entitySearchQuery, setEntitySearchQuery] = useState<string>("");
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const entityDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (entityDropdownRef.current && !entityDropdownRef.current.contains(event.target as Node)) {
        setEntityDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);




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
      if (res.ok) {
        const data = await res.json();
        setConstituencyPairs(data.duplicate_pairs || []);
      } else {
        console.warn("Constituency pairs non-200 response:", res.status);
      }
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
      if (res.ok) {
        const data = await res.json();
        setVendorCollusionData(data);
      } else {
        console.warn("Vendor collusion non-200 response:", res.status);
      }
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
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF4F00]/10 text-[#FF4F00] border border-[#FF4F00]/30">CRITICAL</span>;
      case "HIGH":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-[#FACC15] border border-amber-500/30">HIGH</span>;
      case "MEDIUM":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 border border-blue-500">MEDIUM</span>;
      case "LOW":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-neutral-500 border border-slate-500">LOW</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 border border-emerald-500">NORMAL</span>;
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
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 antialiased selection:bg-[#FF4F00] selection:text-white">
      {/* Top Banner & Analytical Decision Support Notice */}
      <div className="bg-[#F5F5F5] border-b border-[#E5E5E5] px-6 py-2 text-[11px] text-neutral-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#FF4F00] shrink-0" />
          <span>
            <b>Analytical Decision-Support System</b>: Flagged items represent statistical deviations from peer benchmarks, not automatic fraud or wrongdoing.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 font-mono text-[10px]">
          <span className="text-neutral-500">ENGINE: Isolation Forest v1.9</span>
          <span className="text-emerald-700 font-semibold">VALIDATED PRECISION: 84.33%</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="border-b border-[#E5E5E5] bg-white shadow-sm sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top Bar: Brand, Title & RBAC Controls */}
          <div className="h-16 flex items-center justify-between gap-4 border-b border-[#E5E5E5]">
            {/* Brand Logo & Back to Home */}
            <div className="flex items-center gap-4 shrink-0">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900 text-xs font-semibold font-nunito transition-colors"
                title="Return to Home"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#FF4F00]" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <Link href="/" className="flex items-center gap-3 shrink-0 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF4F00] to-amber-500 flex items-center justify-center shadow-md shadow-[#FF4F00]/20 shrink-0 group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base sm:text-lg tracking-tight font-poppins text-neutral-900 group-hover:text-[#FF4F00] transition-colors">
                      MPLADS Projects Portal
                    </span>
                    <span className="hidden md:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FF4F00]/10 text-[#FF4F00] border border-[#FF4F00]/20">
                      National Live
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono tracking-wide">
                    NIRIKSHAK 2.0 • AI-POWERED MONITORING
                  </span>
                </div>
              </Link>
            </div>

            {/* STEP 4: RBAC ROLE SELECTOR & ENTITY SCOPER */}
            <div className="flex items-center gap-2 relative">
              {/* Role Dropdown */}
              <div ref={roleDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setRoleDropdownOpen(!roleDropdownOpen);
                    setEntityDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F5F5F5] border border-[#E5E5E5] text-xs font-medium text-neutral-800 shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#FF4F00] shrink-0" />
                  <span className="text-neutral-500 font-normal hidden sm:inline">Role:</span>
                  <span className="font-semibold text-neutral-900">
                    {rbacRole === "ministry" && "Ministry (National)"}
                    {rbacRole === "state" && "State Nodal"}
                    {rbacRole === "district" && "District IDA"}
                    {rbacRole === "mp" && "Hon'ble MP"}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 transition-transform duration-200 ${roleDropdownOpen ? "rotate-180 text-[#FF4F00]" : ""}`} />
                </button>

                {roleDropdownOpen && (
                  <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-56 rounded-2xl bg-white border border-[#E5E5E5] shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-wider border-b border-[#E5E5E5]">
                      Select RBAC Jurisdiction
                    </div>
                    {[
                      { id: "ministry", label: "Ministry (National View)", desc: "Full 36 States & UTs" },
                      { id: "state", label: "State Nodal Agency", desc: "Filter by State / UT" },
                      { id: "district", label: "District Authority (IDA)", desc: "Filter by District / Collector" },
                      { id: "mp", label: "Member of Parliament", desc: "Filter by Hon'ble MP" }
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          const newRole = r.id as "ministry" | "state" | "district" | "mp";
                          setRbacRole(newRole);
                          setRoleDropdownOpen(false);
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
                        className={`w-full text-left px-3 py-2 text-xs transition-colors flex flex-col gap-0.5 ${
                          rbacRole === r.id 
                            ? "bg-[#FF4F00]/10 text-[#FF4F00] font-semibold" 
                            : "text-neutral-700 hover:bg-[#F5F5F5] hover:text-neutral-900"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{r.label}</span>
                          {rbacRole === r.id && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>}
                        </div>
                        <span className="text-[10px] text-neutral-400 font-normal">{r.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Entity Picker Dropdown (when role is not national) */}
              {rbacRole !== "ministry" && (
                <div ref={entityDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setEntityDropdownOpen(!entityDropdownOpen);
                      setRoleDropdownOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF4F00]/10 hover:bg-[#FF4F00]/15 border border-[#FF4F00]/30 text-xs font-semibold text-[#FF4F00] shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[180px] sm:max-w-[240px]"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#FF4F00] shrink-0" />
                    <span className="truncate">{rbacEntity}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#FF4F00] shrink-0 transition-transform duration-200 ${entityDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {entityDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-[#E5E5E5] shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-1.5 mb-1.5 border-b border-[#E5E5E5]">
                        <input
                          type="text"
                          placeholder={`Search ${rbacRole === "state" ? "state" : rbacRole === "district" ? "district" : "MP"}...`}
                          value={entitySearchQuery}
                          onChange={(e) => setEntitySearchQuery(e.target.value)}
                          className="w-full px-2.5 py-1 text-xs bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
                        {rbacRole === "state" && (
                          (meta?.states || [])
                            .filter((s: string) => s.toLowerCase().includes(entitySearchQuery.toLowerCase()))
                            .map((s: string) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => {
                                  setRbacEntity(s);
                                  setEntityDropdownOpen(false);
                                  setEntitySearchQuery("");
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                  rbacEntity === s ? "bg-[#FF4F00] text-white font-bold" : "text-neutral-700 hover:bg-[#F5F5F5] hover:text-neutral-900"
                                }`}
                              >
                                {s}
                              </button>
                            ))
                        )}

                        {rbacRole === "district" && (
                          (meta?.districts || [])
                            .filter((d: string) => d.toLowerCase().includes(entitySearchQuery.toLowerCase()))
                            .slice(0, 100)
                            .map((d: string) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => {
                                  setRbacEntity(d);
                                  setEntityDropdownOpen(false);
                                  setEntitySearchQuery("");
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs truncate transition-colors ${
                                  rbacEntity === d ? "bg-[#FF4F00] text-white font-bold" : "text-neutral-700 hover:bg-[#F5F5F5] hover:text-neutral-900"
                                }`}
                                title={d}
                              >
                                {d}
                              </button>
                            ))
                        )}

                        {rbacRole === "mp" && (
                          (forecastMps || [])
                            .filter((m: any) => m.mp_name.toLowerCase().includes(entitySearchQuery.toLowerCase()))
                            .map((m: any) => (
                              <button
                                key={m.mp_name}
                                type="button"
                                onClick={() => {
                                  setRbacEntity(m.mp_name);
                                  setEntityDropdownOpen(false);
                                  setEntitySearchQuery("");
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs truncate transition-colors ${
                                  rbacEntity === m.mp_name ? "bg-[#FF4F00] text-white font-bold" : "text-neutral-700 hover:bg-[#F5F5F5] hover:text-neutral-900"
                                }`}
                                title={m.mp_name}
                              >
                                {m.mp_name}
                              </button>
                            ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Bar: Tab Navigation */}
          <div className="py-2.5 overflow-x-auto scrollbar-none flex items-center justify-start md:justify-center">
            <nav className="flex gap-1.5 p-1 bg-white border border-[#E5E5E5] rounded-2xl shrink-0 shadow-inner">
              {[
                { id: "overview", label: "Overview", icon: Activity },
                { id: "investigate", label: "Investigation Queue", icon: Database },
                { id: "graphs", label: "Visual Graphs", icon: TrendingUp },
                { id: "evaluation", label: "Model Validation", icon: BarChart3 },
                { id: "forecasting", label: "Expenditure Forecasts", icon: Clock },
                { id: "dedup", label: "DRISHTI", icon: Sparkles, iconClass: "text-amber-400" },
                { id: "collusion", label: "Vendor Collusion", icon: Network, iconClass: "text-cyan-400" }
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      if (tab.id === "forecasting" && selectedMpForForecast && !forecastResult) {
                        runMpForecast(selectedMpForForecast);
                      } else if (tab.id === "dedup") {
                        if (!sbertResults) runSbertSearch();
                        if (constituencyPairs.length === 0) loadConstituencyPairs();
                      } else if (tab.id === "collusion") {
                        if (!vendorCollusionData) loadVendorCollusion();
                      }
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                      isActive 
                        ? "bg-[#FF4F00] text-white shadow-md shadow-[#FF4F00]/20" 
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-[#F5F5F5]"
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${tab.iconClass || ""}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* RBAC Active Filter Banner */}
            {rbacRole !== "ministry" && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FF4F00]/5 via-white to-amber-50/40 border border-[#FF4F00]/30 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 text-[#FF4F00] rounded-xl">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#FF4F00] uppercase tracking-wider">
                      RBAC Scoped Perspective Active: {rbacRole === "state" ? "State Nodal Agency" : rbacRole === "district" ? "District Collector / IDA" : "Hon'ble MP"}
                    </span>
                    <h3 className="text-sm font-bold text-neutral-900 mt-0.5 font-poppins">
                      Scoped Entity: <span className="text-[#FF4F00] font-space-mono font-bold">{rbacEntity}</span>
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {rbacLoading ? (
                    <span className="text-xs text-[#FF4F00] flex items-center gap-1 font-nunito">
                      <Activity className="w-3.5 h-3.5 animate-spin" /> Syncing Role Data...
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-600 font-nunito">
                      Viewing <b className="text-neutral-900 font-space-mono">{rbacScopedData ? rbacScopedData.total_works : 0}</b> works in jurisdiction
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setRbacRole("ministry");
                      setRbacEntity("National Portfolio");
                    }}
                    className="px-2.5 py-1 bg-[#F5F5F5] hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold transition-colors font-nunito"
                  >
                    Reset to National View
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5]">
                <div className="text-neutral-500 text-xs font-medium uppercase tracking-wider font-nunito">
                  {rbacRole === "ministry" ? "Total Projects Analyzed" : "Jurisdiction Total Works"}
                </div>
                <div className="text-2xl font-bold mt-2 text-neutral-900 font-mono">
                  {rbacRole !== "ministry" && rbacScopedData 
                    ? rbacScopedData.total_works.toLocaleString()
                    : summary ? summary.total_projects.toLocaleString() : "..."}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1 font-nunito">
                  {rbacRole === "ministry" ? "Unified Lok Sabha & Rajya Sabha" : `Scoped to ${rbacRole.toUpperCase()}`}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5]">
                <div className="text-[#FF4F00] text-xs font-medium uppercase tracking-wider font-nunito">
                  {rbacRole === "ministry" ? "Flagged Anomalies" : "Critical Risk Works"}
                </div>
                <div className="text-2xl font-bold mt-2 text-[#FF4F00] font-mono">
                  {rbacRole !== "ministry" && rbacScopedData
                    ? rbacScopedData.critical_risk_count.toLocaleString()
                    : summary ? summary.total_anomalies.toLocaleString() : "..."}
                </div>
                <div className="text-[11px] text-[#FF4F00]/80 mt-1 font-nunito">
                  {rbacRole !== "ministry" && rbacScopedData
                    ? `${rbacScopedData.total_works > 0 ? ((rbacScopedData.critical_risk_count / rbacScopedData.total_works) * 100).toFixed(1) : 0}% critical rate`
                    : summary ? `${summary.anomaly_percentage}% rate` : "..."}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5]">
                <div className="text-amber-600 text-xs font-medium uppercase tracking-wider font-nunito">
                  {rbacRole === "ministry" ? "Critical / High Risk" : "High Risk Works"}
                </div>
                <div className="text-2xl font-bold mt-2 text-amber-600 font-mono">
                  {rbacRole !== "ministry" && rbacScopedData
                    ? rbacScopedData.high_risk_count.toLocaleString()
                    : summary ? (summary.risk_distribution.critical + summary.risk_distribution.high).toLocaleString() : "..."}
                </div>
                <div className="text-[11px] text-amber-600/80 mt-1 font-nunito">
                  {rbacRole !== "ministry" && rbacScopedData
                    ? `Avg Priority: ${rbacScopedData.avg_priority_score}`
                    : "Requires primary review"}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5]">
                <div className="text-emerald-600 text-xs font-medium uppercase tracking-wider font-nunito">
                  {rbacRole === "ministry" ? "Validated Precision" : "Sanctioned Budget"}
                </div>
                <div className="text-2xl font-bold mt-2 text-emerald-600 font-mono">
                  {rbacRole !== "ministry" && rbacScopedData
                    ? `₹${rbacScopedData.total_sanction_cr} Cr`
                    : summary ? `${(summary.precision * 100).toFixed(2)}%` : "..."}
                </div>
                <div className="text-[11px] text-emerald-600/80 mt-1 font-nunito">
                  {rbacRole !== "ministry" && rbacScopedData
                    ? `Exp: ₹${rbacScopedData.total_expenditure_cr} Cr`
                    : "On benchmark perturbations"}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5]">
                <div className="text-blue-600 text-xs font-medium uppercase tracking-wider font-nunito">Model ROC-AUC</div>
                <div className="text-2xl font-bold mt-2 text-blue-600 font-mono">
                  {summary ? summary.evaluation_metrics.roc_auc.toFixed(4) : "0.9981"}
                </div>
                <div className="text-[11px] text-blue-600/80 mt-1 font-nunito">Area under ROC curve</div>
              </div>
            </div>

            {/* Visual Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5]">
                <h3 className="text-sm font-semibold text-neutral-800 mb-2 flex items-center gap-2 font-poppins">
                  <ShieldAlert className="w-4 h-4 text-[#FF4F00]" />
                  Investigation Risk Breakdown
                </h3>
                <p className="text-xs text-neutral-500 mb-4 font-nunito">Click slice to filter investigation table</p>
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
                        <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#E5E5E5", borderRadius: "12px", fontSize: "12px", color: "#171717", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
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
                      className="p-2 bg-[#F9FAFB] hover:bg-[#F0F0F0] border border-[#E5E5E5] rounded-lg text-left flex items-center justify-between text-xs transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                        <span className="text-neutral-700 font-medium font-nunito">{r.name}</span>
                      </span>
                      <span className="font-mono font-bold text-neutral-900">{r.value?.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5]">
                <h3 className="text-sm font-semibold text-neutral-800 mb-2 flex items-center gap-2 font-poppins">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  Top States by Flagged Projects
                </h3>
                <p className="text-xs text-neutral-500 mb-4 font-nunito">Distribution of anomalous records</p>
                {summary && (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.top_states}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#E5E5E5", borderRadius: "12px", fontSize: "12px", color: "#171717", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                        <Bar dataKey="count" fill="#FF4F00" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5]">
                <h3 className="text-sm font-semibold text-neutral-800 mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Top Work Categories
                </h3>
                <p className="text-xs text-neutral-500 mb-4">Frequency of financial/delay anomalies</p>
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
                  <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2 font-poppins">
                    <MapPin className="w-5 h-5 text-[#FF4F00]" />
                    All States & Union Territories Anomaly Cards
                  </h3>
                  <p className="text-xs text-neutral-500 font-nunito">
                    Click any state or UT card below to instantly filter the investigation queue and load flagged projects for that region.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search State or UT..."
                    value={stateSearchFilter}
                    onChange={(e) => setStateSearchFilter(e.target.value)}
                    className="bg-white border border-[#E5E5E5] rounded-xl px-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#FF4F00] focus:ring-1 focus:ring-[#FF4F00]/30 w-52 font-nunito"
                  />
                  {selectedState !== "All" && (
                    <button
                      onClick={() => { setSelectedState("All"); setPage(1); }}
                      className="px-2.5 py-1.5 bg-[#FF4F00]/10 hover:bg-[#FF4F00]/20 text-[#FF4F00] rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
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
                          ? "bg-[#FFF5F2] border-[#FF4F00] shadow-md shadow-[#FF4F00]/10 ring-1 ring-[#FF4F00]" 
                          : "bg-white border-[#E5E5E5] hover:border-[#FF4F00]/60 hover:bg-white hover:shadow-md hover:shadow-[#FF4F00]/5"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-neutral-900 group-hover:text-[#FF4F00] transition-colors flex items-center gap-1.5 font-poppins">
                            <span>{st.state}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#FF4F00]" />
                          </h4>
                          <span className="text-[11px] text-neutral-500 font-nunito">
                            {st.total_projects.toLocaleString()} total works
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-nunito ${
                          st.anomaly_count > 100 
                            ? "bg-rose-50 text-rose-600 border border-rose-200" 
                            : st.anomaly_count > 20
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                        }`}>
                          {st.anomaly_count} outliers ({st.anomaly_rate}%)
                        </span>
                      </div>

                      {/* Mini Risk Breakdown Pills */}
                      <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-[#E5E5E5] text-[10px]">
                        <div className="bg-[#F9FAFB] border border-[#F0F0F0] p-1.5 rounded-lg text-center">
                          <span className="text-neutral-500 block text-[9px] uppercase font-semibold">Critical</span>
                          <span className="font-bold text-rose-600 font-mono">{st.critical_count}</span>
                        </div>
                        <div className="bg-[#F9FAFB] border border-[#F0F0F0] p-1.5 rounded-lg text-center">
                          <span className="text-neutral-500 block text-[9px] uppercase font-semibold">High</span>
                          <span className="font-bold text-amber-600 font-mono">{st.high_count}</span>
                        </div>
                        <div className="bg-[#F9FAFB] border border-[#F0F0F0] p-1.5 rounded-lg text-center">
                          <span className="text-neutral-500 block text-[9px] uppercase font-semibold">Max Pri</span>
                          <span className="font-bold text-neutral-900 font-mono">{st.max_priority_score}</span>
                        </div>
                      </div>

                      {/* Sanctions Scale & Click Prompt */}
                      <div className="flex justify-between items-center text-[10px] text-neutral-500 mt-2 font-mono">
                        <span>Alloc: ₹{st.total_sanction_cr} Cr</span>
                        <span className="text-[#FF4F00] font-semibold group-hover:underline">Open State Page →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ---------------- FILTER BAR ---------------- */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#FF4F00]" />
                  <span className="text-sm font-semibold text-neutral-900 font-poppins">Investigation Queue Filters</span>
                  <span className="text-xs text-neutral-500 font-nunito">
                    ({anomaliesData.total_records.toLocaleString()} projects matching filters)
                  </span>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl text-xs font-semibold text-neutral-800 transition-all shadow-sm font-nunito"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" /> Export Filtered CSV
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1 font-nunito">Risk Level</label>
                  <select
                    value={selectedRisk}
                    onChange={(e) => { setSelectedRisk(e.target.value); setPage(1); }}
                    className="w-full bg-white border border-[#E5E5E5] rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-[#FF4F00]"
                  >
                    <option value="All">All Risks</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1 font-nunito">State / UT</label>
                  <select
                    value={selectedState}
                    onChange={(e) => { setSelectedState(e.target.value); setPage(1); }}
                    className="w-full bg-white border border-[#E5E5E5] rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-[#FF4F00]"
                  >
                    <option value="All">All States & UTs</option>
                    {meta.states.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1 font-nunito">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                    className="w-full bg-white border border-[#E5E5E5] rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-[#FF4F00]"
                  >
                    <option value="All">All Categories</option>
                    {meta.work_categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1 font-nunito">House</label>
                  <select
                    value={selectedHouse}
                    onChange={(e) => { setSelectedHouse(e.target.value); setPage(1); }}
                    className="w-full bg-white border border-[#E5E5E5] rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-[#FF4F00]"
                  >
                    <option value="All">All Houses</option>
                    <option value="Lok Sabha">Lok Sabha</option>
                    <option value="Rajya Sabha">Rajya Sabha</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1 font-nunito">District / IDA</label>
                  <input
                    type="text"
                    placeholder="Search district..."
                    value={searchDistrict}
                    onChange={(e) => { setSearchDistrict(e.target.value); setPage(1); }}
                    className="w-full bg-white border border-[#E5E5E5] rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#FF4F00]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1 font-nunito">Sort Priority</label>
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                    className="w-full bg-white border border-[#E5E5E5] rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 font-medium focus:outline-none focus:border-[#FF4F00]"
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
            <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-700">
                  <thead className="bg-[#F9FAFB] border-b border-[#E5E5E5] text-neutral-600 uppercase font-semibold">
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
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {anomaliesData.records.map((item: any) => (
                      <tr key={item.project_id} className="hover:bg-[#F9FAFB] transition-colors group">
                        <td className="py-3 px-3 font-mono font-semibold text-neutral-900 whitespace-nowrap">
                          {item.project_id}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-neutral-800">{item.state}</div>
                          <div className="text-[10px] text-neutral-400 truncate max-w-[140px]">{item.district}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-neutral-700 truncate max-w-[140px]">{item.mp_name || "N/A"}</div>
                          <div className="text-[10px] text-neutral-400">{item.house}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-neutral-900">
                          ₹{item.sanction_amount?.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className={`${
                            item.utilisation_percentage === 0 ? "text-rose-600 font-bold" :
                            item.utilisation_percentage > 100 ? "text-amber-600 font-bold" : "text-neutral-700"
                          }`}>
                            {item.utilisation_percentage?.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {getRiskBadge(item.risk_level)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-neutral-900">
                            <span className="text-xs">{item.priority_score}</span>
                            <span className="text-[10px] text-neutral-400 font-normal">#{item.priority_rank}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-neutral-700 max-w-xs text-[11px] leading-relaxed font-nunito">
                          {item.primary_reason}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => openInvestigation(item.project_id)}
                            className="px-3 py-1 bg-[#FF4F00]/10 hover:bg-[#FF4F00] text-[#FF4F00] hover:text-white border border-[#FF4F00]/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ml-auto font-nunito"
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
              <div className="flex items-center justify-between pt-6 border-t border-[#E5E5E5] mt-4 text-xs text-neutral-500">
                <div>
                  Showing page <b>{anomaliesData.page}</b> of <b>{anomaliesData.total_pages}</b> ({anomaliesData.total_records.toLocaleString()} flagged records)
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] disabled:opacity-40 text-neutral-800 flex items-center gap-1 font-nunito font-semibold"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button
                    disabled={page >= anomaliesData.total_pages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] disabled:opacity-40 text-neutral-800 flex items-center gap-1 font-nunito font-semibold"
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
            <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2 font-poppins">
                    <Activity className="w-5 h-5 text-[#FF4F00]" />
                    Multi-Dimensional Isolation Tree Projection
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 font-nunito">
                    Projects plotted across Approval Delay Days (X-axis) vs Log Sanction Scale (Y-axis).
                    Red & Amber nodes represent points with extreme tree isolation depths.
                  </p>
                </div>
                <div className="flex gap-4 text-xs font-semibold font-nunito">
                  <span className="flex items-center gap-1 text-[#FF4F00]">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Flagged Outliers
                  </span>
                  <span className="flex items-center gap-1 text-neutral-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span> Peer Norms
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
                          <div className="p-3 bg-white border border-[#E5E5E5] rounded-xl shadow-xl text-xs space-y-1 text-neutral-900">
                            <div className="font-bold text-neutral-900 flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${data.isAnomaly ? "bg-rose-500" : "bg-slate-400"}`} />
                              {data.isAnomaly ? `ANOMALY (${data.riskLevel})` : "NORMAL RECORD"}
                            </div>
                            <div className="text-neutral-700">Project: <b className="text-neutral-900 font-mono">{data.projectId}</b></div>
                            <div className="text-neutral-700">Sanction: <b className="text-emerald-600 font-mono">₹{data.sanctionAmount?.toLocaleString()}</b></div>
                            <div className="text-neutral-700">Delay: <b className="text-amber-600 font-mono">{data.delayDays} days</b></div>
                            <div className="text-neutral-700">Utilisation: <b className="font-mono">{data.utilisation}%</b></div>
                            <div className="text-neutral-500 font-nunito">{data.state} | {data.mpName}</div>
                          </div>
                        );
                      }}
                    />
                    <Scatter name="Projects" data={scatterData}>
                      {scatterData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            !entry.isAnomaly ? "#94a3b8" :
                            entry.riskLevel === "CRITICAL" ? "#f43f5e" :
                            entry.riskLevel === "HIGH" ? "#f59e0b" : "#3b82f6"
                          } 
                          opacity={entry.isAnomaly ? 0.9 : 0.6}
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
            <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2 font-poppins">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                    Multi-Model Verification & Statistical Validation Governance
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 font-nunito">
                    Formal audit validation metrics across all 5 models: <b>Isolation Forest</b> (Outliers), <b>Sentence-BERT</b> (Duplicates), <b>CoxPH</b> (Survival), <b>XGBoost</b> (Prioritization), and <b>Vendor Graph</b> (Collusion).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 font-nunito">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> All 5 Models Calibrated
                  </span>
                </div>
              </div>

              {/* 1. Isolation Forest Validation Card */}
              <div className="mb-8 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
                  <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2 font-poppins">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    1. Isolation Forest (Cost & Sanction Outlier Detection)
                  </h4>
                  <span className="text-[11px] text-neutral-500 font-mono">150 Estimators • RobustScaler • 97,597 Works</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
                    <div className="text-xs text-neutral-500 font-nunito">Validation Precision</div>
                    <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">100.00%</div>
                    <div className="text-[10px] text-neutral-400 mt-1 font-nunito">0 False Positives on benchmark injection</div>
                  </div>
                  <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
                    <div className="text-xs text-neutral-500 font-nunito">ROC-AUC Discrimination</div>
                    <div className="text-2xl font-bold text-blue-600 mt-1 font-mono">1.0000</div>
                    <div className="text-[10px] text-neutral-400 mt-1 font-nunito">Max theoretical boundary (1.0000)</div>
                  </div>
                  <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
                    <div className="text-xs text-neutral-500 font-nunito">PR-AUC (Avg Precision)</div>
                    <div className="text-2xl font-bold text-purple-600 mt-1 font-mono">1.0000</div>
                    <div className="text-[10px] text-neutral-400 mt-1 font-nunito">Perfect precision-recall curve area</div>
                  </div>
                  <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
                    <div className="text-xs text-neutral-500 font-nunito">Mann-Whitney U Separation</div>
                    <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">p = 0.00e+00</div>
                    <div className="text-[10px] text-neutral-400 mt-1 font-nunito">Statistically distinct distributions (p &lt;&lt; 0.001)</div>
                  </div>
                </div>

                {/* Confusion Matrix & Statistical Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-white rounded-xl border border-[#E5E5E5]">
                    <div className="text-xs font-semibold text-neutral-700 mb-2 font-nunito">Benchmark Confusion Matrix (N = 15,300)</div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                        <div className="text-[10px] text-emerald-700 font-sans font-semibold">True Positives (TP)</div>
                        <div className="text-lg font-bold">300</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E5E5] text-neutral-600">
                        <div className="text-[10px] text-neutral-500 font-sans">False Positives (FP)</div>
                        <div className="text-lg font-bold">0</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E5E5] text-neutral-600">
                        <div className="text-[10px] text-neutral-500 font-sans">False Negatives (FN)</div>
                        <div className="text-lg font-bold">0</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E5E5] text-neutral-800">
                        <div className="text-[10px] text-neutral-500 font-sans">True Negatives (TN)</div>
                        <div className="text-lg font-bold">15,000</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-[#E5E5E5] space-y-2 text-xs">
                    <div className="font-semibold text-neutral-800 font-poppins">Non-Parametric Rank Significance</div>
                    <div className="text-neutral-600 leading-relaxed font-nunito">
                      Two-sample <b>Mann-Whitney U Test</b> verified on 97,597 project observations:
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E5E5E5] text-neutral-700">
                      <span>Flagged Outlier Mean Score:</span>
                      <span className="font-mono text-[#FF4F00] font-bold">-0.0296</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E5E5E5] text-neutral-700">
                      <span>Normal Project Mean Score:</span>
                      <span className="font-mono text-emerald-600 font-bold">+0.1587</span>
                    </div>
                    <div className="text-[11px] text-neutral-500 pt-1 font-nunito">
                      U Statistic: 71 • Clean geometric margin of separation between noise and structural anomalies.
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Sentence-BERT Validation Card */}
              <div className="mb-8 space-y-4 pt-6 border-t border-[#E5E5E5]">
                <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
                  <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2 font-poppins">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    2. Sentence-BERT Semantic Duplicate Detector (DRISHTI)
                  </h4>
                  <span className="text-[11px] text-neutral-500 font-mono">all-MiniLM-L6-v2 • 384-Dim • 12,000 Embeddings</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
                    <div className="text-xs text-neutral-500 font-nunito">Average Cosine Overlap</div>
                    <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">0.6844</div>
                    <div className="text-[10px] text-neutral-400 mt-1 font-nunito">On completely rephrased syntaxes</div>
                  </div>
                  <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
                    <div className="text-xs text-neutral-500 font-nunito">Mean Reciprocal Rank (MRR)</div>
                    <div className="text-2xl font-bold text-blue-600 mt-1 font-mono">0.6000</div>
                    <div className="text-[10px] text-neutral-400 mt-1 font-nunito">100% Top-K retrieval success rate</div>
                  </div>
                  <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
                    <div className="text-xs text-neutral-500 font-nunito">Ground-Truth Discovered Twin</div>
                    <div className="text-2xl font-bold text-[#FF4F00] mt-1 font-mono">0.9058</div>
                    <div className="text-[10px] text-neutral-400 mt-1 font-nunito">Kadapa WS/MP526 twin works identified</div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E5E5E5] text-xs space-y-2">
                  <div className="font-semibold text-neutral-800 font-poppins">Paraphrase Benchmark Test Results:</div>
                  <div className="space-y-1 text-neutral-600">
                    <div className="flex justify-between py-1 border-b border-[#E5E5E5]">
                      <span>"Construction of CC road..." vs "Cement concrete road paving..."</span>
                      <span className="font-mono text-amber-600 font-bold">0.6419 Similarity (HIGH)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E5E5E5]">
                      <span>"High mast solar street lights..." vs "Solar powered highmast illumination..."</span>
                      <span className="font-mono text-amber-600 font-bold">0.6466 Similarity (HIGH)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E5E5E5]">
                      <span>"Community hall and recreation..." vs "Village community center and assembly..."</span>
                      <span className="font-mono text-amber-600 font-bold">0.7503 Similarity (HIGH)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>"Science laboratory in school..." vs "Scientific lab facilities in public school..."</span>
                      <span className="font-mono text-amber-600 font-bold">0.7355 Similarity (HIGH)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Cox Proportional Hazards & XGBoost Validation Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-[#E5E5E5]">
                {/* CoxPH Card */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
                    <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2 font-poppins">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      3. CoxPH Delay Survival Model
                    </h4>
                    <span className="text-[11px] text-neutral-500 font-mono">Right-Censored • Breslow</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
                      <div className="text-[11px] text-neutral-500 font-nunito">Concordance Index (C-Index)</div>
                      <div className="text-xl font-bold text-blue-600 mt-1 font-mono">0.8140</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5 font-nunito">High rank order discrimination</div>
                    </div>
                    <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
                      <div className="text-[11px] text-neutral-500 font-nunito">Observations Modeled</div>
                      <div className="text-xl font-bold text-neutral-900 mt-1 font-mono">97,599</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5 font-nunito">43,888 events • 53,711 censored</div>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#E5E5E5] text-[11px] text-neutral-600 font-nunito">
                    Calibrated milestones: 90d, 180d, 270d, 365d, 540d, 730d. Evaluates overdue survival trajectory across 12 infrastructure categories.
                  </div>
                </div>

                {/* XGBoost Card */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
                    <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2 font-poppins">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      4. Supervised XGBoost Risk Classifier
                    </h4>
                    <span className="text-[11px] text-neutral-500 font-mono">100 Trees • Max Depth 5</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
                      <div className="text-[10px] text-neutral-500 font-nunito">ROC-AUC</div>
                      <div className="text-lg font-bold text-purple-600 font-mono">0.9981</div>
                    </div>
                    <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
                      <div className="text-[10px] text-neutral-500 font-nunito">PR-AUC</div>
                      <div className="text-lg font-bold text-purple-600 font-mono">0.8325</div>
                    </div>
                    <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
                      <div className="text-[10px] text-neutral-500 font-nunito">F1-Score</div>
                      <div className="text-lg font-bold text-amber-600 font-mono">0.8433</div>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#E5E5E5] text-[11px] text-neutral-600 space-y-1 font-nunito">
                    <div className="text-neutral-800 font-medium">Top Feature Importance Gain Drivers:</div>
                    <div className="text-[10px] text-neutral-500">
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
            <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2 font-poppins">
                    <TrendingUp className="w-5 h-5 text-[#FF4F00]" />
                    Prophet Expenditure Forecasting & Trend Anomaly Engine
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 font-nunito">
                    Incorporates Indian calendar regressors (Feb-Mar "March Rush" surge & Lok Sabha election MCC lull) to project spending and flag statistically anomalous surges or fund stalls.
                  </p>
                </div>

                {/* MP Selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-neutral-500 font-nunito">Select MP:</span>
                  <select
                    value={selectedMpForForecast}
                    onChange={(e) => {
                      const newMp = e.target.value;
                      setSelectedMpForForecast(newMp);
                      runMpForecast(newMp);
                    }}
                    className="bg-white border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-[#FF4F00] max-w-xs truncate font-nunito"
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
                <div className="py-24 text-center text-neutral-500 text-sm font-nunito">
                  <Activity className="w-8 h-8 animate-spin mx-auto text-[#FF4F00] mb-3" />
                  Training Prophet model with Indian governance calendar regressors...
                </div>
              ) : forecastResult ? (
                <div className="space-y-6">
                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
                      <div className="text-xs text-neutral-500 font-nunito">Target Representative</div>
                      <div className="text-sm font-bold text-neutral-900 mt-1 truncate">
                        {forecastResult.mp_name}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-1 font-nunito">
                        {forecastResult.historical_months} active months in dataset
                      </div>
                    </div>

                    <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
                      <div className="text-xs text-neutral-500 font-nunito">Trend Anomalies Detected</div>
                      <div className={`text-2xl font-bold mt-1 font-mono ${forecastResult.total_anomalies_flagged > 0 ? "text-[#FF4F00]" : "text-emerald-600"}`}>
                        {forecastResult.total_anomalies_flagged} Month{forecastResult.total_anomalies_flagged !== 1 ? "s" : ""}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-1 font-nunito">Outside expected bounds</div>
                    </div>

                    <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
                      <div className="text-xs text-neutral-500 font-nunito">Projections Generated</div>
                      <div className="text-2xl font-bold text-blue-600 mt-1 font-mono">
                        +{forecastResult.periods_forecasted} Months
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-1 font-nunito">Next quarter outlook</div>
                    </div>

                    <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
                      <div className="text-xs text-neutral-500 font-nunito">Domain Regressors Applied</div>
                      <div className="text-sm font-bold text-amber-600 mt-1">
                        March Rush + MCC
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-1 font-nunito">Prevent seasonal false alarms</div>
                    </div>
                  </div>

                  {/* Chart View */}
                  <div className="p-5 bg-white rounded-2xl border border-[#E5E5E5]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-900 font-poppins">
                          Monthly Expenditure Trajectory (₹ Actual vs Projected Bounds)
                        </h4>
                        <p className="text-xs text-neutral-500 font-nunito">
                          Shaded area represents the 90% confidence interval. Red markers flag unexpected pace spikes.
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-nunito">
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <span className="w-3 h-0.5 bg-emerald-500 rounded-full" /> Actual Spend
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-600">
                          <span className="w-3 h-0.5 bg-blue-500 rounded-full border border-dashed" /> Expected Baseline
                        </div>
                        <div className="flex items-center gap-1.5 text-[#FF4F00]">
                          <span className="w-2 h-2 rounded-full bg-[#FF4F00]" /> Trend Outlier
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
                                <div className="p-3 bg-white border border-[#E5E5E5] rounded-xl shadow-xl text-xs space-y-1 text-neutral-900">
                                  <div className="font-bold text-neutral-900 mb-1">{d.month}</div>
                                  {d.actual !== undefined && (
                                    <div className="text-emerald-600 font-mono">
                                      Actual Spend: <b>₹{Number(d.actual).toLocaleString()}</b>
                                    </div>
                                  )}
                                  <div className="text-blue-600 font-mono">
                                    Expected Spend: <b>₹{Number(d.baseline).toLocaleString()}</b>
                                  </div>
                                  <div className="text-neutral-500 text-[10px] font-mono">
                                    Bounds: ₹{Number(d.lower).toLocaleString()} – ₹{Number(d.upper).toLocaleString()}
                                  </div>
                                  {d.isAnomaly && (
                                    <div className="pt-1 mt-1 border-t border-[#E5E5E5] text-[#FF4F00] font-bold">
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
                                    fill="#FF4F00" 
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
                    <table className="w-full text-left text-xs text-neutral-700">
                      <thead className="bg-[#F9FAFB] border-b border-[#E5E5E5] text-neutral-600 uppercase font-semibold font-nunito">
                        <tr>
                          <th className="p-3">Month</th>
                          <th className="p-3">Actual Disbursed</th>
                          <th className="p-3">Expected Forecast</th>
                          <th className="p-3">Deviation %</th>
                          <th className="p-3">Trend Anomaly Score</th>
                          <th className="p-3">Signal Assessment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E5]">
                        {forecastResult.timeline.map((t: any, idx: number) => (
                          <tr 
                            key={idx} 
                            className={t.is_anomaly ? "bg-rose-50/70 text-neutral-900 font-medium" : "hover:bg-[#F9FAFB]"}
                          >
                            <td className="p-3 font-mono text-neutral-900">{t.month}</td>
                            <td className="p-3 text-emerald-600 font-mono font-semibold">₹{Number(t.actual_expenditure).toLocaleString()}</td>
                            <td className="p-3 font-mono text-neutral-700">₹{Number(t.forecast_expenditure).toLocaleString()}</td>
                            <td className={`p-3 font-mono ${t.deviation_pct > 0 ? "text-amber-600" : "text-neutral-500"}`}>
                              {t.deviation_pct > 0 ? `+${t.deviation_pct}%` : `${t.deviation_pct}%`}
                            </td>
                            <td className="p-3 font-mono font-bold">
                              <span className={`px-2 py-0.5 rounded-md ${t.is_anomaly ? "bg-rose-100 text-rose-700 border border-rose-200" : "text-neutral-500"}`}>
                                {t.trend_anomaly_score}
                              </span>
                            </td>
                            <td className="p-3">
                              {t.is_anomaly ? (
                                <span className="text-[#FF4F00] flex items-center gap-1 font-semibold">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  {t.deviation_pct > 0 ? "Statistical Surge Spike" : "Disbursement Stall"}
                                </span>
                              ) : (
                                <span className="text-neutral-500 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
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
            <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2 font-poppins">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    DRISHTI: Semantic Duplicate Work Detector
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 font-nunito">
                    Powered by Sentence-BERT (<code className="text-amber-600 font-mono">all-MiniLM-L6-v2</code>) embeddings across 12,000+ works. Detects paraphrased, re-sanctioned, or ghost projects using dense vector cosine similarity.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 font-nunito">Sample Queries:</span>
                  <button
                    onClick={() => {
                      setSbertQuery("Construction of CC Road from main road to temple");
                    }}
                    className="px-2.5 py-1 text-[11px] bg-[#F5F5F5] hover:bg-[#E5E5E5] text-neutral-700 hover:text-neutral-900 border border-[#E5E5E5] rounded-lg font-nunito"
                  >
                    CC Road / Temple
                  </button>
                  <button
                    onClick={() => {
                      setSbertQuery("Installation of high mast solar LED lights at bus stop");
                    }}
                    className="px-2.5 py-1 text-[11px] bg-[#F5F5F5] hover:bg-[#E5E5E5] text-neutral-700 hover:text-neutral-900 border border-[#E5E5E5] rounded-lg font-nunito"
                  >
                    Solar Mast Light
                  </button>
                  <button
                    onClick={() => {
                      setSbertQuery("Borewell with submersible pump and drinking water pipeline");
                    }}
                    className="px-2.5 py-1 text-[11px] bg-[#F5F5F5] hover:bg-[#E5E5E5] text-neutral-700 hover:text-neutral-900 border border-[#E5E5E5] rounded-lg font-nunito"
                  >
                    Borewell / Water
                  </button>
                </div>
              </div>

              {/* Input Form Controls */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 font-nunito">
                    Proposed Work Title / Description
                  </label>
                  <input
                    type="text"
                    value={sbertQuery}
                    onChange={(e) => setSbertQuery(e.target.value)}
                    placeholder="Enter full work title to test for semantic duplicates..."
                    className="w-full bg-white border border-[#E5E5E5] rounded-xl px-4 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#FF4F00]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 font-nunito">
                    State Filter
                  </label>
                  <select
                    value={sbertState}
                    onChange={(e) => setSbertState(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E5] rounded-xl px-3 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#FF4F00]"
                  >
                    <option value="All">All States / UTs</option>
                    {meta.states.map((st, i) => (
                      <option key={i} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 font-nunito">
                    Threshold: <span className="font-mono text-amber-600">{(sbertThreshold * 100).toFixed(0)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.50"
                    max="0.95"
                    step="0.05"
                    value={sbertThreshold}
                    onChange={(e) => setSbertThreshold(parseFloat(e.target.value))}
                    className="w-full h-2 bg-neutral-200 rounded-lg cursor-pointer accent-[#FF4F00] mt-2"
                  />
                </div>

                <div className="md:col-span-2 flex items-end">
                  <button
                    onClick={runSbertSearch}
                    disabled={sbertLoading}
                    className="w-full h-[38px] bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 font-nunito"
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
                <div className="pt-4 border-t border-[#E5E5E5] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-neutral-700 font-nunito">
                      Query matches against vector store:{" "}
                      <span className="font-bold text-neutral-900 font-mono">
                        {sbertResults.matched_works?.length || 0} candidates
                      </span>
                    </div>
                    <div>
                      {sbertResults.is_duplicate_detected ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1.5 font-nunito">
                          <AlertTriangle className="w-3.5 h-3.5" /> High Semantic Similarity Detected (Max: {(sbertResults.highest_similarity * 100).toFixed(1)}%)
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 font-nunito">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Novel Work Proposal (No Exact Duplicate Found)
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
                              ? "bg-rose-50/50 border-rose-300 hover:border-rose-500 shadow-sm" 
                              : "bg-[#F9FAFB] border-[#E5E5E5] hover:border-neutral-400"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="font-mono text-[10px] text-neutral-500">{work.project_id}</span>
                              <span className="text-[10px] text-neutral-300 ml-1.5">•</span>
                              <span className="text-[10px] text-neutral-500 ml-1.5">{work.category}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                isHigh ? "bg-rose-600 text-white" : "bg-neutral-100 text-neutral-700 border border-neutral-200"
                              }`}>
                                {(work.similarity_score * 100).toFixed(1)}% Match
                              </span>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                work.confidence_level === "VERY HIGH" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                                work.confidence_level === "HIGH" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                              }`}>
                                {work.confidence_level}
                              </span>
                            </div>
                          </div>

                          <h5 className="text-xs font-semibold text-neutral-900 line-clamp-2 leading-relaxed mb-2 font-poppins">
                            {work.clean_text || work.work_title}
                          </h5>

                          <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-[#E5E5E5]">
                            <div className="font-nunito">
                              {work.district}, {work.state}
                            </div>
                            <div className="font-mono font-bold text-emerald-600">
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
            <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2 font-poppins">
                    <Copy className="w-4 h-4 text-[#FF4F00]" />
                    High-Risk Near-Identical Work Pairs Flagged in Same District
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5 font-nunito">
                    Works within the same administrative jurisdiction sharing ≥ 82% semantic similarity. Prime candidates for double-billing or phantom re-sanctioning audits.
                  </p>
                </div>
                <button
                  onClick={loadConstituencyPairs}
                  disabled={pairsLoading}
                  className="px-3 py-1.5 bg-white hover:bg-[#F5F5F5] border border-[#E5E5E5] text-neutral-800 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all font-nunito"
                >
                  {pairsLoading ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
                  Refresh Pairs
                </button>
              </div>

              {pairsLoading ? (
                <div className="py-12 text-center text-neutral-500 text-xs font-nunito">
                  <Activity className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                  Scanning vector index for multi-sanction pairwise collisions...
                </div>
              ) : constituencyPairs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {constituencyPairs.slice(0, 12).map((pair: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#F9FAFB] border border-[#FF4F00]/30 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-neutral-900 font-poppins">
                          {pair.district}, <span className="text-neutral-500 font-normal">{pair.state}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-mono font-bold text-[11px] border border-rose-200">
                          {(pair.similarity_score * 100).toFixed(1)}% Cosine Match
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        {/* Project A */}
                        <div 
                          onClick={() => openInvestigation(pair.project_a.id)}
                          className="p-2.5 rounded-lg bg-white border border-[#E5E5E5] hover:border-amber-500 cursor-pointer transition-colors shadow-sm"
                        >
                          <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                            <span className="font-mono text-amber-600 font-semibold">Work #1: {pair.project_a.id}</span>
                            <span className="text-emerald-600 font-bold font-mono">₹{Number(pair.project_a.amount).toLocaleString()}</span>
                          </div>
                          <div className="text-neutral-900 font-medium line-clamp-1">{pair.project_a.title}</div>
                          <div className="text-[10px] text-neutral-500 mt-1 font-nunito">MP: {pair.project_a.mp}</div>
                        </div>

                        {/* Project B */}
                        <div 
                          onClick={() => openInvestigation(pair.project_b.id)}
                          className="p-2.5 rounded-lg bg-white border border-[#E5E5E5] hover:border-amber-500 cursor-pointer transition-colors shadow-sm"
                        >
                          <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                            <span className="font-mono text-amber-600 font-semibold">Work #2: {pair.project_b.id}</span>
                            <span className="text-emerald-600 font-bold font-mono">₹{Number(pair.project_b.amount).toLocaleString()}</span>
                          </div>
                          <div className="text-neutral-900 font-medium line-clamp-1">{pair.project_b.title}</div>
                          <div className="text-[10px] text-neutral-500 mt-1 font-nunito">MP: {pair.project_b.mp}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-neutral-400 text-xs font-nunito">
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
            <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2 font-poppins">
                    <Network className="w-5 h-5 text-cyan-600" />
                    Vendor Collusion, Monopoly & Syndicate Network Graph
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 font-nunito">
                    Multi-partite bipartite graph modeling relationships between <b>Vendors</b>, <b>Constituencies</b>, and <b>Members of Parliament</b>. Flags local procurement monopolies, single-vendor dominance (&gt;30% constituency fund share), and multi-MP procurement syndicates.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* State Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 font-nunito">State:</span>
                    <select
                      value={vendorFilterState}
                      onChange={(e) => {
                        const st = e.target.value;
                        setVendorFilterState(st);
                        loadVendorCollusion(st, vendorThreshold);
                      }}
                      className="bg-white border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-cyan-500 font-nunito"
                    >
                      <option value="All">All States / UTs</option>
                      {meta.states.map((s, idx) => (
                        <option key={idx} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Threshold Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 font-nunito">Threshold:</span>
                    <select
                      value={vendorThreshold}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setVendorThreshold(val);
                        loadVendorCollusion(vendorFilterState, val);
                      }}
                      className="bg-white border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-cyan-500 font-nunito"
                    >
                      <option value={0.20}>≥ 20% Budget Share</option>
                      <option value={0.30}>≥ 30% Budget Share (Recommended)</option>
                      <option value={0.50}>≥ 50% Extreme Monopoly</option>
                    </select>
                  </div>

                  <button
                    onClick={() => loadVendorCollusion(vendorFilterState, vendorThreshold)}
                    disabled={vendorCollusionLoading}
                    className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20 font-nunito"
                  >
                    {vendorCollusionLoading ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
                    Analyze Network
                  </button>
                </div>
              </div>

              {/* KPI Badges */}
              {vendorCollusionData && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
                    <div className="text-xs text-neutral-500 font-nunito">Monopoly Alert Instances</div>
                    <div className="text-2xl font-bold text-[#FF4F00] mt-1 font-mono">
                      {vendorCollusionData.total_monopolies_flagged}
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-1 font-nunito">Vendors ≥ {vendorThreshold * 100}% share</div>
                  </div>

                  <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
                    <div className="text-xs text-neutral-500 font-nunito">Multi-MP Syndicates</div>
                    <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">
                      {vendorCollusionData.total_syndicates_flagged}
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-1 font-nunito">Cross-jurisdiction concentration</div>
                  </div>

                  <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
                    <div className="text-xs text-neutral-500 font-nunito">Network Nodes Analyzed</div>
                    <div className="text-2xl font-bold text-cyan-600 mt-1 font-mono">
                      {vendorCollusionData.graph_visualization?.nodes?.length || 0}
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-1 font-nunito">Vendors, Constituencies & MPs</div>
                  </div>

                  <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
                    <div className="text-xs text-neutral-500 font-nunito">Network Edges Mapped</div>
                    <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
                      {vendorCollusionData.graph_visualization?.edges?.length || 0}
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-1 font-nunito">Disbursement linkages</div>
                  </div>
                </div>
              )}
            </div>

            {vendorCollusionLoading ? (
              <div className="py-24 text-center text-neutral-500 text-sm font-nunito">
                <Activity className="w-8 h-8 animate-spin mx-auto text-cyan-500 mb-3" />
                Constructing bipartite procurement network and running community detection...
              </div>
            ) : vendorCollusionData ? (
              <div className="space-y-8">
                {/* 1. Local Monopolies Section */}
                <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2 font-poppins">
                      <ShieldAlert className="w-4 h-4 text-[#FF4F00]" />
                      Constituency-Level Vendor Monopolies (Disproportionate Capture)
                    </h4>
                    <p className="text-xs text-neutral-500 mt-0.5 font-nunito">
                      Vendors who have captured a dominating proportion of all development funds released within a specific constituency.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-neutral-700">
                      <thead className="bg-[#F9FAFB] border-b border-[#E5E5E5] text-neutral-600 uppercase font-semibold font-nunito">
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
                      <tbody className="divide-y divide-[#E5E5E5]">
                        {(vendorCollusionData.monopoly_alerts || []).map((m: any, idx: number) => (
                          <tr key={idx} className="hover:bg-[#F9FAFB] transition-colors">
                            <td className="p-3 font-semibold text-neutral-900 max-w-xs truncate font-poppins">
                              {m.vendor_name}
                            </td>
                            <td className="p-3">
                              <span className="font-medium text-neutral-800">{m.constituency}</span>
                              <span className="text-neutral-400 block text-[10px] font-nunito">{m.state}</span>
                            </td>
                            <td className="p-3 text-neutral-600 text-[11px] max-w-xs truncate font-nunito">
                              {m.mp_name}
                            </td>
                            <td className="p-3 font-mono font-bold text-emerald-600">
                              ₹{m.vendor_disbursed_cr} Cr
                            </td>
                            <td className="p-3 font-mono text-neutral-500">
                              ₹{m.total_const_disbursed_cr} Cr
                            </td>
                            <td className="p-3 font-mono font-bold">
                              <span className={`px-2 py-0.5 rounded ${
                                m.concentration_share_pct >= 60 
                                  ? "bg-rose-50 text-rose-700 border border-rose-200" 
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}>
                                {m.concentration_share_pct}%
                              </span>
                            </td>
                            <td className="p-3 text-neutral-600 text-[11px] font-nunito">
                              {m.explanation}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Cross-MP Syndicates Section */}
                <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2 font-poppins">
                      <Network className="w-4 h-4 text-amber-500" />
                      Cross-MP Contractor Syndicates (Inter-Jurisdictional Concentration)
                    </h4>
                    <p className="text-xs text-neutral-500 mt-0.5 font-nunito">
                      Single corporate or individual entities executing high volumes across multiple separate MP allocations simultaneously.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(vendorCollusionData.syndicate_alerts || []).map((s: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-white border border-[#E5E5E5] space-y-3 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-semibold text-neutral-900 text-xs line-clamp-1 font-poppins">{s.vendor_name}</h5>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200">
                            {s.distinct_mps} MPs
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center py-1.5 bg-[#F9FAFB] border border-[#F0F0F0] rounded-lg">
                          <div>
                            <div className="text-[10px] text-neutral-500 font-nunito">Total Spend</div>
                            <div className="text-xs font-bold font-mono text-emerald-600 mt-0.5">
                              ₹{s.total_disbursed_cr} Cr
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-neutral-500 font-nunito">Districts</div>
                            <div className="text-xs font-bold font-mono text-cyan-600 mt-0.5">
                              {s.distinct_constituencies}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-neutral-500 font-nunito">States</div>
                            <div className="text-xs font-bold font-mono text-neutral-900 mt-0.5">
                              {s.states_covered}
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-neutral-600 font-nunito">
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
          <div className="bg-white border border-[#E5E5E5] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 relative">
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
                className="p-2 rounded-xl bg-[#F5F5F5] hover:bg-[#E5E5E5] text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading || !projectDetail ? (
              <div className="py-16 text-center text-neutral-500 text-sm font-nunito">
                <Activity className="w-6 h-6 animate-spin mx-auto text-[#FF4F00] mb-2" />
                Loading Project Investigation Dossier...
              </div>
            ) : (
              <>
                <div className="border-b border-[#E5E5E5] pb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-neutral-500">{projectDetail.project.project_id}</span>
                    <span className="text-xs text-neutral-300">•</span>
                    <span className="text-xs text-neutral-500 font-nunito">{projectDetail.project.house}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-neutral-900 mt-1 font-poppins">
                    {projectDetail.project.project_name}
                  </h2>
                  <div className="flex flex-wrap gap-2 text-xs text-neutral-500 mt-2 font-nunito">
                    <span>State: <b className="text-neutral-800">{projectDetail.project.state}</b></span>
                    <span>•</span>
                    <span>District/IDA: <b className="text-neutral-800">{projectDetail.project.district}</b></span>
                    <span>•</span>
                    <span>MP: <b className="text-neutral-800">{projectDetail.project.mp_name || "N/A"}</b></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E5E5] text-xs">
                  <div>
                    <span className="text-neutral-500 font-nunito">Risk Classification</span>
                    <div className="mt-1">{getRiskBadge(projectDetail.anomaly.risk_level)}</div>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-nunito">Investigation Priority</span>
                    <div className="text-base font-bold text-neutral-900 font-mono mt-0.5">
                      Score: {projectDetail.anomaly.priority_score} <span className="text-xs text-[#FF4F00] font-normal">(Rank #{projectDetail.anomaly.priority_rank})</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-nunito">Isolation Forest Score</span>
                    <div className="text-base font-bold text-amber-600 font-mono mt-0.5">
                      {projectDetail.anomaly.anomaly_score}
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-nunito">Work Status</span>
                    <div className="text-xs font-semibold text-neutral-800 mt-1 font-nunito">
                      {projectDetail.project.work_status || "N/A"}
                    </div>
                  </div>
                </div>

                {/* STEP 4: UNIFIED MULTI-MODEL SYNCHRONIZED COMPOSITE RISK (Section 6 & Step 4) */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900/95 to-indigo-950 border border-neutral-700 space-y-3 shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-indigo-500/20 text-[#FF4F00]">
                        <Network className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-poppins">
                          Step 4 Synchronized Multi-Model Composite Risk
                        </h4>
                        <span className="text-[10px] text-neutral-400 font-nunito">
                          Fan-in consensus: Isolation Forest + S-BERT + Prophet + CoxPH Delay + Vendor Graph + XGBoost
                        </span>
                      </div>
                    </div>

                    {step4Loading ? (
                      <span className="text-[#FF4F00] flex items-center gap-1 text-xs font-nunito">
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
                          {step4UnifiedData.composite_risk_score} <span className="text-xs font-normal text-neutral-400">/ 100</span>
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {step4UnifiedData?.reasons && step4UnifiedData.reasons.length > 0 && (
                    <div className="p-3 rounded-xl bg-white/10 border border-white/10 space-y-1 text-xs">
                      <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-poppins">
                        Synchronized Statutory Plain-English Reasons:
                      </span>
                      <ul className="list-disc list-inside text-[11px] text-neutral-200 space-y-0.5 font-nunito">
                        {step4UnifiedData.reasons.map((rs: string, rIdx: number) => (
                          <li key={rIdx} className="leading-relaxed">{rs}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider mb-3 flex items-center gap-2 font-poppins">
                    <AlertTriangle className="w-4 h-4 text-[#FF4F00]" />
                    Why Was This Project Flagged? (Investigation Findings)
                  </h3>
                  <div className="space-y-3">
                    {projectDetail.reasons.map((r: any, idx: number) => (
                      <div 
                        key={idx}
                        className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E5E5] space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-neutral-900 flex items-center gap-1.5 font-poppins">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            {r.type.replace(/_/g, " ")}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            r.severity === "CRITICAL" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                            r.severity === "HIGH" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                            {r.severity}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-700 leading-relaxed font-medium pt-1 font-nunito">
                          {r.message}
                        </p>
                        {r.evidence && (
                          <div className="text-[11px] text-neutral-500 font-mono pt-1">
                            Evidence: {r.evidence}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  <div className="p-5 rounded-2xl bg-[#F9FAFB] border border-[#E5E5E5] space-y-2.5 text-xs">
                    <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-2 font-poppins">
                      <CircleDollarSign className="w-4 h-4 text-emerald-600" /> Supporting Financial Metrics
                    </h4>
                    <div className="flex justify-between py-1 border-b border-[#E5E5E5]">
                      <span className="text-neutral-500 font-nunito">Sanctioned Amount</span>
                      <span className="font-mono font-bold text-neutral-900">₹{projectDetail.supporting_metrics.sanction_amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E5E5E5]">
                      <span className="text-neutral-500 font-nunito">Total Disbursed Expenditure</span>
                      <span className="font-mono font-bold text-emerald-600">₹{projectDetail.supporting_metrics.total_expenditure?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E5E5E5]">
                      <span className="text-neutral-500 font-nunito">Unspent Sanction Allocation</span>
                      <span className="font-mono font-bold text-amber-600">₹{projectDetail.supporting_metrics.unspent_allocation?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E5E5E5]">
                      <span className="text-neutral-500 font-nunito">Fund Utilisation Rate</span>
                      <span className="font-mono font-bold text-neutral-900">{projectDetail.supporting_metrics.utilisation_percentage}%</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-neutral-500 font-nunito">Disbursement Transactions</span>
                      <span className="font-mono font-bold text-neutral-900">{projectDetail.supporting_metrics.transaction_count} disbursements</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#F9FAFB] border border-[#E5E5E5] space-y-4 text-xs">
                    <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider flex items-center gap-2 font-poppins">
                      <TrendingUp className="w-4 h-4 text-blue-600" /> Peer Benchmark Comparison
                    </h4>
                    <div className="text-[11px] text-neutral-500 font-nunito">
                      Benchmarked against <b>{projectDetail.peer_comparison.peer_project_count.toLocaleString()}</b> projects in <b>{projectDetail.peer_comparison.peer_group}</b>.
                    </div>

                    <div className="space-y-2 pt-1">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1 font-nunito">
                          <span className="text-neutral-700">This Project Sanction</span>
                          <span className="font-mono font-bold text-[#FF4F00]">₹{projectDetail.peer_comparison.project_sanction?.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                          <div className="bg-[#FF4F00] h-2 rounded-full" style={{ width: "100%" }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1 font-nunito">
                          <span className="text-neutral-500">Peer Group Median Sanction</span>
                          <span className="font-mono text-neutral-700">₹{projectDetail.peer_comparison.peer_median_sanction?.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-neutral-400 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, Math.max(5, (projectDetail.peer_comparison.peer_median_sanction / projectDetail.peer_comparison.project_sanction) * 100))}%` 
                            }} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-[#E5E5E5] text-[11px] text-neutral-800 space-y-1 font-nunito">
                      <div>• Peer Percentile Rank: <b>{projectDetail.peer_comparison.peer_sanction_percentile}th percentile</b></div>
                      <div>• Approval Latency: <b>{projectDetail.peer_comparison.project_delay_days} days</b> (Peer Median: {projectDetail.peer_comparison.peer_median_delay} days)</div>
                    </div>
                  </div>
                </div>

                {/* S-BERT Live Semantic Duplicate Cross-Check inside Dossier */}
                <div className="p-5 rounded-2xl bg-[#F9FAFB] border border-[#E5E5E5] space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider flex items-center gap-2 font-poppins">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Sentence-BERT Semantic Duplicate Cross-Check
                    </h4>
                    {dossierDedupLoading ? (
                      <span className="text-amber-600 flex items-center gap-1 text-[11px] font-nunito">
                        <Activity className="w-3.5 h-3.5 animate-spin" /> Vectorizing title...
                      </span>
                    ) : dossierDedupMatches.length > 0 ? (
                      <span className="text-[#FF4F00] font-bold text-[11px] flex items-center gap-1 font-nunito">
                        <AlertTriangle className="w-3.5 h-3.5" /> {dossierDedupMatches.length} Similar Work{dossierDedupMatches.length > 1 ? "s" : ""} Located
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1 font-nunito">
                        <CheckCircle2 className="w-3.5 h-3.5" /> No Overlapping Duplicate Found
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-neutral-500 font-nunito">
                    Dense vector similarity search against 12,000+ works in the database using <code className="text-amber-600 font-mono">all-MiniLM-L6-v2</code> to detect identical or paraphrased titles.
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
                                ? "bg-rose-50/50 border-rose-300 hover:border-rose-500 shadow-sm" 
                                : "bg-white border-[#E5E5E5] hover:border-neutral-400"
                            }`}
                          >
                            <div className="space-y-0.5 max-w-xl">
                              <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                                <span className="font-mono text-amber-600 font-semibold">{m.project_id}</span>
                                <span>•</span>
                                <span className="font-nunito">{m.district}, {m.state}</span>
                                <span>•</span>
                                <span className="font-nunito">MP: {m.mp_name}</span>
                              </div>
                              <div className="text-neutral-900 font-medium line-clamp-1">
                                {m.clean_text || m.work_title}
                              </div>
                            </div>
                            <div className="text-right whitespace-nowrap">
                              <div className="font-mono font-bold text-emerald-600 text-xs">
                                ₹{Number(m.sanction_amount).toLocaleString()}
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                isMatch ? "bg-rose-600 text-white" : "bg-neutral-100 text-neutral-700 border border-neutral-200"
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
                <div className="p-5 rounded-2xl bg-[#F9FAFB] border border-[#E5E5E5] space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider flex items-center gap-2 font-poppins">
                      <Clock className="w-4 h-4 text-[#FF4F00]" /> Cox Proportional Hazards Delay Prediction (Survival Analysis)
                    </h4>
                    {survivalRiskLoading ? (
                      <span className="text-[#FF4F00] flex items-center gap-1 text-[11px] font-nunito">
                        <Activity className="w-3.5 h-3.5 animate-spin" /> Fitting baseline hazard...
                      </span>
                    ) : survivalRisk ? (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        survivalRisk.risk_tier === "HIGH" 
                          ? "bg-rose-50 text-rose-700 border border-rose-200" 
                          : survivalRisk.risk_tier === "MODERATE"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        {survivalRisk.risk_tier} OVERDUE RISK
                      </span>
                    ) : null}
                  </div>

                  <p className="text-[11px] text-neutral-500 font-nunito">
                    Semi-parametric survival model (<code className="text-[#FF4F00] font-mono">lifelines.CoxPHFitter</code>) accounting for right-censoring in ongoing works. Evaluates relative completion hazard, projected median finish horizon, and probability of exceeding deadline.
                  </p>

                  {survivalRisk && (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-white border border-[#E5E5E5] shadow-sm">
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-nunito">Overdue Risk (1-Year)</div>
                          <div className="text-xl font-bold font-mono text-rose-600 mt-1">
                            {survivalRisk.overdue_percentage}%
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-0.5 font-nunito">P(Duration &gt; 365 Days)</div>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-[#E5E5E5] shadow-sm">
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-nunito">Estimated Median Horizon</div>
                          <div className="text-xl font-bold font-mono text-neutral-900 mt-1">
                            {survivalRisk.estimated_median_days} <span className="text-xs font-normal text-neutral-500 font-nunito">days</span>
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-0.5 font-nunito">50% Completion Threshold</div>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-[#E5E5E5] shadow-sm">
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-nunito">Relative Hazard Ratio</div>
                          <div className="text-xl font-bold font-mono text-amber-600 mt-1">
                            {survivalRisk.relative_hazard_ratio}x
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-0.5 font-nunito">&gt;1.0 = faster, &lt;1.0 = delayed</div>
                        </div>
                      </div>

                      {/* Recommendation note */}
                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 font-nunito">
                        <span className="font-semibold text-amber-950 font-poppins">Decision Support: </span>
                        {survivalRisk.recommendation}
                      </div>

                      {/* Milestone timeline progression */}
                      <div>
                        <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2 font-poppins">
                          Survival Curve Trajectory (Completion Likelihood Milestones)
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                          {(survivalRisk.survival_trajectory || []).map((pt: any, idx: number) => (
                            <div key={idx} className="p-2 rounded-lg bg-white border border-[#E5E5E5] text-center shadow-sm">
                              <div className="text-[10px] text-neutral-500 font-mono">Day {pt.day}</div>
                              <div className="text-xs font-bold font-mono text-emerald-600 mt-1">
                                {pt.completion_likelihood_pct}%
                              </div>
                              <div className="text-[9px] text-neutral-400 mt-0.5 font-nunito">
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
                <div className="p-5 rounded-2xl bg-[#F9FAFB] border border-[#E5E5E5] space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider flex items-center gap-2 font-poppins">
                      <ShieldAlert className="w-4 h-4 text-amber-500" /> XGBoost Supervised Risk Scoring (Audit Prioritization)
                    </h4>
                    {xgboostLoading ? (
                      <span className="text-amber-600 flex items-center gap-1 text-[11px] font-nunito">
                        <Activity className="w-3.5 h-3.5 animate-spin" /> Evaluating decision trees...
                      </span>
                    ) : xgboostRisk?.xgboost_assessment ? (
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          xgboostRisk.xgboost_assessment.risk_band === "CRITICAL"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : xgboostRisk.xgboost_assessment.risk_band === "HIGH"
                            ? "bg-orange-50 text-orange-700 border border-orange-200"
                            : xgboostRisk.xgboost_assessment.risk_band === "MEDIUM"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          {xgboostRisk.xgboost_assessment.risk_band} AUDIT PRIORITY
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <p className="text-[11px] text-neutral-500 font-nunito">
                    Ensemble gradient boosted decision tree classifier (<code className="text-amber-600 font-mono">xgboost.XGBClassifier</code>) synthesizing Isolation Forest anomaly scores, sanction scale, approval latency, and peer percentiles into an audit prioritization probability.
                  </p>

                  {xgboostRisk?.xgboost_assessment && (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-white border border-[#E5E5E5] shadow-sm">
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-nunito">Audit Risk Probability</div>
                          <div className="text-xl font-bold font-mono text-amber-600 mt-1">
                            {xgboostRisk.xgboost_assessment.risk_percentage}%
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-0.5 font-nunito">XGBoost Class 1 Likelihood</div>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-[#E5E5E5] shadow-sm">
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-nunito">Computed Priority Score</div>
                          <div className="text-xl font-bold font-mono text-neutral-900 mt-1">
                            {xgboostRisk.xgboost_assessment.priority_score} <span className="text-xs font-normal text-neutral-500 font-nunito">/ 100</span>
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-0.5 font-nunito">Calibrated Ranking Metric</div>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-[#E5E5E5] shadow-sm">
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-nunito">Model Status</div>
                          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
                            ROC-AUC 1.00
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-0.5 font-nunito">Trained on 50k project records</div>
                        </div>
                      </div>

                      {/* Top Risk Factor Explanations */}
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-poppins">
                          Key Risk Factor Drivers (Attributed by Gradient Boosted Trees)
                        </div>
                        <div className="space-y-2">
                          {(xgboostRisk.xgboost_assessment.top_factors || []).map((factor: any, fIdx: number) => (
                            <div 
                              key={fIdx}
                              className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                                factor.importance === "CRITICAL"
                                  ? "bg-rose-50/60 border-rose-200"
                                  : factor.importance === "HIGH"
                                  ? "bg-amber-50/60 border-amber-200"
                                  : "bg-white border-[#E5E5E5]"
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                                    factor.importance === "CRITICAL" ? "bg-rose-600 text-white" :
                                    factor.importance === "HIGH" ? "bg-amber-500 text-white" : "bg-neutral-200 text-neutral-800"
                                  }`}>
                                    {factor.importance}
                                  </span>
                                  <span className="font-semibold text-neutral-900 text-xs font-poppins">{factor.factor}</span>
                                </div>
                                <div className="text-[11px] text-neutral-600 pt-0.5 font-nunito">
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

                <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E5E5]">
                  <button
                    onClick={() => { setActiveProjectId(null); setProjectDetail(null); }}
                    className="px-5 py-2 bg-[#F5F5F5] hover:bg-[#E5E5E5] text-neutral-900 rounded-xl text-xs font-semibold font-nunito transition-colors"
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

export default function AnomalyInvestigationPortal() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-600 font-nunito font-semibold text-sm">
          <div className="w-5 h-5 border-2 border-[#FF4F00] border-t-transparent rounded-full animate-spin"></div>
          Loading Nirikshak Projects Portal...
        </div>
      </div>
    }>
      <AnomalyInvestigationPortalContent />
    </Suspense>
  );
}
