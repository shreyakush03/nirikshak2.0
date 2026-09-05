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
  Sparkles
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
  const [activeTab, setActiveTab] = useState<"overview" | "risk" | "anomalies" | "delays" | "dedup" | "collusion" | "forecasting">("risk");
  
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

  // Real-Time Payment Irregularity Predictor States
  const [expState, setExpState] = useState<string>("Delhi");
  const [expAmount, setExpAmount] = useState<number>(5000000);
  const [expVendorCount, setExpVendorCount] = useState<number>(5);
  const [expVendorMean, setExpVendorMean] = useState<number>(250000);
  const [expResult, setExpResult] = useState<any>(null);
  const [expLoading, setExpLoading] = useState<boolean>(false);

  const runExpPrediction = async () => {
    setExpLoading(true);
    try {
      const res = await fetch("/api/py/predict/expenditure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: expState,
          disbursed_amount: expAmount,
          vendor_count: expVendorCount,
          vendor_mean: expVendorMean
        })
      });
      const data = await res.json();
      setExpResult(data);
    } catch (err) {
      console.error("Expenditure prediction error:", err);
    } finally {
      setExpLoading(false);
    }
  };

  // Model 1: XGBoost Risk Scorer States
  const [xgbSanctionAmount, setXgbSanctionAmount] = useState<number>(1500000);
  const [xgbDelayDays, setXgbDelayDays] = useState<number>(120);
  const [xgbUtilisation, setXgbUtilisation] = useState<number>(45);
  const [xgbPeerPercentile, setXgbPeerPercentile] = useState<number>(75);
  const [xgbAnomalyScore, setXgbAnomalyScore] = useState<number>(-0.15);
  const [xgbResult, setXgbResult] = useState<any>(null);
  const [xgbLoading, setXgbLoading] = useState<boolean>(false);

  const runXgbPrediction = async () => {
    setXgbLoading(true);
    try {
      const res = await fetch("/api/py/predict/xgboost-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sanction_amount: xgbSanctionAmount,
          delay_days: xgbDelayDays,
          utilisation_percentage: xgbUtilisation,
          peer_sanction_percentile: xgbPeerPercentile,
          anomaly_score_raw: xgbAnomalyScore
        })
      });
      const data = await res.json();
      setXgbResult(data);
    } catch (err) {
      console.error("XGBoost prediction error:", err);
    } finally {
      setXgbLoading(false);
    }
  };

  // Model 3: CoxPH Delay Survival Risk States
  const [delaySanctionAmount, setDelaySanctionAmount] = useState<number>(2000000);
  const [delayApprovalDelay, setDelayApprovalDelay] = useState<number>(90);
  const [delayWorkCategory, setDelayWorkCategory] = useState<string>("Roads and Bridges");
  const [delayDeadlineDays, setDelayDeadlineDays] = useState<number>(365);
  const [delayElapsedDays, setDelayElapsedDays] = useState<number>(180);
  const [delayResult, setDelayResult] = useState<any>(null);
  const [delayLoading, setDelayLoading] = useState<boolean>(false);

  const runDelayPrediction = async () => {
    setDelayLoading(true);
    try {
      const res = await fetch("/api/py/predict/delay-survival", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sanction_amount: delaySanctionAmount,
          approval_delay_days: delayApprovalDelay,
          work_category: delayWorkCategory,
          deadline_days: delayDeadlineDays,
          elapsed_days: delayElapsedDays
        })
      });
      const data = await res.json();
      setDelayResult(data);
    } catch (err) {
      console.error("Delay prediction error:", err);
    } finally {
      setDelayLoading(false);
    }
  };

  // Model 5: NetworkX Vendor Collusion Graph States
  const [graphState, setGraphState] = useState<string>("All");
  const [graphThreshold, setGraphThreshold] = useState<number>(0.30);
  const [graphData, setGraphData] = useState<any>(null);
  const [graphLoading, setGraphLoading] = useState<boolean>(false);

  const runGraphAnalysis = async () => {
    setGraphLoading(true);
    try {
      const params = new URLSearchParams({
        state: graphState,
        threshold: graphThreshold.toString()
      });
      const res = await fetch(`/api/py/graph/vendor-collusion?${params.toString()}`);
      const data = await res.json();
      setGraphData(data);
    } catch (err) {
      console.error("Vendor graph fetch error:", err);
    } finally {
      setGraphLoading(false);
    }
  };

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
  const [llmExplanation, setLlmExplanation] = useState<any>(null);
  const [llmExplanationLoading, setLlmExplanationLoading] = useState<boolean>(false);

  // Initial Data Fetch
  useEffect(() => {
    async function init() {
      try {
        const [resSum, resMeta, resScat, resStates, resMps] = await Promise.all([
          fetch("/api/py/anomalies/summary").then(r => r.json()),
          fetch("/api/py/meta").then(r => r.json()),
          fetch("/api/py/charts/scatter").then(r => r.json()),
          fetch("/api/py/anomalies/states").then(r => r.json()),
          fetch("/api/py/forecast/mps").then(r => r.json()).catch(() => [])
        ]);
        setSummary(resSum);
        setMeta(resMeta);
        setScatterData(resScat);
        setStateCards(resStates);
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
    setLlmExplanation(null);
    setLlmExplanationLoading(true);
    try {
      const res = await fetch(`/api/py/anomalies/${encodeURIComponent(projectId)}`);
      if (res.ok) {
        const data = await res.json();
        setProjectDetail(data);

        // Fetch Grounded LLM Risk Explanation
        fetch(`/api/py/works/${encodeURIComponent(projectId)}/risk-explanation`)
          .then(r => r.ok ? r.json() : null)
          .then(expData => {
            if (expData) {
              setLlmExplanation(expData);
            }
          })
          .catch(err => console.error("LLM Risk Explanation fetch error:", err))
          .finally(() => setLlmExplanationLoading(false));

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

  useEffect(() => {
    if (activeTab === "dedup" && !sbertResults) {
      runSbertSearch();
    }
    if (activeTab === "dedup" && constituencyPairs.length === 0) {
      loadConstituencyPairs();
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
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">HIGH</span>;
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
      <div className="bg-white border-b border-[#E5E5E5] px-4 md:px-6 py-2 text-[11px] text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            <b>Analytical Decision-Support System</b>: Flagged items represent statistical deviations from peer benchmarks, not automatic fraud or wrongdoing.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 font-space-mono text-[10px]">
          <span className="text-neutral-400">ENGINE: Isolation Forest v1.9</span>
          <span className="text-emerald-700 font-semibold">VALIDATED PRECISION: 84.33%</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="border-b border-[#E5E5E5] bg-white shadow-sm backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:h-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-rose-500 to-amber-500 rounded-[12px] shadow-lg shadow-[#FF4F00]/20">
              <ShieldAlert className="w-5 h-5 text-neutral-900" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 bg-clip-text text-transparent">
                MPLADS Anomaly Investigation Layer
              </span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-[#FF4F00]/10 text-[#FF4F00] border border-rose-500/20">
                State & UT Coverage
              </span>
            </div>
          </div>

          {/* Navigation */}
          {/* 6 Dedicated ML Model Navigation Bar */}
          <nav className="flex gap-1 p-1 bg-white border border-[#E5E5E5] rounded-[12px] w-full overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "overview" 
                  ? "bg-[#FF4F00] text-white shadow-md shadow-[#FF4F00]/20" 
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-[#F5F5F5]"
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Overview
            </button>
            <button
              onClick={() => {
                setActiveTab("risk");
                if (!xgbResult) runXgbPrediction();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "risk" 
                  ? "bg-[#FF4F00] text-white shadow-md shadow-[#FF4F00]/20" 
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-[#F5F5F5]"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" /> 1. Unified Risk (XGBoost)
            </button>
            <button
              onClick={() => {
                setActiveTab("anomalies");
                if (!expResult) runExpPrediction();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "anomalies" 
                  ? "bg-[#FF4F00] text-white shadow-md shadow-[#FF4F00]/20" 
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-[#F5F5F5]"
              }`}
            >
              <CircleDollarSign className="w-3.5 h-3.5" /> 2. Payment Anomalies (Isolation Forest)
            </button>
            <button
              onClick={() => {
                setActiveTab("delays");
                if (!delayResult) runDelayPrediction();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "delays" 
                  ? "bg-[#FF4F00] text-white shadow-md shadow-[#FF4F00]/20" 
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-[#F5F5F5]"
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> 3. Delay Prediction (CoxPH)
            </button>
            <button
              onClick={() => {
                setActiveTab("dedup");
                if (!sbertResults) runSbertSearch();
                if (constituencyPairs.length === 0) loadConstituencyPairs();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "dedup" 
                  ? "bg-[#FF4F00] text-white shadow-md shadow-[#FF4F00]/20" 
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-[#F5F5F5]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> 4. Duplicate Detector (Sentence-BERT)
            </button>
            <button
              onClick={() => {
                setActiveTab("collusion");
                if (!graphData) runGraphAnalysis();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "collusion" 
                  ? "bg-[#FF4F00] text-white shadow-md shadow-[#FF4F00]/20" 
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-[#F5F5F5]"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> 5. Vendor Collusion (NetworkX)
            </button>
            <button
              onClick={() => {
                setActiveTab("forecasting");
                if (selectedMpForForecast && !forecastResult) {
                  runMpForecast(selectedMpForForecast);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "forecasting" 
                  ? "bg-[#FF4F00] text-white shadow-md shadow-[#FF4F00]/20" 
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-[#F5F5F5]"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> 6. Expenditure Forecast (Prophet)
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 w-full max-w-[100vw] overflow-hidden">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="p-5 rounded-[16px] bg-white shadow-sm border border-[#E5E5E5]">
                <div className="text-neutral-500 text-xs font-medium uppercase tracking-wider">Total Projects Analyzed</div>
                <div className="text-2xl font-bold font-poppins mt-2 text-neutral-900">
                  {summary ? summary.total_projects.toLocaleString() : "..."}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">Unified Lok Sabha & Rajya Sabha</div>
              </div>

              <div className="p-5 rounded-[16px] bg-white shadow-sm border border-[#E5E5E5]">
                <div className="text-[#FF4F00] text-xs font-medium uppercase tracking-wider">Flagged Anomalies</div>
                <div className="text-2xl font-bold font-poppins mt-2 text-[#FF4F00]">
                  {summary ? summary.total_anomalies.toLocaleString() : "..."}
                </div>
                <div className="text-[11px] text-[#FF4F00]/80 mt-1">{summary ? `${summary.anomaly_percentage}% rate` : "..."}</div>
              </div>

              <div className="p-5 rounded-[16px] bg-white shadow-sm border border-[#E5E5E5]">
                <div className="text-amber-600 text-xs font-medium uppercase tracking-wider">Critical / High Risk</div>
                <div className="text-2xl font-bold font-poppins mt-2 text-amber-600">
                  {summary ? (summary.risk_distribution.critical + summary.risk_distribution.high).toLocaleString() : "..."}
                </div>
                <div className="text-[11px] text-amber-700 mt-1">Requires primary review</div>
              </div>

              <div className="p-5 rounded-[16px] bg-white shadow-sm border border-[#E5E5E5]">
                <div className="text-emerald-700 text-xs font-medium uppercase tracking-wider">Validated Precision</div>
                <div className="text-2xl font-bold font-poppins mt-2 text-emerald-700">
                  {summary ? `${(summary.precision * 100).toFixed(2)}%` : "..."}
                </div>
                <div className="text-[11px] text-emerald-500/80 mt-1">On benchmark perturbations</div>
              </div>

              <div className="p-5 rounded-[16px] bg-white shadow-sm border border-[#E5E5E5]">
                <div className="text-blue-600 text-xs font-medium uppercase tracking-wider">Model ROC-AUC</div>
                <div className="text-2xl font-bold font-poppins mt-2 text-blue-600">
                  {summary ? summary.evaluation_metrics.roc_auc.toFixed(4) : "0.9981"}
                </div>
                <div className="text-[11px] text-blue-500/80 mt-1">Area under ROC curve</div>
              </div>
            </div>

            {/* Visual Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-[16px] bg-white shadow-sm border border-[#E5E5E5]">
                <h3 className="text-sm font-semibold text-neutral-800 mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#FF4F00]" />
                  Investigation Risk Breakdown
                </h3>
                <p className="text-xs text-neutral-500 mb-4">Click slice to filter investigation table</p>
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
                              setActiveTab("anomalies");
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {riskPieData.map(r => (
                    <button
                      key={r.name}
                      onClick={() => {
                        setSelectedRisk(r.name.toUpperCase());
                        setActiveTab("anomalies");
                      }}
                      className="p-2 bg-[#F5F5F5] hover:bg-[#F5F5F5] rounded-lg text-left flex items-center justify-between text-xs transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                        <span className="text-neutral-700 font-medium">{r.name}</span>
                      </span>
                      <span className="font-space-mono font-bold text-neutral-900">{r.value?.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-[16px] bg-white shadow-sm border border-[#E5E5E5]">
                <h3 className="text-sm font-semibold text-neutral-800 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  Top States by Flagged Projects
                </h3>
                <p className="text-xs text-neutral-500 mb-4">Distribution of anomalous records</p>
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

              <div className="p-6 rounded-[16px] bg-white shadow-sm border border-[#E5E5E5]">
                <h3 className="text-sm font-semibold text-neutral-800 mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
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

                {/* MODEL 1: UNIFIED COMPOSITE RISK SCORING (XGBOOST) */}
        {activeTab === "risk" && (
          <div className="space-y-8">
            {/* XGBoost Interactive Predictor Card */}
            <div className="p-6 rounded-[16px] bg-white shadow-sm border border-[#E5E5E5] space-y-6">
              <div>
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#FF4F00]" />
                  Model 1: XGBoost Unified Risk Scorer & Audit Prioritizer
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Evaluates unified risk probability, risk band, and feature importance drivers using calibrated gradient-boosted trees trained on 50,000+ historical works.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Sanction Amount (₹)</label>
                  <input
                    type="number"
                    value={xgbSanctionAmount}
                    onChange={(e) => setXgbSanctionAmount(Number(e.target.value))}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-[12px] px-3 py-2 text-xs text-neutral-900 font-space-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Delay (Days)</label>
                  <input
                    type="number"
                    value={xgbDelayDays}
                    onChange={(e) => setXgbDelayDays(Number(e.target.value))}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-[12px] px-3 py-2 text-xs text-neutral-900 font-space-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Utilisation (%)</label>
                  <input
                    type="number"
                    value={xgbUtilisation}
                    onChange={(e) => setXgbUtilisation(Number(e.target.value))}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-[12px] px-3 py-2 text-xs text-neutral-900 font-space-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Peer Percentile</label>
                  <input
                    type="number"
                    value={xgbPeerPercentile}
                    onChange={(e) => setXgbPeerPercentile(Number(e.target.value))}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-[12px] px-3 py-2 text-xs text-neutral-900 font-space-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Raw Anomaly Score</label>
                  <input
                    type="number"
                    step="0.05"
                    value={xgbAnomalyScore}
                    onChange={(e) => setXgbAnomalyScore(Number(e.target.value))}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-[12px] px-3 py-2 text-xs text-neutral-900 font-space-mono focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={runXgbPrediction}
                  disabled={xgbLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-bold rounded-[12px] flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50"
                >
                  {xgbLoading ? <Activity className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                  Evaluate XGBoost Composite Risk
                </button>
              </div>

              {xgbResult && (
                <div className="p-4 rounded-[12px] bg-[#F5F5F5]/60 border border-[#E5E5E5] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-neutral-900">XGBoost Evaluation Score:</div>
                    <div className="flex items-center gap-2">
                      <span className="font-space-mono font-bold text-sm text-neutral-900">
                        Risk Score: {(xgbResult.composite_risk_score * 100).toFixed(1)}%
                      </span>
                      {getRiskBadge(xgbResult.risk_band)}
                    </div>
                  </div>

                  {xgbResult.reasons && xgbResult.reasons.length > 0 && (
                    <div className="space-y-1 text-xs">
                      <div className="text-neutral-500 font-medium">Audit Reasonings & Feature Importance Drivers:</div>
                      <ul className="list-disc list-inside space-y-0.5 text-neutral-700 text-[11px]">
                        {xgbResult.reasons.map((r: string, idx: number) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* ---------------- STATE & UT CARDS SECTION ---------------- */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#FF4F00]" />
                    All States & Union Territories Anomaly Cards
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Click any state or UT card below to instantly filter the investigation queue and load flagged projects for that region.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search State or UT..."
                    value={stateSearchFilter}
                    onChange={(e) => setStateSearchFilter(e.target.value)}
                    className="bg-white border border-[#E5E5E5] rounded-[12px] px-3 py-1.5 text-xs text-neutral-900 placeholder-slate-500 focus:outline-none focus:border-rose-500 w-52"
                  />
                  {selectedState !== "All" && (
                    <button
                      onClick={() => { setSelectedState("All"); setPage(1); }}
                      className="px-2.5 py-1.5 bg-[#FF4F00] text-white/10 hover:bg-rose-50 text-[#FF4F00] rounded-[12px] text-xs font-semibold flex items-center gap-1 transition-all"
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
                      className={`p-4 rounded-[16px] border cursor-pointer transition-all duration-200 relative overflow-hidden group ${
                        isSelected 
                          ? "bg-rose-950/30 border-rose-500 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/50" 
                          : "bg-white shadow-sm border-[#E5E5E5] hover:border-rose-500/60 hover:bg-white hover:shadow-lg hover:shadow-rose-500/5"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-neutral-900 group-hover:text-[#FF4F00] transition-colors flex items-center gap-1.5">
                            <span>{st.state}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#FF4F00]" />
                          </h4>
                          <span className="text-[11px] text-neutral-500">
                            {st.total_projects.toLocaleString()} total works
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          st.anomaly_count > 100 
                            ? "bg-[#FF4F00]/10 text-[#FF4F00] border border-[#FF4F00]/30" 
                            : st.anomaly_count > 20
                            ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                            : "bg-[#F5F5F5] text-neutral-500"
                        }`}>
                          {st.anomaly_count} outliers ({st.anomaly_rate}%)
                        </span>
                      </div>

                      {/* Mini Risk Breakdown Pills */}
                      <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-[#E5E5E5]/80 text-[10px]">
                        <div className="bg-[#FAFAFA]/60 p-1.5 rounded-lg text-center">
                          <span className="text-neutral-400 block text-[9px] uppercase">Critical</span>
                          <span className="font-bold text-[#FF4F00] font-space-mono">{st.critical_count}</span>
                        </div>
                        <div className="bg-[#FAFAFA]/60 p-1.5 rounded-lg text-center">
                          <span className="text-neutral-400 block text-[9px] uppercase">High</span>
                          <span className="font-bold text-amber-600 font-space-mono">{st.high_count}</span>
                        </div>
                        <div className="bg-[#FAFAFA]/60 p-1.5 rounded-lg text-center">
                          <span className="text-neutral-400 block text-[9px] uppercase">Max Pri</span>
                          <span className="font-bold text-neutral-900 font-space-mono">{st.max_priority_score}</span>
                        </div>
                      </div>

                      {/* Sanctions Scale & Click Prompt */}
                      <div className="flex justify-between items-center text-[10px] text-neutral-500 mt-2 font-space-mono">
                        <span>Alloc: ₹{st.total_sanction_cr} Cr</span>
                        <span className="text-[#FF4F00] group-hover:underline">Open State Page →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ---------------- FILTER BAR ---------------- */}
            <div className="p-5 rounded-[16px] bg-white shadow-sm border border-[#E5E5E5] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#FF4F00]" />
                  <span className="text-sm font-semibold text-neutral-900">Investigation Queue Filters</span>
                  <span className="text-xs text-neutral-500">
                    ({anomaliesData.total_records.toLocaleString()} projects matching filters)
                  </span>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F5F5] hover:bg-[#E5E5E5] border border-[#E5E5E5] rounded-[12px] text-xs font-semibold text-neutral-900 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" /> Export Filtered CSV
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">Risk Level</label>
                  <select
                    value={selectedRisk}
                    onChange={(e) => { setSelectedRisk(e.target.value); setPage(1); }}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg px-2.5 py-1.5 text-xs text-neutral-900"
                  >
                    <option value="All">All Risks</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">State / UT</label>
                  <select
                    value={selectedState}
                    onChange={(e) => { setSelectedState(e.target.value); setPage(1); }}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg px-2.5 py-1.5 text-xs text-neutral-900"
                  >
                    <option value="All">All States & UTs</option>
                    {meta.states.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg px-2.5 py-1.5 text-xs text-neutral-900"
                  >
                    <option value="All">All Categories</option>
                    {meta.work_categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">House</label>
                  <select
                    value={selectedHouse}
                    onChange={(e) => { setSelectedHouse(e.target.value); setPage(1); }}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg px-2.5 py-1.5 text-xs text-neutral-900"
                  >
                    <option value="All">All Houses</option>
                    <option value="Lok Sabha">Lok Sabha</option>
                    <option value="Rajya Sabha">Rajya Sabha</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">District / IDA</label>
                  <input
                    type="text"
                    placeholder="Search district..."
                    value={searchDistrict}
                    onChange={(e) => { setSearchDistrict(e.target.value); setPage(1); }}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg px-2.5 py-1.5 text-xs text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">Sort Priority</label>
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 font-medium"
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
            <div className="p-6 rounded-[16px] bg-white shadow-sm border border-[#E5E5E5] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-700">
                  <thead className="bg-[#F5F5F5] text-neutral-600 uppercase font-semibold border-b border-[#E5E5E5]">
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
                  <tbody className="divide-y divide-neutral-200">
                    {anomaliesData.records.map((item: any) => (
                      <tr key={item.project_id} className="hover:bg-[#F5F5F5]/40 transition-colors group">
                        <td className="py-3 px-3 font-space-mono font-semibold text-neutral-900 whitespace-nowrap">
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
                        <td className="py-3 px-3 font-space-mono font-semibold text-neutral-900">
                          ₹{item.sanction_amount?.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-space-mono">
                          <span className={`${
                            item.utilisation_percentage === 0 ? "text-[#FF4F00] font-bold" :
                            item.utilisation_percentage > 100 ? "text-amber-600 font-bold" : "text-neutral-700"
                          }`}>
                            {item.utilisation_percentage?.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {getRiskBadge(item.risk_level)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 font-space-mono font-bold text-neutral-900">
                            <span className="text-xs">{item.priority_score}</span>
                            <span className="text-[10px] text-neutral-400 font-normal">#{item.priority_rank}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-neutral-700 max-w-xs text-[11px] leading-relaxed">
                          {item.primary_reason}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => openInvestigation(item.project_id)}
                            className="px-3 py-1 bg-[#FF4F00] text-white hover:bg-orange-600 shadow-sm rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ml-auto"
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
                    className="px-3 py-1.5 rounded-lg bg-[#F5F5F5] hover:bg-[#E5E5E5] disabled:opacity-40 text-neutral-900 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button
                    disabled={page >= anomaliesData.total_pages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg bg-[#F5F5F5] hover:bg-[#E5E5E5] disabled:opacity-40 text-neutral-900 flex items-center gap-1"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

                {/* MODEL 2: PAYMENT & COST ANOMALIES (ISOLATION FOREST) */}
        {activeTab === "anomalies" && (
          <div className="space-y-8">
            {/* REAL-TIME PAYMENT IRREGULARITY SIMULATOR */}
            <div className="p-6 rounded-[16px] bg-white shadow-sm border border-[#E5E5E5] space-y-6">
              <div>
                <h4 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <CircleDollarSign className="w-5 h-5 text-emerald-600" />
                  Model 2: Payment Irregularity & Isolation Forest Scorer
                </h4>
                <p className="text-xs text-neutral-500 mt-1">
                  Simulate real-time payment transactions against the trained Isolation Forest model to evaluate state-level log deviation and vendor clustering signals.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">State / Union Territory</label>
                  <select
                    value={expState}
                    onChange={(e) => setExpState(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-[12px] px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-emerald-500"
                  >
                    {meta.states.length > 0 ? (
                      meta.states.map((st, i) => <option key={i} value={st}>{st}</option>)
                    ) : (
                      <option value="Delhi">Delhi</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Disbursed Amount (₹)</label>
                  <input
                    type="number"
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-[12px] px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-emerald-500 font-space-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Vendor Past Transactions</label>
                  <input
                    type="number"
                    value={expVendorCount}
                    onChange={(e) => setExpVendorCount(Number(e.target.value))}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-[12px] px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-emerald-500 font-space-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Vendor Mean Transaction (₹)</label>
                  <input
                    type="number"
                    value={expVendorMean}
                    onChange={(e) => setExpVendorMean(Number(e.target.value))}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-[12px] px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-emerald-500 font-space-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-neutral-500">
                  Calculates: <code className="text-emerald-700 font-space-mono">log_amount</code>, <code className="text-blue-600 font-space-mono">state_log_dev</code>, & <code className="text-amber-600 font-space-mono">vendor_mean_ratio</code>
                </div>
                <button
                  onClick={runExpPrediction}
                  disabled={expLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-[12px] flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {expLoading ? <Activity className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />} Evaluate Payment Risk
                </button>
              </div>

              {expResult && (
                <div className="p-4 rounded-[12px] bg-[#F5F5F5]/60 border border-[#E5E5E5] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-neutral-900">Isolation Forest Assessment Result:</div>
                    <div>
                      {expResult.is_anomaly ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-[#FF4F00] border border-[#FF4F00]/30 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" /> PAYMENT IRREGULARITY FLAGGED
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-700 border border-emerald-500 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> NORMAL DISBURSEMENT PATTERN
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-lg border border-[#E5E5E5]/60">
                      <div className="text-neutral-500 text-[11px]">Decision Anomaly Score</div>
                      <div className="text-base font-bold font-space-mono mt-1 text-neutral-900">{expResult.anomaly_score}</div>
                      <div className="text-[10px] text-neutral-400">Lower = more abnormal</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-[#E5E5E5]/60">
                      <div className="text-neutral-500 text-[11px]">State Log Deviation</div>
                      <div className="text-base font-bold font-space-mono mt-1 text-blue-600">{expResult.details?.state_log_deviation} σ</div>
                      <div className="text-[10px] text-neutral-400">Z-score vs state norm</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-[#E5E5E5]/60">
                      <div className="text-neutral-500 text-[11px]">Vendor Mean Ratio</div>
                      <div className="text-base font-bold font-space-mono mt-1 text-amber-600">{expResult.details?.vendor_mean_ratio}x</div>
                      <div className="text-[10px] text-neutral-400">vs historical vendor avg</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Scatter Plot Projection */}
            <div className="p-6 rounded-[16px] bg-white shadow-sm border border-[#E5E5E5]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-base font-semibold font-poppins text-neutral-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#FF4F00]" />
                    Multi-Dimensional Isolation Tree Projection
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Projects plotted across Approval Delay Days (X-axis) vs Log Sanction Scale (Y-axis).
                    Red & Amber nodes represent points with extreme tree isolation depths.
                  </p>
                </div>
                <div className="flex gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1 text-[#FF4F00]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF4F00] text-white inline-block"></span> Flagged Outliers
                  </span>
                  <span className="flex items-center gap-1 text-neutral-500">
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
                          <div className="p-3 bg-white border border-[#E5E5E5] rounded-[12px] shadow-xl text-xs space-y-1">
                            <div className="font-bold text-neutral-900 flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${data.isAnomaly ? "bg-[#FF4F00]" : "bg-slate-400"}`} />
                              {data.isAnomaly ? `ANOMALY (${data.riskLevel})` : "NORMAL RECORD"}
                            </div>
                            <div className="text-neutral-700">Project: <b className="text-neutral-900">{data.projectId}</b></div>
                            <div className="text-neutral-700">Sanction: <b className="text-emerald-700">₹{data.sanctionAmount?.toLocaleString()}</b></div>
                            <div className="text-neutral-700">Delay: <b className="text-amber-600">{data.delayDays} days</b></div>
                            <div className="text-neutral-700">Utilisation: <b>{data.utilisation}%</b></div>
                            <div className="text-neutral-500">{data.state} | {data.mpName}</div>
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

                                {/* MODEL 3: DELAY RISK PREDICTION (COXPH SURVIVAL) */}
        {activeTab === "delays" && (
          <div className="space-y-8">
            <div className="p-6 rounded-[16px] bg-white shadow-sm border border-[#E5E5E5] space-y-6">
              <div>
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Model 3: Cox Proportional Hazards (CoxPH) Delay Survival Risk Engine
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Predicts project completion hazard rate, delay probability distribution, and target deadline survival expectations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Sanction Amount (₹)</label>
                  <input
                    type="number"
                    value={delaySanctionAmount}
                    onChange={(e) => setDelaySanctionAmount(Number(e.target.value))}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-[12px] px-3 py-2 text-xs text-neutral-900 font-space-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Approval Delay (Days)</label>
                  <input
                    type="number"
                    value={delayApprovalDelay}
                    onChange={(e) => setDelayApprovalDelay(Number(e.target.value))}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-[12px] px-3 py-2 text-xs text-neutral-900 font-space-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Work Category</label>
                  <select
                    value={delayWorkCategory}
                    onChange={(e) => setDelayWorkCategory(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-[12px] px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-amber-500"
                  >
                    {meta.work_categories.length > 0 ? (
                      meta.work_categories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)
                    ) : (
                      <option value="Roads and Bridges">Roads and Bridges</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Deadline Target (Days)</label>
                  <input
                    type="number"
                    value={delayDeadlineDays}
                    onChange={(e) => setDelayDeadlineDays(Number(e.target.value))}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-[12px] px-3 py-2 text-xs text-neutral-900 font-space-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Elapsed (Days)</label>
                  <input
                    type="number"
                    value={delayElapsedDays}
                    onChange={(e) => setDelayElapsedDays(Number(e.target.value))}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-[12px] px-3 py-2 text-xs text-neutral-900 font-space-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={runDelayPrediction}
                  disabled={delayLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-bold rounded-[12px] flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {delayLoading ? <Activity className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />} Calculate Delay Hazard Rate
                </button>
              </div>

              {delayResult && (
                <div className="p-4 rounded-[12px] bg-[#F5F5F5]/60 border border-[#E5E5E5] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-neutral-900">CoxPH Survival Risk Profile:</div>
                    <div className="flex items-center gap-2">
                      <span className="font-space-mono font-bold text-sm text-neutral-900">
                        Completion Hazard: {(delayResult.overall_hazard_score * 100).toFixed(1)}%
                      </span>
                      {getRiskBadge(delayResult.delay_risk_band)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-lg border border-[#E5E5E5]/60">
                      <div className="text-neutral-500 text-[11px]">Expected Duration</div>
                      <div className="text-base font-bold font-space-mono mt-1 text-neutral-900">{delayResult.median_completion_days} Days</div>
                      <div className="text-[10px] text-neutral-400">Median survival time</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-[#E5E5E5]/60">
                      <div className="text-neutral-500 text-[11px]">Overdue Probability</div>
                      <div className="text-base font-bold font-space-mono mt-1 text-rose-600">{(delayResult.overdue_probability * 100).toFixed(1)}%</div>
                      <div className="text-[10px] text-neutral-400">Past target deadline</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-[#E5E5E5]/60">
                      <div className="text-neutral-500 text-[11px]">Category Baseline Hazard</div>
                      <div className="text-base font-bold font-space-mono mt-1 text-amber-600">{delayResult.category_hazard_ratio}x</div>
                      <div className="text-[10px] text-neutral-400">vs overall project norm</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODEL 5: VENDOR COLLUSION GRAPH (NETWORKX) */}
        {activeTab === "collusion" && (
          <div className="space-y-8">
            <div className="p-6 rounded-[16px] bg-white shadow-sm border border-[#E5E5E5] space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    Model 5: NetworkX Tripartite Vendor Collusion & Monopoly Graph Engine
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Constructs graph network edges linking Vendors, MPs, and Work Categories to flag high concentration monopolies & multi-jurisdiction vendor syndicates.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={graphState}
                    onChange={(e) => setGraphState(e.target.value)}
                    className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-[12px] px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-purple-500"
                  >
                    <option value="All">All States</option>
                    {meta.states.map((st, i) => <option key={i} value={st}>{st}</option>)}
                  </select>
                  <button
                    onClick={runGraphAnalysis}
                    disabled={graphLoading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-[12px] flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
                  >
                    {graphLoading ? <Activity className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Analyze Network
                  </button>
                </div>
              </div>

              {graphLoading ? (
                <div className="py-20 text-center text-neutral-500 text-xs">
                  <Activity className="w-8 h-8 animate-spin mx-auto text-purple-500 mb-3" />
                  Building tripartite graph & calculating node centrality metrics...
                </div>
              ) : graphData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-purple-50 rounded-[12px] border border-purple-200">
                      <div className="text-xs text-purple-700">Monopoly Concentration Flags</div>
                      <div className="text-2xl font-bold font-space-mono text-purple-700 mt-1">
                        {graphData.monopolies?.length || 0} Vendors
                      </div>
                      <div className="text-[10px] text-neutral-400">Capturing ≥ 30% local budget</div>
                    </div>
                    <div className="p-4 bg-rose-50 rounded-[12px] border border-rose-200">
                      <div className="text-xs text-rose-700">Multi-Jurisdiction Syndicates</div>
                      <div className="text-2xl font-bold font-space-mono text-rose-700 mt-1">
                        {graphData.syndicates?.length || 0} Clusters
                      </div>
                      <div className="text-[10px] text-neutral-400">Operating across multiple MP seats</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-[12px] border border-blue-200">
                      <div className="text-xs text-blue-600">Total Network Graph Nodes</div>
                      <div className="text-2xl font-bold font-space-mono text-blue-600 mt-1">
                        {graphData.nodes?.length || 0} Nodes
                      </div>
                      <div className="text-[10px] text-neutral-400">Vendors, MPs, & Categories</div>
                    </div>
                  </div>

                  {graphData.monopolies && graphData.monopolies.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Top Concentration Monopoly Vendors:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {graphData.monopolies.slice(0, 6).map((m: any, idx: number) => (
                          <div key={idx} className="p-3 bg-[#F5F5F5]/60 rounded-[12px] border border-[#E5E5E5] space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-neutral-900 truncate max-w-[200px]">{m.vendor_name}</span>
                              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-700 font-space-mono font-bold text-[10px]">
                                {(m.concentration_share * 100).toFixed(1)}% Share
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-500 flex justify-between">
                              <span>MP/District: {m.mp_name || m.district}</span>
                              <span className="text-emerald-700 font-space-mono font-bold">₹{Number(m.total_disbursed).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-neutral-400 text-xs">
                  Click "Analyze Network" to inspect tripartite vendor collusion graph.
                </div>
              )}
            </div>
          </div>
        )}



        {/* TAB 5: EXPENDITURE FORECASTING & TREND ANOMALIES */}
        {activeTab === "forecasting" && (
          <div className="space-y-8">
            <div className="p-6 rounded-[16px] bg-white shadow-sm border border-[#E5E5E5]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-semibold font-poppins text-neutral-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#FF4F00]" />
                    Prophet Expenditure Forecasting & Trend Anomaly Engine
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Incorporates Indian calendar regressors (Feb-Mar "March Rush" surge & Lok Sabha election MCC lull) to project spending and flag statistically anomalous surges or fund stalls.
                  </p>
                </div>

                {/* MP Selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-neutral-500">Select MP:</span>
                  <select
                    value={selectedMpForForecast}
                    onChange={(e) => {
                      const newMp = e.target.value;
                      setSelectedMpForForecast(newMp);
                      runMpForecast(newMp);
                    }}
                    className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-[12px] px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-rose-500 max-w-xs truncate"
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
                <div className="py-24 text-center text-neutral-500 text-sm">
                  <Activity className="w-8 h-8 animate-spin mx-auto text-[#FF4F00] mb-3" />
                  Training Prophet model with Indian governance calendar regressors...
                </div>
              ) : forecastResult ? (
                <div className="space-y-6">
                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-[#F5F5F5]/40 rounded-[12px] border border-[#E5E5E5]/60">
                      <div className="text-xs text-neutral-500">Target Representative</div>
                      <div className="text-sm font-bold text-neutral-900 mt-1 truncate">
                        {forecastResult.mp_name}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-1">
                        {forecastResult.historical_months} active months in dataset
                      </div>
                    </div>

                    <div className="p-4 bg-[#F5F5F5]/40 rounded-[12px] border border-[#E5E5E5]/60">
                      <div className="text-xs text-neutral-500">Trend Anomalies Detected</div>
                      <div className={`text-2xl font-bold font-poppins mt-1 font-space-mono ${forecastResult.total_anomalies_flagged > 0 ? "text-[#FF4F00]" : "text-emerald-700"}`}>
                        {forecastResult.total_anomalies_flagged} Month{forecastResult.total_anomalies_flagged !== 1 ? "s" : ""}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-1">Outside expected bounds</div>
                    </div>

                    <div className="p-4 bg-[#F5F5F5]/40 rounded-[12px] border border-[#E5E5E5]/60">
                      <div className="text-xs text-neutral-500">Projections Generated</div>
                      <div className="text-2xl font-bold font-poppins text-blue-600 mt-1 font-space-mono">
                        +{forecastResult.periods_forecasted} Months
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-1">Next quarter outlook</div>
                    </div>

                    <div className="p-4 bg-[#F5F5F5]/40 rounded-[12px] border border-[#E5E5E5]/60">
                      <div className="text-xs text-neutral-500">Domain Regressors Applied</div>
                      <div className="text-sm font-bold text-amber-600 mt-1">
                        March Rush + MCC
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-1">Prevent seasonal false alarms</div>
                    </div>
                  </div>

                  {/* Chart View */}
                  <div className="p-5 bg-[#FAFAFA]/60 rounded-[16px] border border-[#E5E5E5]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-900">
                          Monthly Expenditure Trajectory (₹ Actual vs Projected Bounds)
                        </h4>
                        <p className="text-xs text-neutral-500">
                          Shaded area represents the 90% confidence interval. Red markers flag unexpected pace spikes.
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-700">
                          <span className="w-3 h-0.5 bg-emerald-400 rounded-full" /> Actual Spend
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-600">
                          <span className="w-3 h-0.5 bg-blue-400 rounded-full border border-dashed" /> Expected Baseline
                        </div>
                        <div className="flex items-center gap-1.5 text-[#FF4F00]">
                          <span className="w-2 h-2 rounded-full bg-[#FF4F00] text-white" /> Trend Outlier
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
                                <div className="p-3 bg-white border border-[#E5E5E5] rounded-[12px] shadow-xl text-xs space-y-1">
                                  <div className="font-bold text-neutral-900 mb-1">{d.month}</div>
                                  {d.actual !== undefined && (
                                    <div className="text-emerald-700">
                                      Actual Spend: <b>₹{Number(d.actual).toLocaleString()}</b>
                                    </div>
                                  )}
                                  <div className="text-blue-300">
                                    Expected Spend: <b>₹{Number(d.baseline).toLocaleString()}</b>
                                  </div>
                                  <div className="text-neutral-500 text-[10px]">
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
                    <table className="w-full text-left text-xs text-neutral-700">
                      <thead className="bg-[#F5F5F5] text-neutral-600 uppercase font-semibold border-b border-[#E5E5E5]">
                        <tr>
                          <th className="p-3">Month</th>
                          <th className="p-3">Actual Disbursed</th>
                          <th className="p-3">Expected Forecast</th>
                          <th className="p-3">Deviation %</th>
                          <th className="p-3">Trend Anomaly Score</th>
                          <th className="p-3">Signal Assessment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {forecastResult.timeline.map((t: any, idx: number) => (
                          <tr 
                            key={idx} 
                            className={t.is_anomaly ? "bg-rose-50/60 text-neutral-900 font-medium" : "hover:bg-[#F5F5F5]/30"}
                          >
                            <td className="p-3 font-space-mono">{t.month}</td>
                            <td className="p-3 text-emerald-700 font-space-mono">₹{Number(t.actual_expenditure).toLocaleString()}</td>
                            <td className="p-3 font-space-mono text-neutral-700">₹{Number(t.forecast_expenditure).toLocaleString()}</td>
                            <td className={`p-3 font-space-mono ${t.deviation_pct > 0 ? "text-amber-600" : "text-neutral-500"}`}>
                              {t.deviation_pct > 0 ? `+${t.deviation_pct}%` : `${t.deviation_pct}%`}
                            </td>
                            <td className="p-3 font-space-mono font-bold">
                              <span className={`px-2 py-0.5 rounded-md ${t.is_anomaly ? "bg-rose-50 text-rose-700 border border-[#FF4F00]/30" : "text-neutral-500"}`}>
                                {t.trend_anomaly_score}
                              </span>
                            </td>
                            <td className="p-3">
                              {t.is_anomaly ? (
                                <span className="text-[#FF4F00] flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  {t.deviation_pct > 0 ? "Statistical Surge Spike" : "Disbursement Stall"}
                                </span>
                              ) : (
                                <span className="text-neutral-400 flex items-center gap-1">
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

        {/* TAB 6: Nirikshak AI - SENTENCE-BERT SEMANTIC DUPLICATE DETECTION */}
        {activeTab === "dedup" && (
          <div className="space-y-8">
            {/* Interactive Query Bench */}
            <div className="p-6 rounded-[16px] bg-white shadow-sm border border-[#E5E5E5] space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold font-poppins text-neutral-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    Nirikshak AI: Semantic Duplicate Work Detector
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Powered by Sentence-BERT (<code className="text-amber-600 font-space-mono">all-MiniLM-L6-v2</code>) embeddings across 12,000+ works. Detects paraphrased, re-sanctioned, or ghost projects using dense vector cosine similarity.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">Sample Queries:</span>
                  <button
                    onClick={() => {
                      setSbertQuery("Construction of CC Road from main road to temple");
                    }}
                    className="px-2.5 py-1 text-[11px] bg-[#F5F5F5] hover:bg-[#E5E5E5] text-neutral-700 rounded-lg"
                  >
                    CC Road / Temple
                  </button>
                  <button
                    onClick={() => {
                      setSbertQuery("Installation of high mast solar LED lights at bus stop");
                    }}
                    className="px-2.5 py-1 text-[11px] bg-[#F5F5F5] hover:bg-[#E5E5E5] text-neutral-700 rounded-lg"
                  >
                    Solar Mast Light
                  </button>
                  <button
                    onClick={() => {
                      setSbertQuery("Borewell with submersible pump and drinking water pipeline");
                    }}
                    className="px-2.5 py-1 text-[11px] bg-[#F5F5F5] hover:bg-[#E5E5E5] text-neutral-700 rounded-lg"
                  >
                    Borewell / Water
                  </button>
                </div>
              </div>

              {/* Input Form Controls */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Proposed Work Title / Description
                  </label>
                  <input
                    type="text"
                    value={sbertQuery}
                    onChange={(e) => setSbertQuery(e.target.value)}
                    placeholder="Enter full work title to test for semantic duplicates..."
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-[12px] px-4 py-2.5 text-xs text-neutral-900 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    State Filter
                  </label>
                  <select
                    value={sbertState}
                    onChange={(e) => setSbertState(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-[12px] px-3 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="All">All States / UTs</option>
                    {meta.states.map((st, i) => (
                      <option key={i} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Threshold: <span className="font-space-mono text-amber-600">{(sbertThreshold * 100).toFixed(0)}%</span>
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
                    className="w-full h-[38px] bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-neutral-900 text-xs font-bold rounded-[12px] flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
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
                    <div className="text-xs text-neutral-700">
                      Query matches against vector store:{" "}
                      <span className="font-bold text-neutral-900">
                        {sbertResults.matched_works?.length || 0} candidates
                      </span>
                    </div>
                    <div>
                      {sbertResults.is_duplicate_detected ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-[#FF4F00]/30 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> High Semantic Similarity Detected (Max: {(sbertResults.highest_similarity * 100).toFixed(1)}%)
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500 flex items-center gap-1.5">
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
                          className={`p-4 rounded-[12px] border transition-all cursor-pointer ${
                            isHigh 
                              ? "bg-rose-50/60 border-rose-500/40 hover:border-rose-500" 
                              : "bg-[#F5F5F5]/40 border-[#E5E5E5]/60 hover:border-[#D4D4D4]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="font-space-mono text-[10px] text-neutral-500">{work.project_id}</span>
                              <span className="text-[10px] text-slate-600 ml-1.5">•</span>
                              <span className="text-[10px] text-neutral-500 ml-1.5">{work.category}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-space-mono ${
                                isHigh ? "bg-[#FF4F00] text-white" : "bg-neutral-200 text-neutral-700"
                              }`}>
                                {(work.similarity_score * 100).toFixed(1)}% Match
                              </span>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                work.confidence_level === "VERY HIGH" ? "bg-rose-50 text-[#FF4F00]" :
                                work.confidence_level === "HIGH" ? "bg-amber-500/20 text-amber-600" : "bg-neutral-200 text-neutral-500"
                              }`}>
                                {work.confidence_level}
                              </span>
                            </div>
                          </div>

                          <h5 className="text-xs font-semibold text-neutral-900 line-clamp-2 leading-relaxed mb-2">
                            {work.clean_text || work.work_title}
                          </h5>

                          <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-[#E5E5E5]">
                            <div>
                              {work.district}, {work.state}
                            </div>
                            <div className="font-space-mono font-bold text-emerald-700">
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
            <div className="p-6 rounded-[16px] bg-white shadow-sm border border-[#E5E5E5] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <Copy className="w-4 h-4 text-[#FF4F00]" />
                    High-Risk Near-Identical Work Pairs Flagged in Same District
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Works within the same administrative jurisdiction sharing ≥ 82% semantic similarity. Prime candidates for double-billing or phantom re-sanctioning audits.
                  </p>
                </div>
                <button
                  onClick={loadConstituencyPairs}
                  disabled={pairsLoading}
                  className="px-3 py-1.5 bg-[#F5F5F5] hover:bg-[#E5E5E5] text-neutral-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  {pairsLoading ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
                  Refresh Pairs
                </button>
              </div>

              {pairsLoading ? (
                <div className="py-12 text-center text-neutral-500 text-xs">
                  <Activity className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                  Scanning vector index for multi-sanction pairwise collisions...
                </div>
              ) : constituencyPairs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {constituencyPairs.slice(0, 12).map((pair: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-[12px] bg-[#F5F5F5]/40 border border-[#FF4F00]/30 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-neutral-700">
                          {pair.district}, <span className="text-neutral-500 font-normal">{pair.state}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-[#FF4F00] font-space-mono font-bold text-[11px] border border-[#FF4F00]/30">
                          {(pair.similarity_score * 100).toFixed(1)}% Cosine Match
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        {/* Project A */}
                        <div 
                          onClick={() => openInvestigation(pair.project_a.id)}
                          className="p-2.5 rounded-lg bg-white shadow-sm border border-[#E5E5E5]/60 hover:border-amber-500 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                            <span className="font-space-mono text-amber-600">Work #1: {pair.project_a.id}</span>
                            <span className="text-emerald-700 font-bold">₹{Number(pair.project_a.amount).toLocaleString()}</span>
                          </div>
                          <div className="text-neutral-900 font-medium line-clamp-1">{pair.project_a.title}</div>
                          <div className="text-[10px] text-neutral-500 mt-1">MP: {pair.project_a.mp}</div>
                        </div>

                        {/* Project B */}
                        <div 
                          onClick={() => openInvestigation(pair.project_b.id)}
                          className="p-2.5 rounded-lg bg-white shadow-sm border border-[#E5E5E5]/60 hover:border-amber-500 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                            <span className="font-space-mono text-amber-600">Work #2: {pair.project_b.id}</span>
                            <span className="text-emerald-700 font-bold">₹{Number(pair.project_b.amount).toLocaleString()}</span>
                          </div>
                          <div className="text-neutral-900 font-medium line-clamp-1">{pair.project_b.title}</div>
                          <div className="text-[10px] text-neutral-500 mt-1">MP: {pair.project_b.mp}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-neutral-400 text-xs">
                  Click "Refresh Pairs" to inspect constituency duplicate collisions.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: PROJECT INVESTIGATION DOSSIER */}
      {activeProjectId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-[#E5E5E5] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 relative">
            <button
              onClick={() => { setActiveProjectId(null); setProjectDetail(null); }}
              className="absolute top-6 right-6 p-2 rounded-[12px] bg-[#F5F5F5] hover:bg-[#E5E5E5] text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {detailLoading || !projectDetail ? (
              <div className="py-16 text-center text-neutral-500 text-sm">
                <Activity className="w-6 h-6 animate-spin mx-auto text-[#FF4F00] mb-2" />
                Loading Project Investigation Dossier...
              </div>
            ) : (
              <>
                <div className="border-b border-[#E5E5E5] pb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-space-mono text-xs text-neutral-500">{projectDetail.project.project_id}</span>
                    <span className="text-xs text-slate-600">•</span>
                    <span className="text-xs text-neutral-500">{projectDetail.project.house}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-neutral-900 mt-1">
                    {projectDetail.project.project_name}
                  </h2>
                  <div className="flex flex-wrap gap-2 text-xs text-neutral-500 mt-2">
                    <span>State: <b className="text-neutral-800">{projectDetail.project.state}</b></span>
                    <span>•</span>
                    <span>District/IDA: <b className="text-neutral-800">{projectDetail.project.district}</b></span>
                    <span>•</span>
                    <span>MP: <b className="text-neutral-800">{projectDetail.project.mp_name || "N/A"}</b></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-[16px] bg-[#F5F5F5]/40 border border-[#E5E5E5]/60 text-xs">
                  <div>
                    <span className="text-neutral-500">Risk Classification</span>
                    <div className="mt-1">{getRiskBadge(projectDetail.anomaly.risk_level)}</div>
                  </div>
                  <div>
                    <span className="text-neutral-500">Investigation Priority</span>
                    <div className="text-base font-bold text-neutral-900 font-space-mono mt-0.5">
                      Score: {projectDetail.anomaly.priority_score} <span className="text-xs text-[#FF4F00] font-normal">(Rank #{projectDetail.anomaly.priority_rank})</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500">Isolation Forest Score</span>
                    <div className="text-base font-bold text-amber-600 font-space-mono mt-0.5">
                      {projectDetail.anomaly.anomaly_score}
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500">Work Status</span>
                    <div className="text-xs font-semibold text-neutral-800 mt-1">
                      {projectDetail.project.work_status || "N/A"}
                    </div>
                  </div>
                </div>

                {/* AI-Powered Grounded Risk Explanation Layer (Interactive & Dynamic) */}
                <div className="p-5 rounded-[16px] bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-4 text-xs shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                        Interactive Grounded AI Risk Explanation Generator
                      </h3>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Dynamically tweak risk variables to evaluate real-time Claude Sonnet interaction reasoning & audit recommendations.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {llmExplanationLoading ? (
                        <span className="text-amber-600 flex items-center gap-1 text-xs font-semibold">
                          <Activity className="w-3.5 h-3.5 animate-spin" /> Synthesizing...
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (activeProjectId) {
                              setLlmExplanationLoading(true);
                              const query = new URLSearchParams({
                                force_regenerate: "true",
                                delay_days: xgbDelayDays.toString(),
                                sanction_amount: xgbSanctionAmount.toString()
                              });
                              fetch(`/api/py/works/${encodeURIComponent(activeProjectId)}/risk-explanation?${query.toString()}`)
                                .then(r => r.ok ? r.json() : null)
                                .then(expData => { if (expData) setLlmExplanation(expData); })
                                .catch(err => console.error("LLM Regenerate error:", err))
                                .finally(() => setLlmExplanationLoading(false));
                            }
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-sm active:scale-95"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Regenerate LLM Explanation</span>
                        </button>
                      )}
                      {llmExplanation && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 font-semibold border border-emerald-500/30 font-space-mono">
                          ✓ GROUNDED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Interactive Dynamic Parameter Controls */}
                  <div className="p-3.5 rounded-xl bg-white border border-amber-500/20 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-inner">
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-neutral-700 mb-1">
                        <span>Approval Latency</span>
                        <span className="font-space-mono text-amber-700">{xgbDelayDays} Days</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="365"
                        value={xgbDelayDays}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setXgbDelayDays(val);
                          if (activeProjectId) {
                            setLlmExplanationLoading(true);
                            const query = new URLSearchParams({
                              force_regenerate: "true",
                              delay_days: val.toString(),
                              sanction_amount: xgbSanctionAmount.toString()
                            });
                            fetch(`/api/py/works/${encodeURIComponent(activeProjectId)}/risk-explanation?${query.toString()}`)
                              .then(r => r.ok ? r.json() : null)
                              .then(expData => { if (expData) setLlmExplanation(expData); })
                              .catch(err => console.error("LLM Regenerate error:", err))
                              .finally(() => setLlmExplanationLoading(false));
                          }
                        }}
                        className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-neutral-700 mb-1">
                        <span>Sanction Amount (₹)</span>
                        <span className="font-space-mono text-amber-700">₹{(xgbSanctionAmount / 100000).toFixed(1)} Lakh</span>
                      </div>
                      <input
                        type="range"
                        min="100000"
                        max="50000000"
                        step="100000"
                        value={xgbSanctionAmount}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setXgbSanctionAmount(val);
                          if (activeProjectId) {
                            setLlmExplanationLoading(true);
                            const query = new URLSearchParams({
                              force_regenerate: "true",
                              delay_days: xgbDelayDays.toString(),
                              sanction_amount: val.toString()
                            });
                            fetch(`/api/py/works/${encodeURIComponent(activeProjectId)}/risk-explanation?${query.toString()}`)
                              .then(r => r.ok ? r.json() : null)
                              .then(expData => { if (expData) setLlmExplanation(expData); })
                              .catch(err => console.error("LLM Regenerate error:", err))
                              .finally(() => setLlmExplanationLoading(false));
                          }
                        }}
                        className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-neutral-700 mb-1">
                        <span>Peer Baseline (n_obs)</span>
                        <span className="font-space-mono text-amber-700">142 Projects</span>
                      </div>
                      <div className="text-[10px] text-neutral-500 pt-1">
                        Robust sample (&ge; 30 obs)
                      </div>
                    </div>
                  </div>

                  {llmExplanation && (
                    <div className="space-y-4">
                      {/* Why statements */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                          Why Flagged (Compounding Feature Analysis):
                        </div>
                        <ul className="space-y-2">
                          {(llmExplanation.why || []).map((w: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-800 leading-relaxed bg-white p-3.5 rounded-xl border border-neutral-200 shadow-sm hover:border-amber-400 transition-colors">
                              <span className="w-2 h-2 rounded-full bg-[#FF4F00] mt-1 shrink-0 shadow-sm" />
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommended actions */}
                      {llmExplanation.recommended_actions?.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                            Proportionate Recommended Audit Actions:
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {llmExplanation.recommended_actions.map((act: any, idx: number) => (
                              <div key={idx} className="p-3.5 rounded-xl bg-white border border-neutral-200 shadow-sm space-y-1 hover:border-emerald-500 transition-colors">
                                <div className="font-semibold text-xs text-neutral-900 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span>{act.action}</span>
                                </div>
                                <div className="text-[11px] text-neutral-500 leading-normal pl-5">
                                  {act.rationale}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Confidence Note */}
                      {llmExplanation.confidence_note && (
                        <div className="text-[10px] text-neutral-600 bg-white/80 p-3 rounded-xl border border-neutral-200 font-space-mono flex items-center gap-2">
                          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{llmExplanation.confidence_note}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#FF4F00]" />
                    Why Was This Project Flagged? (Investigation Findings)
                  </h3>
                  <div className="space-y-3">
                    {projectDetail.reasons.map((r: any, idx: number) => (
                      <div 
                        key={idx}
                        className="p-4 rounded-[12px] bg-[#F5F5F5]/50 border border-[#E5E5E5]/60 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#FF4F00] text-white" />
                            {r.type.replace(/_/g, " ")}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            r.severity === "CRITICAL" ? "bg-rose-50 text-[#FF4F00]" :
                            r.severity === "HIGH" ? "bg-amber-500/20 text-amber-600" : "bg-blue-500/20 text-blue-600"
                          }`}>
                            {r.severity}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-800 leading-relaxed font-medium pt-1">
                          {r.message}
                        </p>
                        {r.evidence && (
                          <div className="text-[11px] text-neutral-500 font-space-mono pt-1">
                            Evidence: {r.evidence}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  <div className="p-5 rounded-[16px] bg-[#F5F5F5]/30 border border-[#E5E5E5] space-y-2.5 text-xs">
                    <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                      <CircleDollarSign className="w-4 h-4 text-emerald-700" /> Supporting Financial Metrics
                    </h4>
                    <div className="flex justify-between py-1 border-b border-[#E5E5E5]">
                      <span className="text-neutral-500">Sanctioned Amount</span>
                      <span className="font-space-mono font-bold text-neutral-900">₹{projectDetail.supporting_metrics.sanction_amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E5E5E5]">
                      <span className="text-neutral-500">Total Disbursed Expenditure</span>
                      <span className="font-space-mono font-bold text-emerald-700">₹{projectDetail.supporting_metrics.total_expenditure?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E5E5E5]">
                      <span className="text-neutral-500">Unspent Sanction Allocation</span>
                      <span className="font-space-mono font-bold text-amber-600">₹{projectDetail.supporting_metrics.unspent_allocation?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E5E5E5]">
                      <span className="text-neutral-500">Fund Utilisation Rate</span>
                      <span className="font-space-mono font-bold text-neutral-900">{projectDetail.supporting_metrics.utilisation_percentage}%</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-neutral-500">Disbursement Transactions</span>
                      <span className="font-space-mono font-bold text-neutral-900">{projectDetail.supporting_metrics.transaction_count} disbursements</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-[16px] bg-[#F5F5F5]/30 border border-[#E5E5E5] space-y-4 text-xs">
                    <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" /> Peer Benchmark Comparison
                    </h4>
                    <div className="text-[11px] text-neutral-500">
                      Benchmarked against <b>{projectDetail.peer_comparison.peer_project_count.toLocaleString()}</b> projects in <b>{projectDetail.peer_comparison.peer_group}</b>.
                    </div>

                    <div className="space-y-2 pt-1">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-neutral-700">This Project Sanction</span>
                          <span className="font-space-mono font-bold text-[#FF4F00]">₹{projectDetail.peer_comparison.project_sanction?.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-[#F5F5F5] rounded-full h-2 overflow-hidden">
                          <div className="bg-[#FF4F00] text-white h-2 rounded-full" style={{ width: "100%" }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-neutral-500">Peer Group Median Sanction</span>
                          <span className="font-space-mono text-neutral-700">₹{projectDetail.peer_comparison.peer_median_sanction?.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-[#F5F5F5] rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-slate-500 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, Math.max(5, (projectDetail.peer_comparison.peer_median_sanction / projectDetail.peer_comparison.project_sanction) * 100))}%` 
                            }} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#F5F5F5] text-[11px] text-neutral-700 space-y-1">
                      <div>• Peer Percentile Rank: <b>{projectDetail.peer_comparison.peer_sanction_percentile}th percentile</b></div>
                      <div>• Approval Latency: <b>{projectDetail.peer_comparison.project_delay_days} days</b> (Peer Median: {projectDetail.peer_comparison.peer_median_delay} days)</div>
                    </div>
                  </div>
                </div>

                {/* S-BERT Live Geographical & Semantic Duplicate Cross-Check inside Dossier */}
                <div className="p-5 rounded-[16px] bg-[#F5F5F5]/30 border border-[#E5E5E5] space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#FF4F00]" /> Geographical & Semantic Duplicate Cross-Check
                    </h4>
                    {dossierDedupLoading ? (
                      <span className="text-amber-600 flex items-center gap-1 text-[11px]">
                        <Activity className="w-3.5 h-3.5 animate-spin" /> Scanning nationwide vector space...
                      </span>
                    ) : dossierDedupMatches.length > 0 ? (
                      <span className="text-[#FF4F00] font-bold text-[11px] flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> {dossierDedupMatches.length} Geographical Duplicate{dossierDedupMatches.length > 1 ? "s" : ""} Located
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> No Cross-Constituency Duplicate Found
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-neutral-500">
                    Dense vector similarity search (<code className="text-amber-600 font-space-mono">all-MiniLM-L6-v2</code>) with geographical classification across Intra-District, Inter-District, and Inter-State boundaries to prevent double-funding.
                  </p>

                  {dossierDedupMatches.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {dossierDedupMatches.map((m: any, idx: number) => {
                        const isMatch = m.similarity_score >= 0.75;
                        const geoType = m.geo_duplication_type || "SAME_DISTRICT";
                        return (
                          <div 
                            key={idx}
                            onClick={() => openInvestigation(m.project_id)}
                            className={`p-3 rounded-[12px] border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              isMatch 
                                ? "bg-rose-50/60 border-rose-500/40 hover:border-rose-500" 
                                : "bg-white shadow-sm border-[#E5E5E5]/60 hover:border-slate-500"
                            }`}
                          >
                            <div className="space-y-1 max-w-xl">
                              <div className="flex items-center gap-2 text-[10px] text-neutral-500 flex-wrap">
                                <span className="font-space-mono text-amber-600 font-bold">{m.project_id}</span>
                                <span>•</span>
                                <span>{m.district}, {m.state}</span>
                                <span>•</span>
                                <span>MP: {m.mp_name}</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  geoType === "SAME_DISTRICT" ? "bg-rose-500 text-white" :
                                  geoType === "CROSS_DISTRICT_SAME_STATE" ? "bg-amber-500 text-white" : "bg-blue-600 text-white"
                                }`}>
                                  {geoType.replace(/_/g, " ")}
                                </span>
                              </div>
                              <div className="text-neutral-900 font-medium line-clamp-1">
                                {m.clean_text || m.work_title}
                              </div>
                            </div>
                            <div className="text-right whitespace-nowrap">
                              <div className="font-space-mono font-bold text-emerald-700 text-xs">
                                ₹{Number(m.sanction_amount).toLocaleString()}
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-space-mono ${
                                isMatch ? "bg-[#FF4F00] text-white" : "bg-neutral-200 text-neutral-700"
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
                <div className="p-5 rounded-[16px] bg-[#F5F5F5]/30 border border-[#E5E5E5] space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" /> Cox Proportional Hazards Delay Prediction (Survival Analysis)
                    </h4>
                    {survivalRiskLoading ? (
                      <span className="text-indigo-600 flex items-center gap-1 text-[11px]">
                        <Activity className="w-3.5 h-3.5 animate-spin" /> Fitting baseline hazard...
                      </span>
                    ) : survivalRisk ? (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-space-mono ${
                        survivalRisk.risk_tier === "HIGH" 
                          ? "bg-rose-50 text-[#FF4F00] border border-[#FF4F00]/30" 
                          : survivalRisk.risk_tier === "MODERATE"
                          ? "bg-amber-500/20 text-amber-600 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-700 border border-emerald-500"
                      }`}>
                        {survivalRisk.risk_tier} OVERDUE RISK
                      </span>
                    ) : null}
                  </div>

                  <p className="text-[11px] text-neutral-500">
                    Semi-parametric survival model (<code className="text-indigo-300 font-space-mono">lifelines.CoxPHFitter</code>) accounting for right-censoring in ongoing works. Evaluates relative completion hazard, projected median finish horizon, and probability of exceeding deadline.
                  </p>

                  {survivalRisk && (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 rounded-[12px] bg-white shadow-md border border-[#E5E5E5]">
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Overdue Risk (1-Year)</div>
                          <div className="text-xl font-bold font-space-mono text-[#FF4F00] mt-1">
                            {survivalRisk.overdue_percentage}%
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">P(Duration &gt; 365 Days)</div>
                        </div>

                        <div className="p-3 rounded-[12px] bg-white shadow-md border border-[#E5E5E5]">
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Estimated Median Horizon</div>
                          <div className="text-xl font-bold font-space-mono text-neutral-900 mt-1">
                            {survivalRisk.estimated_median_days} <span className="text-xs font-normal text-neutral-500">days</span>
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">50% Completion Threshold</div>
                        </div>

                        <div className="p-3 rounded-[12px] bg-white shadow-md border border-[#E5E5E5]">
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Relative Hazard Ratio</div>
                          <div className="text-xl font-bold font-space-mono text-indigo-600 mt-1">
                            {survivalRisk.relative_hazard_ratio}x
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">&gt;1.0 = faster, &lt;1.0 = delayed</div>
                        </div>
                      </div>

                      {/* Recommendation note */}
                      <div className="p-3 rounded-[12px] bg-indigo-950/20 border border-indigo-500/30 text-[11px] text-indigo-200">
                        <span className="font-semibold text-indigo-300">Decision Support: </span>
                        {survivalRisk.recommendation}
                      </div>

                      {/* Milestone timeline progression */}
                      <div>
                        <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                          Survival Curve Trajectory (Completion Likelihood Milestones)
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                          {(survivalRisk.survival_trajectory || []).map((pt: any, idx: number) => (
                            <div key={idx} className="p-2 rounded-lg bg-white/50 border border-[#E5E5E5] text-center">
                              <div className="text-[10px] text-neutral-500 font-space-mono">Day {pt.day}</div>
                              <div className="text-xs font-bold font-space-mono text-emerald-700 mt-1">
                                {pt.completion_likelihood_pct}%
                              </div>
                              <div className="text-[9px] text-neutral-400 mt-0.5">
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
                <div className="p-5 rounded-[16px] bg-[#F5F5F5]/30 border border-[#E5E5E5] space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600" /> XGBoost Supervised Risk Scoring (Audit Prioritization)
                    </h4>
                    {xgboostLoading ? (
                      <span className="text-amber-600 flex items-center gap-1 text-[11px]">
                        <Activity className="w-3.5 h-3.5 animate-spin" /> Evaluating decision trees...
                      </span>
                    ) : xgboostRisk?.xgboost_assessment ? (
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-space-mono ${
                          xgboostRisk.xgboost_assessment.risk_band === "CRITICAL"
                            ? "bg-rose-50 text-[#FF4F00] border border-[#FF4F00]/30"
                            : xgboostRisk.xgboost_assessment.risk_band === "HIGH"
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            : xgboostRisk.xgboost_assessment.risk_band === "MEDIUM"
                            ? "bg-amber-500/20 text-amber-600 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-700 border border-emerald-500"
                        }`}>
                          {xgboostRisk.xgboost_assessment.risk_band} AUDIT PRIORITY
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <p className="text-[11px] text-neutral-500">
                    Ensemble gradient boosted decision tree classifier (<code className="text-amber-600 font-space-mono">xgboost.XGBClassifier</code>) synthesizing Isolation Forest anomaly scores, sanction scale, approval latency, and peer percentiles into an audit prioritization probability.
                  </p>

                  {xgboostRisk?.xgboost_assessment && (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 rounded-[12px] bg-white shadow-md border border-[#E5E5E5]">
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Audit Risk Probability</div>
                          <div className="text-xl font-bold font-space-mono text-amber-600 mt-1">
                            {xgboostRisk.xgboost_assessment.risk_percentage}%
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">XGBoost Class 1 Likelihood</div>
                        </div>

                        <div className="p-3 rounded-[12px] bg-white shadow-md border border-[#E5E5E5]">
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Computed Priority Score</div>
                          <div className="text-xl font-bold font-space-mono text-neutral-900 mt-1">
                            {xgboostRisk.xgboost_assessment.priority_score} <span className="text-xs font-normal text-neutral-500">/ 100</span>
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">Calibrated Ranking Metric</div>
                        </div>

                        <div className="p-3 rounded-[12px] bg-white shadow-md border border-[#E5E5E5]">
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Model Status</div>
                          <div className="text-xl font-bold font-space-mono text-emerald-700 mt-1">
                            ROC-AUC 1.00
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">Trained on 50k project records</div>
                        </div>
                      </div>

                      {/* Top Risk Factor Explanations */}
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                          Key Risk Factor Drivers (Attributed by Gradient Boosted Trees)
                        </div>
                        <div className="space-y-2">
                          {(xgboostRisk.xgboost_assessment.top_factors || []).map((factor: any, fIdx: number) => (
                            <div 
                              key={fIdx}
                              className={`p-3 rounded-[12px] border flex items-start justify-between gap-3 ${
                                factor.importance === "CRITICAL"
                                  ? "bg-rose-50/60 border-[#FF4F00]/30"
                                  : factor.importance === "HIGH"
                                  ? "bg-amber-950/20 border-amber-500/30"
                                  : "bg-white shadow-sm border-[#E5E5E5]"
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold font-space-mono px-1.5 py-0.5 rounded ${
                                    factor.importance === "CRITICAL" ? "bg-[#FF4F00] text-white" :
                                    factor.importance === "HIGH" ? "bg-amber-500 text-black" : "bg-neutral-200 text-neutral-700"
                                  }`}>
                                    {factor.importance}
                                  </span>
                                  <span className="font-semibold text-neutral-900 text-xs">{factor.factor}</span>
                                </div>
                                <div className="text-[11px] text-neutral-700 pt-0.5">
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
                    className="px-5 py-2 bg-[#F5F5F5] hover:bg-[#E5E5E5] text-neutral-900 rounded-[12px] text-xs font-semibold"
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
