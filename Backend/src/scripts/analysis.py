import sys
import json
import pandas as pd
import numpy as np
import mysql.connector

from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.metrics import (
    silhouette_score,
    davies_bouldin_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)
from sklearn.neighbors import NearestNeighbors


# ============================================================
# SAFE NUMBER
# ============================================================
def safe_number(value):
    try:
        if value is None:
            return 0.0

        value = str(value).replace("°C", "").strip()

        if "," in value and "." in value:
            if value.index(",") < value.index("."):
                value = value.replace(",", "")
            else:
                value = value.replace(".", "").replace(",", ".")
        else:
            value = value.replace(",", ".")

        return float(value)

    except:
        return 0.0


# ============================================================
# SAFE SILHOUETTE
# ============================================================
def safe_silhouette(data, labels):
    try:
        if len(set(labels)) < 2:
            return 0
        if len(data) > 1000:
            return 0
        return silhouette_score(data, labels)
    except:
        return 0


# ============================================================
# ANOMALY TYPE RULE ENGINE
# ============================================================
def detect_anomaly_type(
    pressure, flow, temp, pump,
    avg_pressure, avg_flow, avg_temp, avg_pump,
    pressure_mean, flow_mean, temp_mean, pump_mean
):

    pressure_diff = pressure - avg_pressure
    flow_diff = flow - avg_flow
    temp_diff = temp - avg_temp

    if pressure > avg_pressure + 8 and flow < avg_flow - 5:
        return "blockage"

    elif pressure < avg_pressure - 8 and flow > avg_flow + 3:
        return "leak"

    elif abs(pressure_diff) > 12 and abs(flow_diff) > 7:
        return "surge"

    elif pump < avg_pump - 250 and flow < avg_flow - 3:
        return "degradation"

    elif temp > temp_mean + 8 or temp_diff > 5:
        return "overheat"

    return "normal"


