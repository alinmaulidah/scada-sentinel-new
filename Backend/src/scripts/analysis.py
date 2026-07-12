import sys
import json
import pandas as pd
import numpy as np
import mysql.connector

from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.metrics import silhouette_score, davies_bouldin_score
from sklearn.neighbors import NearestNeighbors

def safe_number(value):
    if value is None: return 0.0
    try:
        value = str(value).replace("°C", "").replace(" bar", "")
        value = value.replace(" m³/h", "").replace(" rpm", "").strip()
        if "," in value and "." in value:
            value = value.replace(",", "") if value.index(",") < value.index(".") \
                    else value.replace(".", "").replace(",", ".")
        else:
            value = value.replace(",", ".")
        return float(value)
    except:
        return 0.0

def safe_silhouette(data, labels):
    try:
        # Konversi labels ke numpy array untuk menghindari TypeError saat slicing
        labels_arr = np.asarray(labels)
        if len(np.unique(labels_arr)) < 2:
            return 0.0
        # Subsample maksimal 2000 titik agar hemat RAM & Cepat
        if len(data) > 2000:
            idx = np.random.choice(len(data), 2000, replace=False)
            return float(silhouette_score(data[idx], labels_arr[idx]))
        return float(silhouette_score(data, labels_arr))
    except:
        return 0.0

def auto_estimate_epsilon(k_distances):
    sorted_k_dist = np.sort(k_distances)
    n_points = len(sorted_k_dist)
    x1, y1 = 0, sorted_k_dist[0]
    x2, y2 = n_points - 1, sorted_k_dist[-1]
    max_distance = -1
    elbow_index = 0
    for i in range(n_points):
        x0, y0 = i, sorted_k_dist[i]
        numerator = abs((y2-y1)*x0 - (x2-x1)*y0 + x2*y1 - y2*x1)
        denominator = np.sqrt((y2-y1)**2 + (x2-x1)**2)
        distance = numerator / denominator if denominator > 0 else 0
        if distance > max_distance:
            max_distance = distance
            elbow_index = i
    estimated_eps = float(sorted_k_dist[elbow_index])
    return estimated_eps if estimated_eps > 0.1 else 0.35

def classify_anomaly_type(
        pressure,
        flow,
        temp,
        pump,
        stats_unpacked):

    p_mean, p_std, \
    f_mean, f_std, \
    t_mean, t_std, \
    ps_mean = stats_unpacked

    # SURGE
    if (
        pressure > p_mean + 2*p_std
        and flow > f_mean + 2*f_std
    ):
        return "surge", "high"

    # LEAK
    elif (
        pressure < p_mean - p_std
        and flow < f_mean - f_std
        and pump > ps_mean
    ):
        return "leak", "high"

    # BLOCKAGE
    elif (
        pressure > p_mean + p_std
        and flow < f_mean - f_std
        and temp > t_mean + t_std
    ):
        return "blockage", "high"

    # DEGRADATION
    else:
        return "degradation", "medium"
