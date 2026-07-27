
# KUESIONER VALIDASI RULE BASE DETEKSI ANOMALI PIPA SCADA

**Data:** `scada_stratified_500_seed42` (500 sampel stratified dari dataset pipeline SCADA)
**Responden:** Teknisi Pipa / Operator SCADA / Ahli Perpipaan
**Tujuan:** Validasi rule base deteksi anomali dengan pengetahuan dan pengalaman lapangan

---

## A. IDENTITAS RESPONDEN

1. **Jabatan / Peran:** ...
2. **Pengalaman di bidang perpipaan/SCADA:** ... tahun
3. **Instansi / Perusahaan:** ...

---

## B. VARIABEL SENSOR SCADA

**Penjelasan:** Sistem ini menggunakan 4 variabel utama dari data SCADA pipa: **Pressure (tekanan)**, **Flow Rate (laju aliran)**, **Temperature (suhu)**, dan **Pump Speed (kecepatan pompa)**. Dari 13 kolom data SCADA yang tersedia, keempat variabel ini dipilih untuk mendeteksi anomali.

| No | Pertanyaan | STS | TS | N | S | SS |
|----|-----------|:---:|:---:|:---:|:---:|:---:|
| 1 | Keempat variabel (pressure, flow rate, temperature, pump speed) sudah cukup representatif untuk mendeteksi anomali pada sistem perpipaan. | □ | □ | □ | □ | □ |
| 2 | Ada variabel SCADA lain *(sebutkan: …………)* yang menurut pengalaman Anda lebih penting atau sebaiknya ditambahkan sebagai indikator anomali. | □ | □ | □ | □ | □ |
| 3 | Dalam praktik lapangan, **pressure** adalah indikator paling awal yang menunjukkan adanya gangguan pada pipa (kebocoran, penyumbatan, lonjakan). | □ | □ | □ | □ | □ |
| 4 | **Flow rate** saja, tanpa mengetahui arah aliran atau tekanan diferensial, cukup untuk membedakan jenis anomali yang terjadi. | □ | □ | □ | □ | □ |

---

## C. RULE BASE — THRESHOLD DAN POLA ANOMALI

**Penjelasan:** Rule base yang digunakan menggunakan **median dan IQR** sebagai ambang batas (bukan mean dan standar deviasi) karena data SCADA sering memiliki lonjakan ekstrem. Empat pola anomali didefinisikan sebagai berikut:

### Pola 1 — SURGE (Lonjakan)
> **Rule:** Pressure > P_median + 1.5×IQR **DAN** Flow Rate > F_median + 1.5×IQR
> **Severity:** High

| No | Pertanyaan | STS | TS | N | S | SS |
|----|-----------|:---:|:---:|:---:|:---:|:---:|
| 5 | Kombinasi tekanan naik drastis (>1,5 IQR di atas median) **dan** laju aliran naik drastis (>1,5 IQR di atas median) memang mencerminkan kondisi **surge** (lonjakan) di pipa. | □ | □ | □ | □ | □ |
| 6 | Threshold **1,5 × IQR** untuk tekanan dan aliran pada pola surge sudah sesuai dengan batas lonjakan yang berbahaya di lapangan. | □ | □ | □ | □ | □ |
| 7 | Surge pada pipa dapat terjadi tanpa kenaikan aliran yang signifikan — misalnya hanya tekanan yang melonjak karena katup menutup mendadak (water hammer). | □ | □ | □ | □ | □ |
| 8 | Dalam operasi normal, lonjakan tekanan dan aliran sesaat masih dianggap **wajar** (false positive) dan tidak selalu perlu ditindaklanjuti sebagai anomali. | □ | □ | □ | □ | □ |

### Pola 2 — LEAK (Kebocoran)
> **Rule:** Pressure < P_median − 1.0×IQR **DAN** Flow Rate < F_median − 0.5×IQR
> **Severity:** High

