# Deployment handoff

Repository ini hanya berisi kode dan skema kosong. Jangan commit atau kirim berkas `.env`, dump data SCADA, maupun password lewat GitHub.

## 1. Siapkan database

Impor skema dengan akun administrator MySQL:

```sh
mysql -u root -p < Backend/database/schema.sql
```

Buat akun aplikasi dengan password kuat, lalu batasi aksesnya hanya ke database aplikasi:

```sql
CREATE USER 'scada_app'@'localhost' IDENTIFIED BY 'GANTI_DENGAN_PASSWORD_KUAT';
GRANT SELECT, INSERT, UPDATE, DELETE, DROP ON `scada-sentinel`.* TO 'scada_app'@'localhost';
FLUSH PRIVILEGES;
```

`DROP` diperlukan karena aplikasi menyediakan aksi hapus seluruh data (`TRUNCATE`). MySQL tidak perlu dibuka ke internet bila backend dan database berada pada server yang sama.

## 2. Siapkan environment

Salin `Backend/.env.example` menjadi `Backend/.env`, lalu isi domain, JWT secret baru, dan kredensial `scada_app`. Buat JWT secret baru dengan Node.js; jangan gunakan nilai dari riwayat lama:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Salin `Frontend/.env.example` ke environment build dan ubah menjadi:

```env
VITE_API_URL=https://api.example.com/api
```

`CORS_ORIGIN` di backend harus tepat sama dengan URL frontend, misalnya `https://app.example.com`.

## 3. Instal dan verifikasi

Backend membutuhkan Node.js, Python 3, dan MySQL. Dari folder `Backend`:

```sh
npm ci
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
npm test
```

Set `PYTHON_COMMAND` pada `.env` ke interpreter virtual environment (`/path/ke/venv/bin/python`), lalu jalankan backend dengan `npm start`.

Dari folder `Frontend`:

```sh
npm ci
npm run build
```

Host folder `Frontend/dist` sebagai situs statis dan arahkan domain API ke backend melalui HTTPS. Jalankan backend di belakang reverse proxy seperti Nginx dan buka hanya port 80/443 ke internet.

## 4. Buat akun awal

Skema sengaja tidak membuat akun default. Buat hash password terlebih dahulu dari folder `Backend`:

```sh
node -e "require('bcryptjs').hash(process.argv[1], 10).then(console.log)" 'PASSWORD_ADMIN_BARU'
```

Simpan output hash ke kolom `users.password` melalui MySQL. Jangan menyimpan password mentah di SQL atau Git.

## 5. Handoff

Tambahkan teman sebagai collaborator repository private. Kirim file `.env` yang sudah diisi melalui kanal privat, dan minta mereka clone ulang repository terbaru.
