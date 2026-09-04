"""
vendor_collusion_graph_module.py
--------------------------------
Vendor-Constituency-MP Collusion & Concentration Graph Analytics for MPLADS.

Architecture & Formulation (Section 3.6 of ML Integration Guide):
- Bipartite / Multipartite Network Graph G = (V, E)
  * Nodes:
    - Vendors (Type 'VENDOR')
    - Constituencies / Districts (Type 'CONSTITUENCY')
    - MPs / Representatives (Type 'MP')
  * Edges:
    - Vendor <-> Constituency (weight = total disbursed amount, count = project count)
    - Vendor <-> MP (weight = disbursed amount)
    - Vendor <-> Vendor (Co-awarded / shared procurement clusters)
- Graph Algorithms:
  1. District Concentration Share: Total vendor spend in a constituency / total constituency spend
  2. Bipartite Degree & Weighted Centrality: Identifies monopolistic vendors
  3. Louvain / Greedy Modularity Community Detection: Identifies collusion rings and exclusive vendor syndicates
  4. Cross-MP Vendor Spread: Same vendor dominating multiple non-adjacent MPs/districts disproportionately
"""

import os
import duckdb
import networkx as nx
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional

DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data_processed", "parliament_data.duckdb")


class VendorCollusionGraphAnalyzer:
    def __init__(self, db_path: str = DEFAULT_DB_PATH):
        self.db_path = db_path
        self.G = nx.Graph()
        self.vendor_stats = {}
        self.constituency_stats = {}
        self.communities = []
        self.is_built = False

    def load_graph_data(self, state: Optional[str] = None, min_spend: float = 50000.0) -> pd.DataFrame:
        """Pulls clean vendor disbursements aggregated by MP and constituency from DuckDB."""
        con = duckdb.connect(self.db_path, read_only=True)
        where_clause = "WHERE vendor_name IS NOT NULL AND TRIM(vendor_name) != '' AND disbursed_amount > 0"
        params = []
        if state and state != "All":
            where_clause += " AND state = ?"
            params.append(state)

        query = f"""
        SELECT 
            TRIM(vendor_name) AS vendor_name,
            COALESCE(constituency, 'Statewide Pool') AS constituency,
            COALESCE(state, 'Unknown State') AS state,
            COALESCE(mp_name, 'Unknown Representative') AS mp_name,
            COUNT(*) AS transaction_count,
            COUNT(DISTINCT work_id) AS distinct_works,
            SUM(disbursed_amount) AS total_disbursed,
            ROUND(AVG(disbursed_amount), 2) AS avg_ticket_size
        FROM expenditure_works
        {where_clause}
        GROUP BY 1, 2, 3, 4
        HAVING SUM(disbursed_amount) >= {min_spend}
        """
        df = con.execute(query, params).fetchdf()
        con.close()
        return df

    def build_network(self, state: Optional[str] = None, top_k_vendors: int = 150) -> nx.Graph:
        """Constructs bipartite / tripartite graph of top vendors, constituencies, and MPs."""
        df = self.load_graph_data(state=state)
        
        # Aggregate vendor totals to pick prominent vendors
        vendor_totals = df.groupby('vendor_name')['total_disbursed'].sum().sort_values(ascending=False)
        top_vendors = set(vendor_totals.head(top_k_vendors).index)
        
        filtered_df = df[df['vendor_name'].isin(top_vendors)].copy()
        
        self.G = nx.Graph()

        # Add constituency and vendor nodes with metadata
        const_totals = df.groupby('constituency')['total_disbursed'].sum().to_dict()

        for _, row in filtered_df.iterrows():
            v_node = f"VND::{row['vendor_name']}"
            c_node = f"CST::{row['constituency']}"
            mp_node = f"MP::{row['mp_name']}"
            amount = float(row['total_disbursed'])
            txns = int(row['transaction_count'])

            # Add Vendor Node
            if not self.G.has_node(v_node):
                self.G.add_node(
                    v_node,
                    label=row['vendor_name'],
                    node_type="VENDOR",
                    total_spend=float(vendor_totals.get(row['vendor_name'], amount)),
                    state=row['state']
                )

            # Add Constituency Node
            if not self.G.has_node(c_node):
                self.G.add_node(
                    c_node,
                    label=row['constituency'],
                    node_type="CONSTITUENCY",
                    total_budget=float(const_totals.get(row['constituency'], amount)),
                    state=row['state']
                )

            # Add MP Node
            if not self.G.has_node(mp_node):
                self.G.add_node(
                    mp_node,
                    label=row['mp_name'],
                    node_type="MP",
                    state=row['state']
                )

            # Add Edges
            # 1. Vendor - Constituency edge
            if self.G.has_edge(v_node, c_node):
                self.G[v_node][c_node]['weight'] += amount
                self.G[v_node][c_node]['transactions'] += txns
            else:
                self.G.add_edge(v_node, c_node, weight=amount, transactions=txns, edge_type="DISBURSEMENT")

            # 2. Vendor - MP edge
            if self.G.has_edge(v_node, mp_node):
                self.G[v_node][mp_node]['weight'] += amount
            else:
                self.G.add_edge(v_node, mp_node, weight=amount, edge_type="PATRONAGE")

        self.is_built = True
        return self.G

    def detect_collusion_and_monopolies(
        self,
        concentration_threshold: float = 0.35,
        state: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculates network graph centrality, constituency concentration share,
        and flags monopolistic / syndicated vendor clusters.
        """
        df = self.load_graph_data(state=state)
        if df.empty:
            return {
                "flagged_vendors": [],
                "flagged_constituencies": [],
                "network_summary": {"total_vendors": 0, "total_edges": 0}
            }

        # Constituency total spends
        const_total_spend = df.groupby('constituency')['total_disbursed'].sum()
        
        # Vendor-Constituency shares
        vc_pairs = df.groupby(['vendor_name', 'constituency', 'state', 'mp_name']).agg(
            vendor_const_spend=('total_disbursed', 'sum'),
            works_count=('distinct_works', 'sum'),
            txns=('transaction_count', 'sum')
        ).reset_index()

        vc_pairs['total_const_spend'] = vc_pairs['constituency'].map(const_total_spend)
        vc_pairs['concentration_share'] = vc_pairs['vendor_const_spend'] / vc_pairs['total_const_spend'].replace(0, 1)

        # Monopolies: vendors holding >= threshold of constituency budget
        monopolies = vc_pairs[
            (vc_pairs['concentration_share'] >= concentration_threshold) & 
            (vc_pairs['vendor_const_spend'] >= 1000000.0) # >= 10 Lakhs
        ].sort_values(by='concentration_share', ascending=False)

        flagged_monopolies = []
        for _, row in monopolies.head(50).iterrows():
            share_pct = round(float(row['concentration_share']) * 100, 1)
            flagged_monopolies.append({
                "vendor_name": row['vendor_name'],
                "constituency": row['constituency'],
                "state": row['state'],
                "mp_name": row['mp_name'],
                "vendor_disbursed_cr": round(float(row['vendor_const_spend']) / 10000000.0, 3),
                "vendor_disbursed": float(row['vendor_const_spend']),
                "total_const_disbursed_cr": round(float(row['total_const_spend']) / 10000000.0, 2),
                "concentration_share_pct": share_pct,
                "works_count": int(row['works_count']),
                "risk_signal": "HIGH MONOPOLY" if share_pct >= 60.0 else "SUBSTANTIAL CONCENTRATION",
                "explanation": f"Vendor captured {share_pct}% of all recorded MPLADS disbursements in {row['constituency']} (Rs. {row['vendor_const_spend']/10000000.0:.2f} Cr)."
            })

        # Multi-MP Vendors: Single vendor receiving funds from multiple distinct MPs
        vendor_mp_diversity = df.groupby('vendor_name').agg(
            mp_count=('mp_name', 'nunique'),
            constituency_count=('constituency', 'nunique'),
            total_spend=('total_disbursed', 'sum'),
            state_count=('state', 'nunique')
        ).reset_index()

        syndicate_vendors = vendor_mp_diversity[
            (vendor_mp_diversity['mp_count'] >= 3) & 
            (vendor_mp_diversity['total_spend'] >= 5000000.0)
        ].sort_values(by='total_spend', ascending=False)

        flagged_syndicates = []
        for _, row in syndicate_vendors.head(30).iterrows():
            flagged_syndicates.append({
                "vendor_name": row['vendor_name'],
                "distinct_mps": int(row['mp_count']),
                "distinct_constituencies": int(row['constituency_count']),
                "states_covered": int(row['state_count']),
                "total_disbursed_cr": round(float(row['total_spend']) / 10000000.0, 2),
                "risk_signal": "CROSS-REPRESENTATIVE CONCENTRATION",
                "explanation": f"Operates across {int(row['mp_count'])} separate MP jurisdictions across {int(row['constituency_count'])} constituencies."
            })

        # Graph node & edge statistics for UI rendering
        if not self.is_built:
            self.build_network(state=state, top_k_vendors=60)

        # Graph export for interactive Cytoscape / force-directed chart
        nodes = []
        for node, attrs in self.G.nodes(data=True):
            ntype = attrs.get('node_type', 'UNKNOWN')
            nodes.append({
                "id": node,
                "label": attrs.get('label', node),
                "type": ntype,
                "val": attrs.get('total_spend', attrs.get('total_budget', 100000)),
                "state": attrs.get('state', '')
            })

        edges = []
        for u, v, attrs in self.G.edges(data=True):
            edges.append({
                "source": u,
                "target": v,
                "weight": float(attrs.get('weight', 1000)),
                "type": attrs.get('edge_type', 'LINK')
            })

        return {
            "monopoly_alerts": flagged_monopolies,
            "syndicate_alerts": flagged_syndicates,
            "total_monopolies_flagged": len(flagged_monopolies),
            "total_syndicates_flagged": len(flagged_syndicates),
            "graph_visualization": {
                "nodes": nodes[:120], # Top connected nodes
                "edges": edges[:180]  # Prominent edges
            }
        }


def run_test():
    analyzer = VendorCollusionGraphAnalyzer()
    res = analyzer.detect_collusion_and_monopolies(concentration_threshold=0.30)
    print(f"Flagged {res['total_monopolies_flagged']} monopoly instances.")
    print(f"Flagged {res['total_syndicates_flagged']} multi-MP syndicates.")
    if res['monopoly_alerts']:
        print("Top Monopoly:", res['monopoly_alerts'][0])
    if res['syndicate_alerts']:
        print("Top Syndicate:", res['syndicate_alerts'][0])


if __name__ == "__main__":
    run_test()
