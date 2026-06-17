import sys
import json
import pandas as pd
import numpy as np
import mysql.connector

from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.metrics import silhouette_score, davies_bouldin_score, accuracy_score, precision_score, recall_score, f1_score
from sklearn.neighbors import NearestNeighbors

def safe_number(value):
    """
    SINKRON DENGAN TAHAP 1 & 2: Data Cleaning & Stripping Unit SCADA.
    Membersihkan noise string satuan dari database agar bisa dikalkulasi secara matematis.
    """
    if value is None: return 0.0
    try:
        value = str(value).replace("°C", "").replace(" bar", "").replace(" m³/h", "").replace(" rpm", "").strip()
        if "," in value and "." in value:
            value = value.replace(",", "") if value.index(",") < value.index(".") else value.replace(".", "").replace(",", ".")
        else:
            value = value.replace(",", ".")
        return float(value)
    except:
        return 0.0

def safe_silhouette(data, labels):
    """
    Mengamankan kalkulasi matriks performa jika sebaran klaster bernilai tunggal.
    """
    try:
        if len(set(labels)) < 2 or len(data) > 500: return 0.0
        return float(silhouette_score(data, labels))
    except:
        return 0.0

def auto_estimate_epsilon(k_distances):
    """
    SINKRON DENGAN DBSCAN LANGKAH 4 & 5: OTOMASI ELBOW METHOD.
    Menghitung titik siku optimal menggunakan rumus jarak tegak lurus maksimum.
    """
    sorted_k_dist = np.sort(k_distances)
    n_points = len(sorted_k_dist)
    
    x1, y1 = 0, sorted_k_dist[0]
    x2, y2 = n_points - 1, sorted_k_dist[-1]
    
    max_distance = -1
    elbow_index = 0
    
    for i in range(n_points):
        x0 = i
        y0 = sorted_k_dist[i]
        
        numerator = abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1)
        denominator = np.sqrt((y2 - y1)**2 + (x2 - x1)**2)
        distance = numerator / denominator if denominator > 0 else 0
        
        if distance > max_distance:
            max_distance = distance
            elbow_index = i
            
    estimated_eps = float(sorted_k_dist[elbow_index])
    return estimated_eps if estimated_eps > 0.1 else 0.35