# ============================================================
# MAIN FUNCTION
# ============================================================
def run_analysis():

    try:
        print("START ANALYSIS", file=sys.stderr)

        # ================= INPUT =================
        input_params = {}
        if len(sys.argv) > 1:
            input_params = json.loads(sys.argv[1])

        algo = input_params.get("algorithm", "kmeans").lower()
        norm = input_params.get("normalization", "minmax").lower()
        user_cluster = int(input_params.get("cluster", 3))
        auto_cluster = input_params.get("auto_cluster", True)

        # ================= DB =================
        db = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="scada-sentinel"
        )

        cursor = db.cursor(dictionary=True)

        LIMIT = 500 if algo == "dbscan" else 1000

        cursor.execute(f"""
            SELECT timestamp, segment_id, pressure,
                   flow_rate, temperature, pump_speed, target
            FROM sensor_logs
            ORDER BY timestamp ASC
            LIMIT {LIMIT}
        """)

        df = pd.DataFrame(cursor.fetchall())

        cursor.close()
        db.close()

        if df.empty:
            print(json.dumps({"error": "Dataset kosong"}))
            return

        features = ["pressure", "flow_rate", "temperature", "pump_speed"]

        # ================= CLEAN =================
        for col in features:
            df[col] = df[col].apply(safe_number)
            df[col] = df[col].fillna(df[col].mean())

        df["target"] = pd.to_numeric(df["target"], errors="coerce").fillna(0).astype(int)

        # ================= CLIP =================
        df["pressure"] = df["pressure"].clip(0, 150)
        df["flow_rate"] = df["flow_rate"].clip(0, 100)
        df["temperature"] = df["temperature"].clip(0, 120)
        df["pump_speed"] = df["pump_speed"].clip(0, 5000)

        # ================= OUTLIER HANDLING =================
        for col in features:
            q1 = df[col].quantile(0.25)
            q3 = df[col].quantile(0.75)
            iqr = q3 - q1
            df[col] = np.clip(df[col], q1 - 1.5 * iqr, q3 + 1.5 * iqr)

        # ================= GLOBAL MEAN =================
        pressure_mean = df["pressure"].mean()
        flow_mean = df["flow_rate"].mean()
        temp_mean = df["temperature"].mean()
        pump_mean = df["pump_speed"].mean()

        # ================= NORMALIZATION =================
        scaler = MinMaxScaler() if norm == "minmax" else StandardScaler()
        scaled_data = scaler.fit_transform(df[features])

        # ================= INIT =================
        silhouette = 0
        dbi = 0

        anomaly_details = []
        normal_details = []

        distances = np.zeros(len(df))

        # ============================================================
        # KMEANS
        # ============================================================
        if algo == "kmeans":

            if auto_cluster:
                best_k = 3
                best_score = -1

                for k in range(2, 5):
                    model = KMeans(n_clusters=k, n_init=10, random_state=42)
                    labels_tmp = model.fit_predict(scaled_data)

                    if len(set(labels_tmp)) > 1:
                        score = safe_silhouette(scaled_data, labels_tmp)
                        if score > best_score:
                            best_score = score
                            best_k = k
            else:
                best_k = user_cluster

            model = KMeans(n_clusters=best_k, n_init=10, random_state=42)
            labels = model.fit_predict(scaled_data)

            if len(set(labels)) > 1:
                silhouette = safe_silhouette(scaled_data, labels)
                dbi = davies_bouldin_score(scaled_data, labels)

            distances = np.linalg.norm(
                scaled_data - model.cluster_centers_[labels],
                axis=1
            )

            threshold = np.percentile(distances, 90)
            anomaly_labels = (distances > threshold).astype(int)

        # ============================================================
        # DBSCAN (SAFE VERSION)
        # ============================================================
        elif algo == "dbscan":

            min_samples = 5

            # SAFE SAMPLING
            sample_size = min(1000, len(scaled_data))
            idx = np.random.choice(len(scaled_data), sample_size, replace=False)
            sample_data = scaled_data[idx]

            neighbors = NearestNeighbors(n_neighbors=min_samples)
            distances_knn, _ = neighbors.fit(sample_data).kneighbors(sample_data)

            eps_value = float(np.percentile(distances_knn[:, -1], 75))

            model = DBSCAN(eps=eps_value, min_samples=min_samples, n_jobs=-1)
            labels = model.fit_predict(scaled_data)

            anomaly_labels = (labels == -1).astype(int)

            mask = labels != -1

            if len(set(labels[mask])) > 1:
                silhouette = safe_silhouette(scaled_data[mask], labels[mask])
                dbi = davies_bouldin_score(scaled_data[mask], labels[mask])

            distances = np.full(len(df), eps_value)
            threshold = eps_value

        else:
            print(json.dumps({"error": "Algorithm tidak valid"}))
            return

        # ============================================================
        # LOOKBACK + RULE ENGINE
        # ============================================================
        p = df["pressure"].values
        f = df["flow_rate"].values
        t = df["temperature"].values
        ps = df["pump_speed"].values

        final_labels = []

        for i in range(len(df)):

            start = max(0, i - 5)

            avg_pressure = np.mean(p[start:i]) if i > 0 else pressure_mean
            avg_flow = np.mean(f[start:i]) if i > 0 else flow_mean
            avg_temp = np.mean(t[start:i]) if i > 0 else temp_mean
            avg_pump = np.mean(ps[start:i]) if i > 0 else pump_mean

            row = df.iloc[i]

            pressure = float(row["pressure"])
            flow = float(row["flow_rate"])
            temp = float(row["temperature"])
            pump = float(row["pump_speed"])

            anomaly_type = detect_anomaly_type(
                pressure, flow, temp, pump,
                avg_pressure, avg_flow, avg_temp, avg_pump,
                pressure_mean, flow_mean, temp_mean, pump_mean
            )

            score = 0

            if anomaly_labels[i] == 1:
                score += 2
            if anomaly_type != "normal":
                score += 2
            if abs(pressure - avg_pressure) > 8:
                score += 1
            if abs(flow - avg_flow) > 5:
                score += 1
            if abs(pump - avg_pump) > 250:
                score += 1
            if abs(temp - avg_temp) > 5:
                score += 1

            final_anomaly = score >= 3
            final_labels.append(1 if final_anomaly else 0)

            if final_anomaly:
                if anomaly_type == "normal":
                    if pressure > avg_pressure:
                        anomaly_type = "blockage"
                    elif pressure < avg_pressure:
                        anomaly_type = "leak"
                    elif temp > avg_temp + 5:
                        anomaly_type = "overheat"
                    elif pump < avg_pump - 200:
                        anomaly_type = "degradation"
                    else:
                        anomaly_type = "surge"
            else:
                anomaly_type = "normal"

            confidence = 50 if threshold == 0 else (distances[i] / threshold) * 100
            confidence = np.clip(confidence, 50, 200)

            severity = "low"
            if confidence >= 140:
                severity = "high"
            elif confidence >= 110:
                severity = "medium"

            item = {
                "timestamp": str(row["timestamp"]),
                "segment_id": int(row["segment_id"]),
                "pressure": round(pressure, 2),
                "flow_rate": round(flow, 2),
                "temperature": round(temp, 2),
                "pump_speed": round(pump, 2),
                "type": anomaly_type,
                "confidence": float(confidence),
                "severity": severity,
                "score": score
            }

            if final_anomaly:
                anomaly_details.append(item)
            else:
                normal_details.append(item)

        # ================= METRICS =================
        y_true = df["target"]
        y_pred = np.array(final_labels)

        accuracy = accuracy_score(y_true, y_pred)
        precision = precision_score(y_true, y_pred, zero_division=0)
        recall = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)

        # ================= STATUS =================
        if silhouette >= 0.7:
            status = "Optimal"
        elif silhouette >= 0.5:
            status = "Good"
        elif silhouette >= 0.25:
            status = "Stable"
        else:
            status = "Low Accuracy"

        # ================= OUTPUT =================
        print(json.dumps({
            "algorithm": "K-Means" if algo == "kmeans" else "DBSCAN",
            "normalization": "Min-Max" if norm == "minmax" else "Z-Score",
            "cluster": str(best_k) if algo == "kmeans" else "-",
            "total_data": len(df),
            "normal": len(normal_details),
            "anomaly": len(anomaly_details),
            "silhouette": round(float(silhouette), 3),
            "davies_bouldin": round(float(dbi), 3),
            "accuracy": round(float(accuracy), 3),
            "precision": round(float(precision), 3),
            "recall": round(float(recall), 3),
            "f1_score": round(float(f1), 3),
            "status": status,
            "anomaly_details": anomaly_details[:50],
            "normal_details": normal_details[:50]
        }))

    except Exception as e:
        print(json.dumps({"error": str(e)}))


if __name__ == "__main__":
    run_analysis()