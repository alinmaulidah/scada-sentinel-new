# Catatan Metode Penelitian

## Sumber data

Dataset yang digunakan adalah **SCADA Pipeline Operations Dataset** oleh pengguna Kaggle **zara2099**, bukan data operasional perusahaan. Sumber: https://www.kaggle.com/datasets/zara2099/scada-pipeline-operations-dataset/data (diakses 17 Juli 2026). Cantumkan versi dan lisensi yang tercantum pada halaman Kaggle saat menulis daftar pustaka.

File sumber yang diunduh, `dataset-pipeline.xlsx`, memiliki **1.000 observasi data** dan 13 kolom: `timestamp`, `segment_id`, `pressure`, `flow_rate`, `temperature`, `valve_status`, `pump_state`, `pump_speed`, `compressor_state`, `energy_consumption`, `alarm_triggered`, `event_type`, dan `target`. Satu baris tambahan pada Excel adalah header. Jangan menyebut populasi 2,5 juta observasi kecuali memiliki berkas atau metadata sumber yang membuktikannya.

Sebanyak 1.000 observasi dengan empat fitur analisis dapat diproses pada RAM 4 GB, sehingga seluruh data sumber direkomendasikan untuk eksperimen final. Bila diperlukan sampel untuk uji/demo, gunakan `scripts/create_stratified_sample.js`. Skrip ini membuat `scada_stratified_500_seed42.xlsx` dengan random stratified sampling menurut `event_type`, seed 42, dan metadata pendukung. Proses ini mempertahankan proporsi kelas serta dapat diulang.

## Prapemrosesan dan integritas data

Pada file kerja lama `500.xlsx` ditemukan 208 sel sensor yang disimpan Excel sebagai serial tanggal: 106 pada `flow_rate`, 34 pada `temperature`, dan 68 pada `energy_consumption`. Nilai yang terlihat di Excel adalah nilai yang diimpor; serial tanggal internal tidak boleh digunakan sebagai nilai sensor. File sumber `dataset-pipeline.xlsx` dan sampel final `scada_stratified_500_seed42.xlsx` tidak memiliki masalah format tersebut.

Backend juga menolak nilai di luar rentang valid untuk dataset ini dan status yang tidak sesuai. File mentah harus disimpan terpisah dari data kerja yang diimpor. Laporkan jumlah baris sebelum dan sesudah validasi pada setiap eksperimen.

Sistem menerapkan **satu dataset aktif**: impor ditolak bila tabel `sensor_logs` masih berisi data. Sebelum mengganti dataset, pengguna harus mengosongkan data aktif. Tindakan tersebut sekaligus menghapus seluruh `algorithm_results`, karena riwayat hasil belum menyimpan versi atau salinan dataset sumber. Mekanisme ini mencegah hasil lama ditampilkan untuk dataset baru dan mencegah impor ganda.

## Protokol eksperimen

Empat konfigurasi dibandingkan: K-Means dan DBSCAN, masing-masing dengan Min-Max Scaling dan Z-Score Standardization. Fitur yang digunakan adalah `pressure`, `flow_rate`, `temperature`, dan `pump_speed`.

K-Means memakai `k-means++`, `n_init=10`, dan `random_state=42`. Nilai k dipilih dari 2 hingga 5 berdasarkan Silhouette Score tertinggi. Anomali K-Means ditentukan tanpa memakai `target`: jarak titik ke centroid terdekat harus melebihi ambang robust median + 3 MAD; bila MAD nol, digunakan persentil ke-95. DBSCAN menentukan anomali sebagai noise point dengan `min_samples=5` dan `eps` dari kurva k-distance.

Kolom `target` tidak digunakan untuk fitting, pemilihan ambang, atau penentuan anomali. Kolom tersebut hanya dipakai setelah model berjalan untuk menghitung accuracy, precision, recall, dan F1-score.

## Pelaporan hasil

