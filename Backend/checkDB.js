const mysql = require('mysql2/promise');

async function checkDB() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'scada-sentinel'
  });

  try {
    // 1. Cek struktur tabel users
    console.log('=== STRUKTUR TABEL users ===');
    const [columns] = await pool.execute('DESCRIBE users');
    console.table(columns);

    // 2. Cek isi tabel users
    console.log('\n=== ISI TABEL users ===');
    const [rows] = await pool.execute('SELECT * FROM users');
    if (rows.length === 0) {
      console.log('⚠️  TABEL users KOSONG! Tidak ada data sama sekali.');
    } else {
      rows.forEach((row, i) => {
        console.log(`\nRow ${i + 1}:`, { ...row, password: row.password ? row.password.substring(0, 20) + '...' : 'KOSONG' });
      });
    }

    // 3. Cek apakah ada user dengan username spesifik
    console.log('\n=== CEK USERNAME "admin" ===');
    const [adminRows] = await pool.execute("SELECT * FROM users WHERE username = 'admin'");
    console.log('Hasil:', adminRows.length, 'baris ditemukan');
    if (adminRows.length > 0) {
      console.log('Data admin:', { ...adminRows[0], password: adminRows[0].password ? adminRows[0].password.substring(0, 30) + '...' : 'KOSONG' });
    }

  } catch (err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    await pool.end();
  }
}

checkDB();