def run_analysis():
    db = None
    cursor = None
    try:
        # =====================================================================
        # 1. PARSING INPUT
        # =====================================================================
        input_params = {}
        if len(sys.argv) > 1:
            try:
                input_params = json.loads(sys.argv[1])
            except:
                pass

        algo = input_params.get("algorithm", "kmeans").lower()
        norm = input_params.get("normalization", "minmax").lower()

        # =====================================================================
        # 2. KONEKSI DATABASE
        # =====================================================================
        db = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="scada-sentinel",
            connect_timeout=10
        )
        cursor = db.cursor(dictionary=True)

        # =====================================================================
        # 3. AMBIL SELURUH DATA DARI DATABASE
        # =====================================================================
        cursor.execute("""
            SELECT
                timestamp,
                segment_id,
                pressure,
                flow_rate,
                temperature,
                pump_speed,
                target
            FROM sensor_logs
            ORDER BY timestamp ASC
        """)

        records = cursor.fetchall()

        if not records:
            print(json.dumps({
                "error": "Tabel sensor_logs kosong atau koneksi MySQL terputus"
            }))
            return

        # Acak urutan data tetapi jumlah tetap
        df = (
            pd.DataFrame(records)
            .sample(frac=1, random_state=42)
            .reset_index(drop=True)
        )

        print(f"Total Data     : {len(df)}", file=sys.stderr)
        print(f"Data Normal    : {(df['target'] == 0).sum()}", file=sys.stderr)
        print(f"Data Anomali   : {(df['target'] == 1).sum()}", file=sys.stderr)

        features = [
            "pressure",
            "flow_rate",
            "temperature",
            "pump_speed"
        ]

        # =====================================================================
        # 4. PREPROCESSING
        # =====================================================================
        for col in features:
            df[col] = df[col].apply(safe_number)

        for col in features:
            df[col] = df[col].clip(
                df[col].quantile(0.01),
                df[col].quantile(0.99)
            )

        for col in features:
            df[col] = df[col].fillna(df[col].mean())
        global_stats = {}
        for col in features:
            global_stats[col] = {
                "max":  float(df[col].max()),
                "min":  float(df[col].min()),
                "mean": float(df[col].mean()),
                "std":  float(df[col].std()) if float(df[col].std()) > 0 else 1.0
            }

        # Unpack statistik sekali saja di luar loop untuk efisiensi
        stats_unpacked = (
            global_stats["pressure"]["mean"], global_stats["pressure"]["std"],
            global_stats["flow_rate"]["mean"], global_stats["flow_rate"]["std"],
            global_stats["temperature"]["mean"], global_stats["temperature"]["std"],
            global_stats["pump_speed"]["mean"]
        )

        # =====================================================================
        # 5. NORMALISASI
        # =====================================================================
        scaler = MinMaxScaler() if norm == "minmax" else StandardScaler()
        scaled_data = scaler.fit_transform(df[features])

        silhouette, dbi = 0.0, 0.0
        qualitative_statuses = ["normal"] * len(df)
        labels = np.zeros(len(df), dtype=int)

        out_cluster = "0"
        out_eps = None
        out_min_samples = None
        out_iterations = None
        out_random_seed_nodes = None
        out_final_centroids = None

        # =====================================================================
        # ALGORITMA 1: K-MEANS
        # =====================================================================
        if algo == "kmeans":
            best_k = 2
            best_score = -1
            best_labels = None
            best_model = None

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
            labels = np.asarray(best_labels)
            out_iterations = int(model.n_iter_)
            out_random_seed_nodes = []
            out_final_centroids = []

            np.random.seed(42)
            random_indices = np.random.choice(len(df), size=best_k, replace=False)
            for k_idx, r_idx in enumerate(random_indices):
                seg_id = df.at[r_idx, "segment_id"]
                final_seg_id = int(seg_id) if isinstance(seg_id, (int, np.integer)) or (isinstance(seg_id, str) and seg_id.isdigit()) else str(seg_id)
                out_random_seed_nodes.append({
                    "label": f"Pusat Awal Kluster {k_idx + 1}",
                    "row_index": int(r_idx + 1),
                    "segment_id": final_seg_id,
                    "pressure": round(float(df.at[r_idx, "pressure"]), 2),
                    "flow_rate": round(float(df.at[r_idx, "flow_rate"]), 2)
                })

            raw_centroids = model.cluster_centers_
            actual_centroids = scaler.inverse_transform(raw_centroids)
            for k_idx, center in enumerate(actual_centroids):
                out_final_centroids.append({
                    "label": f"Kluster {k_idx + 1}",
                    "pressure":  round(float(center[0]), 2),
                    "flow_rate": round(float(center[1]), 2)
                })

            if len(set(labels)) > 1:
                silhouette = safe_silhouette(scaled_data, labels)
                dbi = davies_bouldin_score(scaled_data, labels)

            unique_labels, counts = np.unique(labels, return_counts=True)
            cluster_counts = dict(zip(unique_labels, counts))
            sorted_clusters = sorted(cluster_counts, key=cluster_counts.get, reverse=True)
            major_cluster = sorted_clusters[0]

            for idx, label in enumerate(labels):
                if label == major_cluster:
                    qualitative_statuses[idx] = "normal"
                elif label == sorted_clusters[-1] and len(sorted_clusters) > 1:
                    qualitative_statuses[idx] = "anomali"
                else:
                    qualitative_statuses[idx] = "warning"

            # PERBAIKAN EFISIENSI: Menggunakan transform bawaan sklearn (jauh lebih cepat)
            distances = np.min(model.transform(scaled_data), axis=1)
            threshold = float(np.mean(distances)) if len(distances) > 0 else 1.0
            out_cluster = str(len(set(labels)))

        # =====================================================================
        # ALGORITMA 2: DBSCAN
        # =====================================================================
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
                else:
                    qualitative_statuses[idx] = "normal"

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
            out_cluster = str(len(unique_clusters)) if unique_clusters else "0"
            out_eps = float(round(eps_value, 4))
            out_min_samples = int(min_samples)

        # =====================================================================
        # 5. KLASIFIKASI JENIS ANOMALI
        # =====================================================================
        p_vals  = df["pressure"].values
        f_vals  = df["flow_rate"].values
        t_vals  = df["temperature"].values
        ps_vals = df["pump_speed"].values

        anomaly_details, normal_details = [], []

        for i in range(len(df)):
            pressure = float(p_vals[i])
            flow     = float(f_vals[i])
            temp     = float(t_vals[i])
            pump     = float(ps_vals[i])

            status_label = qualitative_statuses[i]

            if status_label in ["anomali", "warning"]:
                type_final, severity_final = classify_anomaly_type(
                    pressure, flow, temp, pump, stats_unpacked
                )
            else:
                type_final = "normal"
                severity_final = "normal"

            denom = threshold if threshold > 0 else 1.0
            raw_conf = (1.0 - min(distances[i] / denom, 1.0)) * 100
            confidence = max(0.0, round(raw_conf, 2))

            seg_id = df.at[i, "segment_id"]
            final_seg_id = int(seg_id) if isinstance(seg_id, (int, np.integer)) or (isinstance(seg_id, str) and seg_id.isdigit()) else str(seg_id)

            item = {
                "timestamp":  str(df.at[i, "timestamp"]),
                "segment_id": final_seg_id,
                "pressure":   round(pressure, 2),
                "flow_rate":  round(flow, 2),
                "temperature": round(temp, 2),
                "pump_speed": round(pump, 2),
                "type":       type_final,
                "confidence": float(confidence),
                "severity":   severity_final
            }

            if status_label == "normal":
                normal_details.append(item)
            else:
                anomaly_details.append(item)

        # =====================================================================
        # 6. OUTPUT JSON
        # =====================================================================
        status_eval = (
            "Optimal" if silhouette >= 0.7 else
            "Good"    if silhouette >= 0.5 else
            "Stable"  if silhouette >= 0.25 else
            "Low"
        )

        output_response = {
            "algorithm":      "K-Means" if algo == "kmeans" else "DBSCAN",
            "normalization":  "Min-Max" if norm == "minmax" else "Z-Score",
            "cluster":        out_cluster,
            "total_data":     len(df),
            "normal":         len(normal_details),
            "anomaly":        len(anomaly_details),
            "database_anchors": global_stats,
            "silhouette":     round(float(silhouette), 3),
            "davies_bouldin": round(float(dbi), 3),
            "status":         status_eval,
            "anomaly_details": anomaly_details,
            "normal_details":  normal_details
        }

        if algo == "kmeans":
            output_response["iterations"]        = out_iterations
            output_response["random_seed_nodes"] = out_random_seed_nodes
            output_response["final_centroids"]   = out_final_centroids
            output_response["eps"]               = None
            output_response["min_samples"]       = None
        elif algo == "dbscan":
            output_response["eps"]               = out_eps
            output_response["min_samples"]       = out_min_samples
            output_response["iterations"]        = None
            output_response["random_seed_nodes"] = None
            output_response["final_centroids"]   = None

        print(json.dumps(output_response))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
    finally:
        # Menjamin penutupan koneksi DB agar tidak bocor (connection leak)
        if cursor:
            cursor.close()
        if db:
            db.close()

if __name__ == "__main__":
    run_analysis()