Untuk setiap konfigurasi, laporkan jumlah data, jumlah anomali, parameter model, Silhouette Score, Davies-Bouldin Index, confusion matrix, accuracy, precision, recall, dan F1-score. Nyatakan bahwa metrik eksternal saat ini dihitung pada dataset berlabel yang sama; metrik tersebut bukan klaim performa out-of-sample.

Dataset sumber memiliki 694 label normal dan 306 label anomali. Sampel 500 data memiliki 347 label normal dan 153 label anomali. Karena `event_type=normal` selalu berpasangan dengan `target=0` dan empat event lain berpasangan dengan `target=1`, jelaskan asal dan arti label Kaggle tersebut. Jangan menyebut sistem sebagai SCADA real-time atau diagnosis kerusakan pasti; istilah yang tepat adalah analisis anomali pada dataset SCADA publik.

## Batasan

Dataset publik dan labelnya tidak dapat dianggap sebagai bukti kondisi operasi pipeline nyata. Oleh sebab itu, penelitian ini menunjukkan evaluasi eksperimental pada dataset SCADA publik, bukan generalisasi ke operasi pipeline nyata. Untuk klaim generalisasi, diperlukan dataset waktu yang lebih panjang atau dataset lain yang benar-benar dipisahkan sebagai data uji.

## Alur sistem untuk Bab III

1. Pengguna masuk ke sistem, membuka **Data Management**, lalu mengimpor `dataset-pipeline.xlsx` atau `scada_stratified_500_seed42.xlsx`.
2. Frontend membaca nilai yang terlihat pada Excel. Jika sebuah kolom sensor berformat tanggal Excel, sistem memberi peringatan agar serial tanggal internal tidak masuk sebagai nilai sensor.
3. Backend memvalidasi timestamp, status biner, kelengkapan data, dan rentang nilai sensor sebelum data disimpan ke tabel `sensor_logs`.
4. Pada halaman **Eksekusi Algoritma**, pengguna memilih K-Means atau DBSCAN serta Min-Max atau Z-Score. Normalisasi dilakukan hanya saat eksekusi model, bukan saat impor, sehingga data sumber di database tetap dalam satuan aslinya.
5. Hasil eksekusi disimpan sebagai riwayat, kemudian ditampilkan pada halaman **Monitoring** dan **Dashboard**.
6. Halaman Monitoring mengambil hasil eksekusi tersimpan paling baru atau satu riwayat yang dipilih. Urutan sparkline dibangun dari timestamp menaik, lalu tabel ditampilkan menurun agar observasi terbaru berada di atas.

Normalisasi Min-Max mengubah setiap fitur ke rentang 0 hingga 1. Z-Score memusatkan data pada rata-rata 0 dengan simpangan baku 1. Kedua metode dibandingkan karena algoritma berbasis jarak peka terhadap perbedaan skala pressure, flow rate, temperature, dan pump speed.

## Catatan tampilan Monitoring dan akses mobile

Monitoring adalah visualisasi **hasil eksekusi historis**, bukan integrasi aliran SCADA real-time. Label "Anomaly" berarti observasi ditandai oleh algoritma; label "Normal" berarti tidak ditandai pada konfigurasi tersebut. Keduanya bukan diagnosis fisik kebocoran, sumbatan, surge, maupun pernyataan bahwa pipeline aman.

Batang empat sensor pada detail observasi memakai rentang validasi dataset hanya sebagai skala visual. Batang tersebut bukan MAOP, set point, alarm, atau standar keselamatan. Teks tindak lanjut dibatasi pada peninjauan record dan validasi penelitian; sistem tidak memberi instruksi operasi lapangan.

Antarmuka menggunakan sidebar yang menjadi menu overlay pada layar kecil, tombol menu pada header, padding konten responsif, kartu/grid yang dapat menyusut, dan tabel dengan gulir horizontal. Dengan demikian fungsi utama tetap dapat diakses pada mobile tanpa memaksakan tabel lebar menjadi kolom sempit.

