"""
Sentence-BERT Model for MPLADS Duplicate Work Detection & Semantic Matching
----------------------------------------------------------------------------
Uses the sentence-transformers architecture ('all-MiniLM-L6-v2') to generate
dense semantic vector embeddings for MPLADS work titles/descriptions.
"""

import os
import re
import duckdb
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EMBEDDINGS_DIR = os.path.join(os.path.dirname(BASE_DIR), "data_processed", "embeddings")
DB_PATH = os.path.join(os.path.dirname(BASE_DIR), "data_processed", "parliament_data.duckdb")

os.makedirs(EMBEDDINGS_DIR, exist_ok=True)

MODEL_NAME = "all-MiniLM-L6-v2"

def clean_work_text(text: str) -> str:
    """Cleans title, removing work ID prefix codes and noise."""
    if not text or pd.isna(text):
        return ""
    cleaned = re.sub(r'^[A-Z0-9]+/[A-Z0-9]+/[0-9]{4}-[0-9]{4}/[0-9]+[\s\-:]*', '', str(text).strip())
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()

class SBERTDedupModel:
    def __init__(self, model_name: str = MODEL_NAME):
        self.model = SentenceTransformer(model_name)
        self.embeddings: Optional[np.ndarray] = None
        self.metadata: Optional[pd.DataFrame] = None
        self.embeddings_file = os.path.join(EMBEDDINGS_DIR, "work_embeddings.npy")
        self.meta_file = os.path.join(EMBEDDINGS_DIR, "work_meta.parquet")

    def build_and_save_index(self, sample_size: Optional[int] = 12000):
        con = duckdb.connect(DB_PATH, read_only=True)
        query = """
            SELECT 
                project_id, state, district, constituency, mp_name, house,
                work_category, sanction_amount, work_title,
                work_status, priority_score
            FROM project_investigations
            WHERE work_title IS NOT NULL AND work_title != ''
        """
        if sample_size:
            query += f" LIMIT {sample_size}"
        
        df = con.execute(query).df()
        con.close()

        df['clean_text'] = df['work_title'].apply(clean_work_text)
        df = df[df['clean_text'].str.len() > 5].reset_index(drop=True)

        texts = df['clean_text'].tolist()
        embeddings = self.model.encode(texts, batch_size=64, show_progress_bar=False, convert_to_numpy=True, normalize_embeddings=True)

        np.save(self.embeddings_file, embeddings)
        df.to_parquet(self.meta_file, index=False)
        self.embeddings = embeddings
        self.metadata = df

    def load_index(self):
        if not os.path.exists(self.embeddings_file) or not os.path.exists(self.meta_file):
            self.build_and_save_index(sample_size=12000)
        else:
            self.embeddings = np.load(self.embeddings_file)
            self.metadata = pd.read_parquet(self.meta_file)

    def find_duplicates(
        self, 
        query_text: str, 
        state: Optional[str] = None, 
        district: Optional[str] = None, 
        top_k: int = 5,
        threshold: float = 0.70
    ) -> List[Dict[str, Any]]:
        if self.embeddings is None:
            self.load_index()

        cleaned_query = clean_work_text(query_text)
        query_embedding = self.model.encode([cleaned_query], convert_to_numpy=True, normalize_embeddings=True)[0]
        scores = np.dot(self.embeddings, query_embedding)

        mask = np.ones(len(self.metadata), dtype=bool)
        if state and state != "All":
            mask &= (self.metadata['state'].str.lower() == state.lower())
        if district and district != "All":
            mask &= self.metadata['district'].str.contains(district, case=False, na=False)

        valid_indices = np.where(mask)[0]
        if len(valid_indices) == 0:
            return []

        filtered_scores = scores[valid_indices]
        top_sub_idx = np.argsort(filtered_scores)[::-1][:top_k]
        top_indices = valid_indices[top_sub_idx]

        results = []
        for idx in top_indices:
            sim_score = float(scores[idx])
            row = self.metadata.iloc[idx]
            is_dup = sim_score >= threshold
            
            results.append({
                "project_id": row["project_id"],
                "work_title": row["work_title"],
                "clean_text": row["clean_text"],
                "state": row["state"],
                "district": row["district"],
                "mp_name": row["mp_name"],
                "category": row["work_category"],
                "sanction_amount": float(row["sanction_amount"]),
                "similarity_score": round(sim_score, 4),
                "is_potential_duplicate": is_dup,
                "confidence_level": "VERY HIGH" if sim_score >= 0.88 else "HIGH" if sim_score >= 0.75 else "MODERATE" if sim_score >= 0.65 else "LOW"
            })

        return results

    def batch_detect_constituency_duplicates(self, threshold: float = 0.82, max_pairs: int = 50) -> List[Dict[str, Any]]:
        if self.embeddings is None or self.metadata is None:
            self.load_index()

        if self.metadata is None or self.embeddings is None:
            return []

        duplicate_pairs = []
        for district, group in self.metadata.groupby('district'):
            if len(group) < 2:
                continue

            indices = group.index.values
            sub_embeddings = self.embeddings[indices]
            sim_matrix = np.dot(sub_embeddings, sub_embeddings.T)

            for i in range(len(indices)):
                for j in range(i + 1, len(indices)):
                    score = float(sim_matrix[i, j])
                    if score >= threshold:
                        idx_a = indices[i]
                        idx_b = indices[j]
                        r_a = self.metadata.iloc[idx_a]
                        r_b = self.metadata.iloc[idx_b]

                        if r_a['project_id'] == r_b['project_id']:
                            continue

                        duplicate_pairs.append({
                            "similarity_score": round(score, 4),
                            "district": district,
                            "state": r_a['state'],
                            "project_a": {
                                "id": r_a['project_id'],
                                "title": r_a['clean_text'],
                                "amount": float(r_a['sanction_amount']),
                                "mp": r_a['mp_name']
                            },
                            "project_b": {
                                "id": r_b['project_id'],
                                "title": r_b['clean_text'],
                                "amount": float(r_b['sanction_amount']),
                                "mp": r_b['mp_name']
                            }
                        })
                        if len(duplicate_pairs) >= max_pairs:
                            return sorted(duplicate_pairs, key=lambda x: x['similarity_score'], reverse=True)

        return sorted(duplicate_pairs, key=lambda x: x['similarity_score'], reverse=True)

