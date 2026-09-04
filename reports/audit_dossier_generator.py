import io
import json
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether

def generate_audit_dossier_pdf(project_id: str, db_path: str) -> bytes:
    """
    Generates a professional, print-ready Statutory Audit Dossier PDF for a given project/work.
    Includes:
    - Official Header & Stamp
    - Project Identification & Parliamentary Constituency Data
    - Step 4 Multi-Model Consensus Composite Risk Breakdown
    - Isolation Forest, Sentence-BERT, CoxPH Delay, XGBoost, and Vendor Anomaly Signals
    - Statutory Auditor Plain-English Remarks & Recommended Action Plan
    """
    import duckdb
    from pipelines.unified_sync_orchestrator import sync_work_record

    # Fetch sync work record with multi-model consensus
    work_data = None
    try:
        work_data = sync_work_record(project_id, db_path=db_path)
    except Exception:
        work_data = None

    # Fetch project details from duckdb
    con = duckdb.connect(db_path, read_only=True)
    proj_row = con.execute("""
        SELECT 
            project_id, project_name, state, district, mp_name, house, 
            work_category, sanction_amount, total_expenditure,
            sanction_date, work_status, anomaly_flag, risk_level, priority_score,
            anomaly_score, priority_rank, anomaly_reasons_json, primary_vendor,
            utilisation_percentage, delay_days
        FROM project_investigations
        WHERE project_id = ?
    """, [project_id]).fetchone()
    con.close()

    if not proj_row:
        raise ValueError(f"Project {project_id} not found in database.")

    (pid, pname, state, district, mp_name, house,
     cat, sanc_amt, exp_amt,
     sanc_date, status, is_anom, risk_lvl, prio_score,
     anom_score, prio_rank, raw_reasons, vendor_name,
     util_pct, delay_days) = proj_row

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    header_style = ParagraphStyle(
        'DocHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0f172a'),
        alignment=1 # Center
    )
    sub_header_style = ParagraphStyle(
        'DocSubHeader',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#475569'),
        alignment=1
    )
    sec_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#1e293b')
    )
    cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#1e293b')
    )
    cell_text = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#334155')
    )
    risk_pill = ParagraphStyle(
        'RiskPill',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#dc2626') if risk_lvl == 'CRITICAL' else colors.HexColor('#ea580c')
    )

    story = []

    # Title & Emblems
    story.append(Paragraph("GOVERNMENT OF INDIA • MINISTRY OF STATISTICS & PROGRAMME IMPLEMENTATION", sub_header_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph("MPLADS STATUTORY AUDIT & ANOMALY INVESTIGATION DOSSIER", header_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph("CONFIDENTIAL • GENERATED UNDER THE NIRIKSHAK 2.0 AI MONITORING SYSTEM", sub_header_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f172a'), spaceAfter=10))

    # Project Profile Table
    story.append(Paragraph("1. PROJECT IDENTIFICATION & PARLIAMENTARY PROFILE", sec_title_style))
    story.append(Spacer(1, 5))

    profile_data = [
        [Paragraph("Project Sanction ID:", cell_bold), Paragraph(str(pid), cell_text),
         Paragraph("Risk Classification:", cell_bold), Paragraph(f"<b>{risk_lvl}</b> (Priority #{prio_rank})", risk_pill)],
        [Paragraph("Work Description:", cell_bold), Paragraph(str(pname or 'N/A')[:90], cell_text),
         Paragraph("Work Category:", cell_bold), Paragraph(str(cat or 'N/A'), cell_text)],
        [Paragraph("Hon'ble MP:", cell_bold), Paragraph(str(mp_name or 'N/A'), cell_text),
         Paragraph("Parliamentary House:", cell_bold), Paragraph(str(house or 'N/A'), cell_text)],
        [Paragraph("State / UT:", cell_bold), Paragraph(str(state or 'N/A'), cell_text),
         Paragraph("District / IDA Authority:", cell_bold), Paragraph(str(district or 'N/A')[:40], cell_text)],
        [Paragraph("Sanction Date:", cell_bold), Paragraph(str(sanc_date or 'N/A'), cell_text),
         Paragraph("Work Status:", cell_bold), Paragraph(str(status or 'N/A'), cell_text)]
    ]

    t_profile = Table(profile_data, colWidths=[110, 160, 110, 160])
    t_profile.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_profile)
    story.append(Spacer(1, 10))

    # Financial Summary Table
    story.append(Paragraph("2. FINANCIAL ALLOCATION & DISBURSEMENT RECORD", sec_title_style))
    story.append(Spacer(1, 5))

    sanc_val = f"Rs. {sanc_amt:,.2f}" if sanc_amt else "Rs. 0.00"
    exp_val = f"Rs. {exp_amt:,.2f}" if exp_amt else "Rs. 0.00"
    util_str = f"{util_pct:.1f}%" if util_pct is not None else ("0.0%" if not sanc_amt else f"{(exp_amt/sanc_amt*100):.1f}%")
    vendor_display = str(vendor_name or "N/A")[:35]

    fin_data = [
        [Paragraph("Recommended / Sanctioned Cost", cell_bold),
         Paragraph("Total Reported Expenditure", cell_bold),
         Paragraph("Fund Utilisation Ratio", cell_bold),
         Paragraph("Primary Assigned Vendor", cell_bold)],
        [Paragraph(sanc_val, cell_text),
         Paragraph(exp_val, cell_text),
         Paragraph(util_str, cell_bold),
         Paragraph(vendor_display, cell_text)]
    ]
    t_fin = Table(fin_data, colWidths=[135, 135, 135, 135])
    t_fin.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#ffffff')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#94a3b8')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_fin)
    story.append(Spacer(1, 10))

    # Step 4 Multi-Model Consensus Analysis
    story.append(Paragraph("3. STEP 4 SYNCHRONIZED MULTI-MODEL RISK ASSESSMENT", sec_title_style))
    story.append(Spacer(1, 5))

    model_headers = [
        Paragraph("Analytical Engine", cell_bold),
        Paragraph("Subsystem Output / Signal", cell_bold),
        Paragraph("Model Confidence & Diagnostic", cell_bold)
    ]

    drill = work_data.get("drilldown", {}) if work_data else {}
    iforest_val = drill.get("isolation_forest", {}).get("anomaly_score", anom_score)
    sbert_count = drill.get("sentence_bert", {}).get("potential_duplicates_found", 0)
    delay_est = drill.get("survival_delay", {}).get("predicted_delay_days", delay_days if delay_days else "N/A")
    xgb_score = drill.get("xgboost", {}).get("risk_score", "N/A")
    vendor_stat = "Identified in Monopolistic Cluster" if drill.get("vendor_graph", {}).get("vendor_collusion_flag") else "Normal Network Centrality"

    model_rows = [
        model_headers,
        [Paragraph("<b>Isolation Forest</b> (Outlier & Cost Anomaly)", cell_text),
         Paragraph(f"Score: {iforest_val:.4f}" if isinstance(iforest_val, float) else str(iforest_val), cell_bold),
         Paragraph("Evaluated against category cost distribution & peer z-scores", cell_text)],
        [Paragraph("<b>Sentence-BERT</b> (Semantic Duplicate Match)", cell_text),
         Paragraph(f"{sbert_count} Vector Match(es)", cell_bold),
         Paragraph("Cosine similarity vector matching across district work descriptions", cell_text)],
        [Paragraph("<b>CoxPH Survival Model</b> (Timeline & Delay Risk)", cell_text),
         Paragraph(f"Est. Delay: {delay_est} days", cell_bold),
         Paragraph("Baseline cumulative hazard function adjusted for administrative IDA latency", cell_text)],
        [Paragraph("<b>Supervised XGBoost</b> (Audit Prioritization)", cell_text),
         Paragraph(f"Risk Prob: {xgb_score}", cell_bold),
         Paragraph("Trained on historical parliamentary audit queries and cost escalations", cell_text)],
        [Paragraph("<b>Bipartite Graph Analytics</b> (Vendor Monopoly)", cell_text),
         Paragraph(str(vendor_stat), cell_bold),
         Paragraph("HHI concentration index and multi-constituency syndicate scoring", cell_text)],
    ]

    t_models = Table(model_rows, colWidths=[170, 150, 220])
    t_models.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#94a3b8')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_models)
    story.append(Spacer(1, 10))

    # Plain-English Statutory Explanations
    story.append(Paragraph("4. STATUTORY AUDIT FINDINGS & DETECTED ANOMALY FLAGS", sec_title_style))
    story.append(Spacer(1, 5))

    reasons = work_data.get("flag_reasons", []) if work_data else []
    if not reasons and raw_reasons:
        try:
            reasons = json.loads(raw_reasons) if isinstance(raw_reasons, str) else [str(raw_reasons)]
        except Exception:
            reasons = [str(raw_reasons)]

    if reasons:
        reason_cells = [[Paragraph(f"• <b>Finding #{i+1}:</b> {r}", cell_text)] for i, r in enumerate(reasons)]
    else:
        reason_cells = [[Paragraph("• No statutory non-compliance or abnormal cost flags detected during automated screening.", cell_text)]]

    t_reasons = Table(reason_cells, colWidths=[540])
    t_reasons.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fff1f2') if risk_lvl in ['CRITICAL', 'HIGH'] else colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#fecdd3') if risk_lvl in ['CRITICAL', 'HIGH'] else colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_reasons)
    story.append(Spacer(1, 10))

    # Actionable Directives & Signature Block
    action_text = (
        "<b>MANDATORY AUDIT DIRECTIVE:</b> In accordance with Paragraph 5.4 of the MPLADS Operational Guidelines, "
        "the District Authority / Implementing Agency is requested to submit physical verification photographs and a "
        "Fund Utilization Certificate (UC) within 14 calendar days. Discrepancies exceeding ±15% from sanctioned estimates "
        "require joint inspection by the District Nodal Officer."
    )
    story.append(Paragraph(action_text, cell_text))
    story.append(Spacer(1, 16))

    sig_data = [
        [Paragraph("<b>Prepared by:</b> Automated Multi-Model Engine", cell_text),
         Paragraph("<b>Verified by:</b> District Nodal Agency", cell_text),
         Paragraph("<b>Countersigned:</b> Ministry of Statistics & PI", cell_text)],
        [Spacer(1, 15), Spacer(1, 15), Spacer(1, 15)],
        [Paragraph("System Identifier: MPLADS-AI-v2.0", sub_header_style),
         Paragraph("Official Seal & Date", sub_header_style),
         Paragraph("Authorized Signatory", sub_header_style)]
    ]
    t_sig = Table(sig_data, colWidths=[180, 180, 180])
    t_sig.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(KeepTogether(t_sig))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
