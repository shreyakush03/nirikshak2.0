"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Users, 
  CircleDollarSign, 
  TrendingUp, 
  CheckCircle2, 
  ShieldAlert, 
  ExternalLink,
  Activity,
  AlertTriangle,
  Layers,
  MapPin
} from "lucide-react";

export default function StateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawState = params?.name as string;
  const stateName = rawState ? decodeURIComponent(rawState) : "";

  const [stateData, setStateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stateName) return;

    async function fetchStateData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/py/states/${encodeURIComponent(stateName)}`);
        if (!res.ok) {
          throw new Error("Failed to load state details");
        }
        const data = await res.json();
        setStateData(data);
      } catch (err: any) {
        setError(err.message || "Error loading data");
      } finally {
        setLoading(false);
      }
    }

    fetchStateData();
  }, [stateName]);

  const getRiskBadge = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case "CRITICAL":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF4F00]/10 text-[#FF4F00] border border-[#FF4F00]/30">CRITICAL</span>;
      case "HIGH":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300">HIGH</span>;
      case "MEDIUM":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 border border-blue-500">MEDIUM</span>;
      case "LOW":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-neutral-500 border border-slate-500">LOW</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 border border-emerald-500">NORMAL</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 animate-spin text-[#FF4F00]" />
          <p className="text-neutral-500 text-sm">Loading details for {stateName}...</p>
        </div>
      </div>
    );
  }

  if (error || !stateData) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="w-10 h-10 text-[#FACC15]" />
        <p className="text-neutral-700">{error || "State data unavailable"}</p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-[#F5F5F5] hover:bg-[#E5E5E5] text-neutral-900 rounded-[12px] text-xs font-semibold flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  const { metrics, top_anomalies } = stateData;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 antialiased selection:bg-[#FF4F00] selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-[#E5E5E5] bg-white shadow-md backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:h-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Investigation Dashboard</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>MPLADS Analytics Dossier</span>
          </div>
        </div>
      </header>

      {/* Main Container: Split into 2 parts */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ============================================================== */}
          {/* PART 1: STATE/UT NAME IN BIG LETTERS & PRIMARY 4 METRICS     */}
          {/* ============================================================== */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-[#E5E5E5] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-16 -left-16 w-56 h-56 bg-[#FF4F00] text-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Region Tag */}
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#FF4F00] mb-3">
              <MapPin className="w-4 h-4" />
              <span>State / Union Territory Dossier</span>
            </div>

            {/* STATE / UT NAME IN BIG LETTER */}
            <h1 className="text-4xl sm:text-5xl font-black text-neutral-900 tracking-tight leading-none mb-6">
              {stateData.state_name}
            </h1>

            <p className="text-xs text-neutral-500 leading-relaxed mb-8">
              Consolidated governance overview including parliamentary representation, MPLADS capital allocations, fund expenditure pace, and completed asset infrastructure.
            </p>

            {/* 4 REQUIRED METRIC CARDS DIRECTLY UNDER THE NAME */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* 1. Total MPs */}
              <div className="p-4 rounded-[16px] bg-[#F5F5F5]/40 border border-[#E5E5E5]/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-500">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Total MPs</span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-neutral-900 font-space-mono">
                    {metrics.total_mps}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Lok Sabha & Rajya Sabha</div>
                </div>
              </div>

              {/* 2. Allocated Amount */}
              <div className="p-4 rounded-[16px] bg-[#F5F5F5]/40 border border-[#E5E5E5]/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-500">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Allocated Amt</span>
                  <CircleDollarSign className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-emerald-700 font-space-mono">
                    ₹{metrics.allocated_amt_cr} <span className="text-xs font-semibold text-emerald-500">Cr</span>
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Official MPLADS Entitlement</div>
                </div>
              </div>

              {/* 3. Expenditure Rate */}
              <div className="p-4 rounded-[16px] bg-[#F5F5F5]/40 border border-[#E5E5E5]/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-500">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Expenditure Rate</span>
                  <TrendingUp className="w-4 h-4 text-[#FACC15]" />
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-[#FACC15] font-space-mono">
                    {metrics.expenditure_rate}%
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Disbursed vs Sanctioned</div>
                </div>
              </div>

              {/* 4. Works Completed */}
              <div className="p-4 rounded-[16px] bg-[#F5F5F5]/40 border border-[#E5E5E5]/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-500">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Works Completed</span>
                  <CheckCircle2 className="w-4 h-4 text-[#FF4F00]" />
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-neutral-900 font-space-mono">
                    {metrics.works_completed?.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Completed projects filed</div>
                </div>
              </div>

            </div>

            {/* Supplementary Summary Footer */}
            <div className="mt-6 pt-5 border-t border-[#E5E5E5]/80 text-xs text-neutral-500 space-y-2">
              <div className="flex justify-between">
                <span>Total Active Works Analyzed:</span>
                <b className="text-neutral-900 font-space-mono">{metrics.total_projects?.toLocaleString()}</b>
              </div>
              <div className="flex justify-between">
                <span>Flagged Statistical Anomalies:</span>
                <b className="text-[#FF4F00] font-space-mono">{metrics.anomaly_count} works (Critical: {metrics.critical_count})</b>
              </div>
              <div className="flex justify-between">
                <span>Total Sanctioned Capital:</span>
                <b className="text-neutral-900 font-space-mono">₹{metrics.total_sanction_cr} Cr</b>
              </div>
              <div className="flex justify-between">
                <span>Total Expenditure Disbursed:</span>
                <b className="text-emerald-700 font-space-mono">₹{metrics.total_expenditure_cr} Cr</b>
              </div>
            </div>

          </div>

          {/* ============================================================== */}
          {/* PART 2: ANOMALY INVESTIGATION & TOP OUTLIERS FOR THIS STATE   */}
          {/* ============================================================== */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Risk Distribution Header */}
            <div className="p-6 rounded-3xl bg-white shadow-sm border border-[#E5E5E5]">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-[#FF4F00]" />
                {stateData.state_name} Risk Breakdown & Investigation Outliers
              </h3>
              <p className="text-xs text-neutral-500 mt-1 mb-4">
                Projects requiring review due to substantial divergence from peer-group expenditure pace, sanction norms, or approval delays.
              </p>

              <div className="grid grid-cols-4 gap-2">
                <div className="p-3 bg-[#F5F5F5]/50 rounded-[12px] text-center">
                  <span className="text-[10px] text-[#FF4F00] font-semibold block uppercase">Critical</span>
                  <span className="text-xl font-bold font-space-mono text-neutral-900">{metrics.critical_count}</span>
                </div>
                <div className="p-3 bg-[#F5F5F5]/50 rounded-[12px] text-center">
                  <span className="text-[10px] text-[#FACC15] font-semibold block uppercase">High</span>
                  <span className="text-xl font-bold font-space-mono text-neutral-900">{metrics.high_count}</span>
                </div>
                <div className="p-3 bg-[#F5F5F5]/50 rounded-[12px] text-center">
                  <span className="text-[10px] text-blue-600 font-semibold block uppercase">Medium</span>
                  <span className="text-xl font-bold font-space-mono text-neutral-900">{metrics.medium_count}</span>
                </div>
                <div className="p-3 bg-[#F5F5F5]/50 rounded-[12px] text-center">
                  <span className="text-[10px] text-neutral-500 font-semibold block uppercase">Low</span>
                  <span className="text-xl font-bold font-space-mono text-neutral-900">{metrics.low_count}</span>
                </div>
              </div>
            </div>

            {/* Outliers Table */}
            <div className="p-6 rounded-3xl bg-white shadow-sm border border-[#E5E5E5] space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#FACC15]" />
                  Top Priority Flagged Works in {stateData.state_name}
                </h4>
                <span className="text-[11px] text-neutral-400 font-space-mono">Ranked by Priority Score</span>
              </div>

              {top_anomalies.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400 bg-[#F5F5F5]/20 rounded-[16px]">
                  No statistical anomalies flagged for {stateData.state_name}. All projects adhere to peer distribution norms.
                </div>
              ) : (
                <div className="space-y-3">
                  {top_anomalies.map((item: any) => (
                    <div 
                      key={item.project_id}
                      className="p-4 rounded-[16px] bg-[#F5F5F5]/40 border border-[#E5E5E5]/60 hover:border-[#D4D4D4] transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-space-mono font-bold text-neutral-900">{item.project_id}</span>
                        <div className="flex items-center gap-2">
                          {getRiskBadge(item.risk_level)}
                          <span className="font-space-mono text-neutral-500 text-[11px]">Priority: <b>{item.priority_score}</b> (#{item.priority_rank})</span>
                        </div>
                      </div>

                      <div className="text-xs text-neutral-800 font-medium">
                        {item.project_name}
                      </div>

                      <div className="text-[11px] text-[#FF4F00]/90 font-medium bg-[#FF4F00] text-white/10 p-2 rounded-lg border border-rose-500/20">
                        {item.primary_reason}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[10px] text-neutral-500 font-space-mono pt-1">
                        <div>Sanction: <b className="text-neutral-900">₹{item.sanction_amount?.toLocaleString()}</b></div>
                        <div>Utilisation: <b className={item.utilisation_percentage === 0 ? "text-[#FF4F00]" : "text-emerald-700"}>{item.utilisation_percentage}%</b></div>
                        <div>Delay: <b className="text-[#FACC15]">{item.delay_days} days</b></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 text-center">
                <button
                  onClick={() => router.push(`/?state=${encodeURIComponent(stateData.state_name)}`)}
                  className="text-xs font-semibold text-[#FF4F00] hover:text-rose-300 transition-colors flex items-center gap-1 mx-auto"
                >
                  <span>View All {metrics.anomaly_count} Flagged Projects in Main Queue</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