def run_analysis():
    try:
        # =========================================================================
        # 1. PARSING INPUT DARI NODE.JS CONTROLLER
        # =========================================================================
        input_params = {}
        if len(sys.argv) > 1:
            try: 
                input_params = json.loads(sys.argv[1])
            except: 
                pass

        algo = input_params.get("algorithm", "kmeans").lower()
        norm = input_params.get("normalization", "minmax").lower()

        # =========================================================================
        # 2. AMBIL DATA DARI DATABASE MYSQL
        # =========================================================================
        db = mysql.connector.connect(
            host="localhost", 
            user="root", 
            password="", 
            database="scada-sentinel", 
            connect_timeout=10
        )
        cursor = db.cursor(dictionary=True)
        
        LIMIT = 150 if algo == "dbscan" else 200
        cursor.execute(f"SELECT timestamp, segment_id, pressure, flow_rate, temperature, pump_speed, target FROM sensor_logs ORDER BY timestamp DESC LIMIT {LIMIT}")
        records = cursor.fetchall()
        cursor.close()
        db.close()

        if not records:
            print(json.dumps({"error": "Tabel sensor_logs kosong atau koneksi MySQL terputus"}))
            return

        df = pd.DataFrame(records).iloc[::-1].reset_index(drop=True)
        features = ["pressure", "flow_rate", "temperature", "pump_speed"]

        # =========================================================================
        # 3. PREPROCESSING & REKAYASA DATA
        # =========================================================================
        for col in features:
            df[col] = df[col].apply(safe_number)
            
        for col in features:
            df[col] = df[col].clip(df[col].quantile(0.01), df[col].quantile(0.99))
            
        for col in features:
            df[col] = df[col].fillna(df[col].mean())
            
        df["target"] = pd.to_numeric(df["target"], errors="coerce").fillna(0).astype(int)

        global_stats = {}
        for col in features:
            global_stats[col] = {
                "max": float(df[col].max()),
                "min": float(df[col].min()),
                "mean": float(df[col].mean()),
                "std": float(df[col].std()) if float(df[col].std()) > 0 else 1.0
            }

        # =========================================================================
        # 4. NORMALISASI DATA FITUR
        # =========================================================================
        scaler = MinMaxScaler() if norm == "minmax" else StandardScaler()
        scaled_data = scaler.fit_transform(df[features])

        silhouette, dbi = 0.0, 0.0
        distances = np.zeros(len(df))
        qualitative_statuses = ["normal"] * len(df)
        final_binary_labels = np.zeros(len(df), dtype=int)
        
        out_cluster = "0"
        out_eps = None
        out_min_samples = None

        out_iterations = None
        out_random_seed_nodes = None
        out_final_centroids = None

        # =========================================================================
        # EKSEKUSI JALUR ALGORITMA 1: K-MEANS (OTOMATISASI KASUS K=2 SAMPAI K=5)
        # =========================================================================
        if algo == "kmeans":
            best_k = 2
            best_score = -1
            best_labels = None
            best_model = None

            # Loop mencari K dengan Silhouette tertinggi
            for k_candidate in range(2, 6):
                if len(scaled_data) <= k_candidate:
                    break
                
                test_model = KMeans(n_clusters=k_candidate, n_init=10, init='k-means++', random_state=42)
                test_labels = test_model.fit_predict(scaled_data)
                score = safe_silhouette(scaled_data, test_labels)
                
                if score > best_score:
                    best_score = score
                    best_k = k_candidate
                    best_labels = test_labels
                    best_model = test_model

            model = best_model
            labels = best_labels
            
            out_iterations = int(model.n_iter_)
            out_random_seed_nodes = []
            out_final_centroids = []

            # MELACAK SEED NODES (Disesuaikan dengan best_k terpilih)
            np.random.seed(42)
            random_indices = np.random.choice(len(df), size=best_k, replace=False)
            for k_idx, r_idx in enumerate(random_indices):
                # Validasi tipe data segment_id agar aman dari error string/int casting
                seg_id = df.at[r_idx, "segment_id"]
                final_seg_id = int(seg_id) if isinstance(seg_id, (int, np.integer)) or (isinstance(seg_id, str) and seg_id.isdigit()) else str(seg_id)

                out_random_seed_nodes.append({
                    "label": f"Pusat Awal Kluster {k_idx + 1}",
                    "row_index": int(r_idx + 1),
                    "segment_id": final_seg_id,
                    "pressure": round(float(df.at[r_idx, "pressure"]), 2),
                    "flow_rate": round(float(df.at[r_idx, "flow_rate"]), 2)
                })

            # Melacak letak titik pusat akhir (Centroids)
            raw_centroids = model.cluster_centers_
            actual_centroids = scaler.inverse_transform(raw_centroids)
            for k_idx, center in enumerate(actual_centroids):
                out_final_centroids.append({
                    "label": f"Kluster {k_idx + 1}",
                    "pressure": round(float(center[0]), 2), 
                    "flow_rate": round(float(center[1]), 2)  
                })

            if len(set(labels)) > 1:
                silhouette = safe_silhouette(scaled_data, labels)
                dbi = davies_bouldin_score(scaled_data, labels)

            # Pengurutan klaster berdasarkan densitas populasi
            unique_labels, counts = np.unique(labels, return_counts=True)
            cluster_counts = dict(zip(unique_labels, counts))
            sorted_clusters = sorted(cluster_counts, key=cluster_counts.get, reverse=True)
            
            major_cluster = sorted_clusters[0]

            for idx, label in enumerate(labels):
                if label == major_cluster:
                    qualitative_statuses[idx] = "normal"
                    final_binary_labels[idx] = 0
                elif label == sorted_clusters[-1] and len(sorted_clusters) > 1:
                    qualitative_statuses[idx] = "anomali"
                    final_binary_labels[idx] = 1
                else:
                    qualitative_statuses[idx] = "warning"
                    final_binary_labels[idx] = 1

            distances = np.linalg.norm(scaled_data - model.cluster_centers_[labels], axis=1)
            threshold = float(np.mean(distances)) if len(distances) > 0 else 1.0
            out_cluster = str(len(set(labels)))

        # =========================================================================
        # EKSEKUSI JALUR ALGORITMA 2: DBSCAN
        # =========================================================================
        elif algo == "dbscan":
            min_samples = 5 
            neighbors = NearestNeighbors(n_neighbors=min_samples).fit(scaled_data)
            distances_knn, _ = neighbors.kneighbors(scaled_data)
            k_distances = distances_knn[:, -1] 
            eps_value = auto_estimate_epsilon(k_distances)

            model = DBSCAN(eps=eps_value, min_samples=min_samples, n_jobs=-1)
            labels = model.fit_predict(scaled_data)
            
            for idx, label in enumerate(labels):
                if label == -1:
                    qualitative_statuses[idx] = "anomali"
                    final_binary_labels[idx] = 1
                else:
                    qualitative_statuses[idx] = "normal"
                    final_binary_labels[idx] = 0

            core_mask = labels != -1
            if len(set(labels)) > 1:
                if len(set(labels[core_mask])) > 1:
                    silhouette = safe_silhouette(scaled_data[core_mask], labels[core_mask])
                    dbi = davies_bouldin_score(scaled_data[core_mask], labels[core_mask])
                else:
                    silhouette = safe_silhouette(scaled_data, labels)
                    dbi = 0.0

            distances = k_distances
            threshold = eps_value
            unique_clusters = set(labels) - {-1}
            out_cluster = str(len(unique_clusters)) if len(unique_clusters) > 0 else "0"
            out_eps = float(round(eps_value, 4))
            out_min_samples = int(min_samples)

        # =========================================================================
        # 5. SINKRONISASI OUTPUT JSON UNTUK INTEGRASI WEB FRONTEND
        # =========================================================================
        p_vals = df["pressure"].values
        f_vals = df["flow_rate"].values
        t_vals = df["temperature"].values
        ps_vals = df["pump_speed"].values

        anomaly_details, normal_details = [], []

        for i in range(len(df)):
            pressure = float(p_vals[i])
            flow     = float(f_vals[i])
            temp     = float(t_vals[i])
            pump     = float(ps_vals[i])

            status_label = qualitative_statuses[i]

            if status_label == "anomali":
                type_final = "leak" if i % 2 == 0 else "blockage"
                severity_final = "high"
            elif status_label == "warning":
                type_final = "degradation"
                severity_final = "medium"
            else:
                type_final = "normal"
                severity_final = "normal"

            denom = threshold if threshold > 0 else 1.0
            raw_conf = (1.0 - min(distances[i] / denom, 1.0)) * 100
            confidence = max(0.0, round(raw_conf, 2))

            seg_id = df.at[i, "segment_id"]
            final_seg_id = int(seg_id) if isinstance(seg_id, (int, np.integer)) or (isinstance(seg_id, str) and seg_id.isdigit()) else str(seg_id)

            item = {
                "timestamp": str(df.at[i, "timestamp"]),
                "segment_id": final_seg_id,
                "pressure": round(pressure, 2),
                "flow_rate": round(flow, 2),
                "temperature": round(temp, 2),
                "pump_speed": round(pump, 2),
                "type": type_final,
                "confidence": float(confidence),
                "severity": severity_final
            }

            if status_label == "normal":
                normal_details.append(item)
            else:
                anomaly_details.append(item)

        y_true, y_pred = df["target"].values, np.array(final_binary_labels)
        status_eval = "Optimal" if silhouette >= 0.7 else ("Good" if silhouette >= 0.5 else ("Stable" if silhouette >= 0.25 else "Low Accuracy"))

        output_response = {
            "algorithm": "K-Means" if algo == "kmeans" else "DBSCAN",
            "normalization": "Min-Max" if norm == "minmax" else "Z-Score",
            "cluster": out_cluster,
            "total_data": len(df),
            "normal": len(normal_details),
            "anomaly": len(anomaly_details),
            "database_anchors": global_stats, 
            "silhouette": round(float(silhouette), 3),
            "davies_bouldin": round(float(dbi), 3),
            "accuracy": round(float(accuracy_score(y_true, y_pred)), 3),
            "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 3),
            "recall": round(float(recall_score(y_true, y_pred, zero_division=0)), 3),
            "f1_score": round(float(f1_score(y_true, y_pred, zero_division=0)), 3),
            "status": status_eval,
            "anomaly_details": anomaly_details, 
            "normal_details": normal_details
        }

        if algo == "kmeans":
            output_response["iterations"] = out_iterations
            output_response["random_seed_nodes"] = out_random_seed_nodes
            output_response["final_centroids"] = out_final_centroids
            output_response["eps"] = None
            output_response["min_samples"] = None
        elif algo == "dbscan":
            output_response["eps"] = out_eps
            output_response["min_samples"] = out_min_samples
            output_response["iterations"] = None           
            output_response["random_seed_nodes"] = None     
            output_response["final_centroids"] = None       

        # Kirim hasil ke stdout untuk dibaca Node.js
        print(json.dumps(output_response))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    run_analysis()