const db = require("../config/db");
// Menggunakan bcryptjs untuk handling keamanan password
const bcrypt = require("bcryptjs"); 

// ============================================
// 1. GET USER PROFILE (Ambil Data Profil)
// ============================================
const getProfile = (req, res) => {
  const userId = req.params.id;

  console.log(`[SCADA Backend] Menerima request GET Profile untuk ID: ${userId}`);

  // Mengambil data user berdasarkan ID dari tabel users
  const query = "SELECT * FROM users WHERE id = ?";
  
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error("❌ Database Error pada getProfile:", err);
      // Mengirimkan respon error ke frontend agar spinner loading berhenti
      return res.status(500).json({ 
        success: false, 
        message: "Internal server database error saat mengambil data profil." 
      });
    }
    
    // Jika ID (misal ID 2) tidak ditemukan di dalam tabel users
    if (result.length === 0) {
      console.log(`⚠️ Warning: User dengan ID ${userId} tidak ditemukan di tabel users.`);
      return res.status(404).json({ 
        success: false, 
        message: `User dengan ID ${userId} tidak terdaftar di sistem.` 
      });
    }

    const user = result[0];

    // ✨ LOGIC DEFENSE: Memberikan fallback data aman jika ada kolom MySQL yang bernilai NULL
    const safeProfileData = {
      id: user.id,
      username: user.username,
      role: user.role || "Admin",
      email: user.email || "admin@sentinelsystem.co.id",
      phone: user.phone || "+62 812-3456-7890",
      location: user.location || "Indramayu, Jawa Barat",
      status: user.status || "Active & Verified"
    };

    console.log("✅ Sukses: Data profil berhasil dikirim ke frontend!");
    return res.status(200).json({ 
      success: true, 
      data: safeProfileData 
    });
  });
};

// ============================================
// 2. UPDATE PROFILE & CHANGE PASSWORD (Simpan Data)
// ============================================
const updateProfile = (req, res) => {
  const userId = req.params.id;
  const { username, email, phone, location, currentPassword, newPassword, confirmPassword } = req.body;

  console.log(`[SCADA Backend] Menerima request PUT Update Profile untuk ID: ${userId}`);

  // -----------------------------------------------------------------
  // Skenario A: Request datang dari Security.jsx (Proses Ganti Password)
  // -----------------------------------------------------------------
  if (currentPassword || newPassword || confirmPassword) {
    console.log("[Logic Check] Mendeteksi request penggantian password (Security Mode)");
    
    // Validasi kelengkapan field password di sisi backend
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Untuk ganti password, mohon isi Current, New, dan Confirm Password!" 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Confirm Password tidak cocok dengan New Password!" 
      });
    }

    // Ambil password lama (hash) dari DB untuk divalidasi
    const checkPassQuery = "SELECT password FROM users WHERE id = ?";
    db.query(checkPassQuery, [userId], async (err, result) => {
      if (err || result.length === 0) {
        return res.status(500).json({ success: false, message: "User tidak valid atau tidak ditemukan." });
      }

      // Verifikasi password saat ini menggunakan bcrypt
      const match = await bcrypt.compare(currentPassword, result[0].password);
      if (!match) {
        return res.status(400).json({ success: false, message: "Current Password yang Anda masukkan salah!" });
      }

      // Hash password baru yang akan disimpan ke database
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Jalankan query update data profil sekaligus password baru ke tabel users
      const updateWithPassQuery = `
        UPDATE users 
        SET username = ?, email = ?, phone = ?, location = ?, password = ? 
        WHERE id = ?
      `;
      
      db.query(updateWithPassQuery, [username, email, phone, location, hashedNewPassword, userId], (updateErr) => {
        if (updateErr) {
          if (updateErr.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "Username sudah digunakan oleh user lain." });
          }
          console.error("❌ Error Update Skenario A:", updateErr);
          return res.status(500).json({ success: false, message: "Gagal memperbarui data & password baru." });
        }
        console.log("✅ Sukses: Password dan data profil berhasil diperbarui!");
        return res.status(200).json({ success: true, message: "Password akun berhasil diperbarui!" });
      });
    });

  } else {
    // -----------------------------------------------------------------
    // Skenario B: Request datang dari MyProfile.jsx (Hanya Update Info Umum)
    // -----------------------------------------------------------------
    console.log("[Logic Check] Mendeteksi request update informasi umum tanpa ganti password");

    const updateInfoQuery = `
      UPDATE users 
      SET username = ?, email = ?, phone = ?, location = ? 
      WHERE id = ?
    `;

    db.query(updateInfoQuery, [username, email, phone, location, userId], (updateErr) => {
      if (updateErr) {
        if (updateErr.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, message: "Username sudah digunakan oleh user lain." });
        }
        console.error("❌ Error Update Skenario B:", updateErr);
        return res.status(500).json({ success: false, message: "Gagal memperbarui info profil ke database." });
      }
      console.log("✅ Sukses: Informasi profil umum berhasil diperbarui!");
      return res.status(200).json({ success: true, message: "Info profil berhasil diperbarui!" });
    });
  }
};

module.exports = { getProfile, updateProfile };