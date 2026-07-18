# Catatan Metode Penelitian

## Sumber data

Dataset yang digunakan adalah **SCADA Pipeline Operations Dataset** oleh pengguna Kaggle **zara2099**, bukan data operasional perusahaan. Sumber: https://www.kaggle.com/datasets/zara2099/scada-pipeline-operations-dataset/data (diakses 17 Juli 2026). Cantumkan versi dan lisensi yang tercantum pada halaman Kaggle saat menulis daftar pustaka.

File sumber yang diunduh, `dataset-pipeline.xlsx`, memiliki **1.000 observasi data** dan 13 kolom: `timestamp`, `segment_id`, `pressure`, `flow_rate`, `temperature`, `valve_status`, `pump_state`, `pump_speed`, `compressor_state`, `energy_consumption`, `alarm_triggered`, `event_type`, dan `target`. Satu baris tambahan pada Excel adalah header. Jangan menyebut populasi 2,5 juta observasi kecuali memiliki berkas atau metadata sumber yang membuktikannya.

Sebanyak 1.000 observasi dengan empat fitur analisis dapat diproses pada RAM 4 GB, sehingga seluruh data sumber direkomendasikan untuk eksperimen final. Bila diperlukan sampel untuk uji/demo, gunakan `scripts/create_stratified_sample.js`. Skrip ini membuat `scada_stratified_500_seed42.xlsx` dengan random stratified sampling menurut `event_type`, seed 42, dan metadata pendukung. Proses ini mempertahankan proporsi kelas serta dapat diulang.

## Prapemrosesan dan integritas data

Saat audit ditemukan 208 sel sensor yang disimpan Excel sebagai serial tanggal: 106 pada `flow_rate`, 34 pada `temperature`, dan 68 pada `energy_consumption`. Nilai yang terlihat di Excel adalah nilai yang diimpor; serial tanggal internal tidak boleh digunakan sebagai nilai sensor. Proses ini harus dicatat pada Bab III sebagai pemulihan format Excel, bukan sebagai perubahan nilai dari sumber Kaggle.

Backend juga menolak nilai di luar rentang valid untuk dataset ini dan status yang tidak sesuai. File mentah harus disimpan terpisah dari data kerja yang diimpor. Laporkan jumlah baris sebelum dan sesudah validasi pada setiap eksperimen.

## Protokol eksperimen

Empat konfigurasi dibandingkan: K-Means dan DBSCAN, masing-masing dengan Min-Max Scaling dan Z-Score Standardization. Fitur yang digunakan adalah `pressure`, `flow_rate`, `temperature`, dan `pump_speed`.

K-Means memakai `k-means++`, `n_init=10`, dan `random_state=42`. Nilai k dipilih dari 2 hingga 5 berdasarkan Silhouette Score tertinggi. Anomali K-Means ditentukan tanpa memakai `target`: jarak titik ke centroid terdekat harus melebihi ambang robust median + 3 MAD; bila MAD nol, digunakan persentil ke-95. DBSCAN menentukan anomali sebagai noise point dengan `min_samples=5` dan `eps` dari kurva k-distance.

Kolom `target` tidak digunakan untuk fitting, pemilihan ambang, atau penentuan anomali. Kolom tersebut hanya dipakai setelah model berjalan untuk menghitung accuracy, precision, recall, dan F1-score.

## Pelaporan hasil

Untuk setiap konfigurasi, laporkan jumlah data, jumlah anomali, parameter model, Silhouette Score, Davies-Bouldin Index, confusion matrix, accuracy, precision, recall, dan F1-score. Nyatakan bahwa metrik eksternal saat ini dihitung pada dataset berlabel yang sama; metrik tersebut bukan klaim performa out-of-sample.

Dataset ini memiliki 330 label normal dan 169 label anomali. Karena `event_type=normal` selalu berpasangan dengan `target=0` dan empat event lain berpasangan dengan `target=1`, jelaskan asal dan arti label Kaggle tersebut. Jangan menyebut sistem sebagai SCADA real-time atau diagnosis kerusakan pasti; istilah yang tepat adalah analisis anomali pada dataset SCADA publik.

## Batasan

Dataset hanya mencakup 9 timestamp dalam rentang sekitar delapan menit dan memiliki kombinasi timestamp-segment yang berulang. Oleh sebab itu, penelitian ini menunjukkan evaluasi eksperimental pada dataset publik, bukan generalisasi ke operasi pipeline nyata. Untuk klaim generalisasi, diperlukan dataset waktu yang lebih panjang atau dataset Kaggle lain yang benar-benar dipisahkan sebagai data uji.