## Interpretasi hasil model untuk Bab IV

### K-Means

K-Means mengelompokkan observasi berdasarkan kedekatan pada empat fitur yang telah dinormalisasi. Nomor `Kluster 1`, `Kluster 2`, dan seterusnya hanya label internal; nomor tersebut tidak bermakna normal atau anomali, dan bukan `segment_id` tertentu.

Centroid adalah titik pusat matematis sebuah cluster, bukan satu baris sensor nyata. Panel centroid menampilkan pressure, flow rate, temperature, dan pump speed dalam satuan asli setelah hasil centroid dikembalikan dari skala normalisasi. Perbedaan antar-cluster dapat disebabkan oleh satu atau beberapa dari empat fitur; kesimpulan tidak boleh dibuat hanya dari pressure atau flow rate.

Untuk K-Means, sebuah observasi ditandai anomali bila jaraknya ke centroid terdekat lebih besar daripada ambang robust `median + 3*MAD`. Nilai ambang adalah jarak Euclidean pada ruang empat dimensi yang telah dinormalisasi, sehingga bukan satuan bar, m3/h, derajat Celsius, atau rpm. Nilai tersebut tidak boleh ditafsirkan sebagai batas fisik operasional pipeline.

### DBSCAN

DBSCAN membentuk cluster berdasarkan kepadatan titik. Titik dengan label noise (`-1`) ditandai sebagai anomali. Parameter `eps` ditentukan dari k-distance dan `min_samples` ditetapkan 5 sesuai jumlah fitur (4) ditambah satu. Bila DBSCAN hanya menghasilkan satu cluster non-noise, Silhouette dan Davies-Bouldin tidak boleh dipakai untuk menyatakan kualitas pemisahan cluster.

### Metrik dan cara menulis kesimpulan

Silhouette Score dan Davies-Bouldin Index adalah metrik struktur internal cluster. Silhouette lebih tinggi dan Davies-Bouldin lebih rendah menunjukkan struktur cluster yang lebih baik, tetapi keduanya **bukan** accuracy. Accuracy, precision, recall, dan F1-score dihitung setelah model selesai menggunakan kolom `target` sebagai pembanding eksternal.

Gunakan kalimat seperti: “Pada konfigurasi [algoritma] dengan [normalisasi], struktur internal cluster memperoleh Silhouette Score [nilai] dan Davies-Bouldin Index [nilai]. Berdasarkan label `target` pada dataset publik, konfigurasi tersebut memperoleh precision [nilai], recall [nilai], dan F1-score [nilai].” Hindari kalimat “sistem terbukti aman”, “kerusakan pasti terdeteksi”, atau “model paling akurat” bila pemilihan model hanya memakai Silhouette Score.

## Template hasil Bab IV

Isi tabel berikut setelah empat eksekusi selesai. Jangan mengisi nilai yang belum dihasilkan sistem.

| Algoritma | Normalisasi | Parameter utama | Jumlah anomali | Silhouette | Davies-Bouldin | Accuracy | Precision | Recall | F1 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| K-Means | Min-Max | k = ...; threshold = ... | ... | ... | ... | ... | ... | ... | ... |
| K-Means | Z-Score | k = ...; threshold = ... | ... | ... | ... | ... | ... | ... | ... |
| DBSCAN | Min-Max | eps = ...; min_samples = 5 | ... | ... | ... | ... | ... | ... | ... |
| DBSCAN | Z-Score | eps = ...; min_samples = 5 | ... | ... | ... | ... | ... | ... | ... |

Lampirkan tangkapan layar konfigurasi, panel centroid K-Means, tabel anomali, dan hasil monitoring. Gunakan Dashboard hanya sebagai ringkasan visual; tabel metrik lengkap pada Monitoring atau tabel Bab IV tetap menjadi rujukan utama.