| No | Pertanyaan | STS | TS | N | S | SS |
|----|-----------|:---:|:---:|:---:|:---:|:---:|
| 9 | Tekanan turun (<1 IQR di bawah median) **dan** laju aliran turun (<0,5 IQR di bawah median) memang mencerminkan pola **kebocoran** (leak) pada pipa. | □ | □ | □ | □ | □ |
| 10 | Threshold tekanan **1,0 × IQR** pada pola leak sudah sensitif untuk menangkap kebocoran awal (early leak). | □ | □ | □ | □ | □ |
| 11 | Pada kenyataannya, kebocoran kecil justru membuat **flow rate naik** (bukan turun) karena fluida keluar dari sistem — sehingga aturan "flow rate turun" perlu dikaji ulang. | □ | □ | □ | □ | □ |
| 12 | Kebocoran pada pipa lebih mudah dikenali dengan membandingkan **flow inlet vs flow outlet** (neraca aliran), bukan dari threshold statistik satu titik. | □ | □ | □ | □ | □ |

### Pola 3 — BLOCKAGE (Penyumbatan)
> **Rule:** Pressure > P_median + 1.0×IQR **DAN** Flow Rate < F_median − 0.5×IQR
> **Severity:** High

| No | Pertanyaan | STS | TS | N | S | SS |
|----|-----------|:---:|:---:|:---:|:---:|:---:|
| 13 | Tekanan naik (>1 IQR di atas median) **dan** aliran turun (<0,5 IQR di bawah median) memang mencerminkan pola **penyumbatan** (blockage) pada pipa. | □ | □ | □ | □ | □ |
| 14 | Threshold **1,0 × IQR** untuk tekanan pada pola blockage sudah sesuai dengan kondisi awal tersumbat yang perlu diwaspadai. | □ | □ | □ | □ | □ |
| 15 | Dalam praktik, penyumbatan parsial tidak langsung menaikkan tekanan secara signifikan — efeknya baru terlihat setelah akumulasi waktu tertentu (perlu data deret waktu). | □ | □ | □ | □ | □ |

### Pola 4 — DEGRADATION (Degradasi)
> **Rule:** Fallback — semua anomali yang tidak memenuhi 3 pola di atas
> **Severity:** Medium

| No | Pertanyaan | STS | TS | N | S | SS |
|----|-----------|:---:|:---:|:---:|:---:|:---:|
| 16 | Kategori **degradasi** sebagai "fallback" (tidak memenuhi pola surge/leak/blockage) sudah tepat untuk menampung anomali yang tidak terklasifikasi. | □ | □ | □ | □ | □ |
| 17 | Degradasi seharusnya memiliki definisi yang lebih spesifik — misalnya berdasarkan **tren penurunan bertahap** dalam rentang waktu, bukan hanya sebagai kategori sisa. | □ | □ | □ | □ | □ |

---

## D. KONFIRMASI LAPANGAN DAN IMPLEMENTASI

| No | Pertanyaan | STS | TS | N | S | SS |
|----|-----------|:---:|:---:|:---:|:---:|:---:|
| 18 | Rule base ini sudah cukup **siap diterapkan** sebagai sistem deteksi awal (early warning) pada pipeline monitoring tanpa modifikasi berarti. | □ | □ | □ | □ | □ |
| 19 | Anda **setuju** bahwa rule base berbasis median+IQR lebih robust dibanding mean+standar deviasi untuk data SCADA yang memiliki lonjakan ekstrem. | □ | □ | □ | □ | □ |
| 20 | Sistem ini akan lebih baik jika dilengkapi dengan **data deret waktu** (time-series) untuk membedakan anomali sesaat vs anomali berkelanjutan. | □ | □ | □ | □ | □ |

---

## E. SARAN DAN MASUKAN

21. Dari keempat pola anomali (Surge, Leak, Blockage, Degradation), adakah pola anomali **lain** yang sering terjadi di lapangan tetapi belum tercakup?
    _________________________________________________________________________
    _________________________________________________________________________

22. Apakah ada **aturan tambahan (rule)** atau **kondisi spesifik** yang menurut Anda perlu ditambahkan ke dalam sistem?
    _________________________________________________________________________
    _________________________________________________________________________

23. Saran lain untuk pengembangan sistem deteksi anomali ini:
    _________________________________________________________________________
    _________________________________________________________________________
    _________________________________________________________________________

---

**Terima kasih atas partisipasi Anda.**
