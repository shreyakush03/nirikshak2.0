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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 animate-spin text-rose-500" />
          <p className="text-slate-400 text-sm">Loading details for {stateName}...</p>
        </div>
      </div>
    );
  }

  if (error || !stateData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="w-10 h-10 text-amber-400" />
        <p className="text-slate-300">{error || "State data unavailable"}</p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  const { metrics, top_anomalies } = stateData;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-rose-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Investigation Dashboard</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-400">
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
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-16 -left-16 w-56 h-56 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Region Tag */}
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-rose-400 mb-3">
              <MapPin className="w-4 h-4" />
              <span>State / Union Territory Dossier</span>
            </div>

            {/* STATE / UT NAME IN BIG LETTER */}
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none mb-6">
              {stateData.state_name}
            </h1>

            <p className="text-xs text-slate-400 leading-relaxed mb-8">
              Consolidated governance overview including parliamentary representation, MPLADS capital allocations, fund expenditure pace, and completed asset infrastructure.
            </p>

            {/* 4 REQUIRED METRIC CARDS DIRECTLY UNDER THE NAME */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* 1. Total MPs */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Total MPs</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-white font-mono">
                    {metrics.total_mps}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Lok Sabha & Rajya Sabha</div>
                </div>
              </div>

              {/* 2. Allocated Amount */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Allocated Amt</span>
                  <CircleDollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-emerald-400 font-mono">
                    ₹{metrics.allocated_amt_cr} <span className="text-xs font-semibold text-emerald-500">Cr</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Official MPLADS Entitlement</div>
                </div>
              </div>

              {/* 3. Expenditure Rate */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Expenditure Rate</span>
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-amber-400 font-mono">
                    {metrics.expenditure_rate}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Disbursed vs Sanctioned</div>
                </div>
              </div>

              {/* 4. Works Completed */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Works Completed</span>
                  <CheckCircle2 className="w-4 h-4 text-rose-400" />
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-white font-mono">
                    {metrics.works_completed?.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Completed projects filed</div>
                </div>
              </div>

            </div>

            {/* Supplementary Summary Footer */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 text-xs text-slate-400 space-y-2">
              <div className="flex justify-between">
                <span>Total Active Works Analyzed:</span>
                <b className="text-white font-mono">{metrics.total_projects?.toLocaleString()}</b>
              </div>
              <div className="flex justify-between">
                <span>Flagged Statistical Anomalies:</span>
                <b className="text-rose-400 font-mono">{metrics.anomaly_count} works (Critical: {metrics.critical_count})</b>
              </div>
              <div className="flex justify-between">
                <span>Total Sanctioned Capital:</span>
                <b className="text-white font-mono">₹{metrics.total_sanction_cr} Cr</b>
              </div>
              <div className="flex justify-between">
                <span>Total Expenditure Disbursed:</span>
                <b className="text-emerald-400 font-mono">₹{metrics.total_expenditure_cr} Cr</b>
              </div>
            </div>

          </div>

          {/* ============================================================== */}
          {/* PART 2: ANOMALY INVESTIGATION & TOP OUTLIERS FOR THIS STATE   */}
          {/* ============================================================== */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Risk Distribution Header */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                {stateData.state_name} Risk Breakdown & Investigation Outliers
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Projects requiring review due to substantial divergence from peer-group expenditure pace, sanction norms, or approval delays.
              </p>

              <div className="grid grid-cols-4 gap-2">
                <div className="p-3 bg-slate-800/50 rounded-xl text-center">
                  <span className="text-[10px] text-rose-400 font-semibold block uppercase">Critical</span>
                  <span className="text-xl font-bold font-mono text-white">{metrics.critical_count}</span>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-xl text-center">
                  <span className="text-[10px] text-amber-400 font-semibold block uppercase">High</span>
                  <span className="text-xl font-bold font-mono text-white">{metrics.high_count}</span>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-xl text-center">
                  <span className="text-[10px] text-blue-400 font-semibold block uppercase">Medium</span>
                  <span className="text-xl font-bold font-mono text-white">{metrics.medium_count}</span>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Low</span>
                  <span className="text-xl font-bold font-mono text-white">{metrics.low_count}</span>
                </div>
              </div>
            </div>

            {/* Outliers Table */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Top Priority Flagged Works in {stateData.state_name}
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">Ranked by Priority Score</span>
              </div>

              {top_anomalies.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-800/20 rounded-2xl">
                  No statistical anomalies flagged for {stateData.state_name}. All projects adhere to peer distribution norms.
                </div>
              ) : (
                <div className="space-y-3">
                  {top_anomalies.map((item: any) => (
                    <div 
                      key={item.project_id}
                      className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-white">{item.project_id}</span>
                        <div className="flex items-center gap-2">
                          {getRiskBadge(item.risk_level)}
                          <span className="font-mono text-slate-400 text-[11px]">Priority: <b>{item.priority_score}</b> (#{item.priority_rank})</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-200 font-medium">
                        {item.project_name}
                      </div>

                      <div className="text-[11px] text-rose-400/90 font-medium bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                        {item.primary_reason}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 font-mono pt-1">
                        <div>Sanction: <b className="text-white">₹{item.sanction_amount?.toLocaleString()}</b></div>
                        <div>Utilisation: <b className={item.utilisation_percentage === 0 ? "text-rose-400" : "text-emerald-400"}>{item.utilisation_percentage}%</b></div>
                        <div>Delay: <b className="text-amber-400">{item.delay_days} days</b></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 text-center">
                <button
                  onClick={() => router.push(`/?state=${encodeURIComponent(stateData.state_name)}`)}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 mx-auto"
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

