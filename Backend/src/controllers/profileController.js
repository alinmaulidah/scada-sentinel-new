const bcrypt = require("bcryptjs");
const db = require("../config/db");

const profileColumns = "id, username, role, email, phone, location, status";

const toProfile = (user) => ({
  id: user.id,
  username: user.username,
  role: user.role || "Admin",
  email: user.email || "admin@sentinelsystem.co.id",
  phone: user.phone || "+62 812-3456-7890",
  location: user.location || "Indramayu, Jawa Barat",
  status: user.status || "Active & Verified",
});

const findUser = async (userId) => {
  const [users] = await db.execute(`SELECT ${profileColumns}, password FROM users WHERE id = ?`, [userId]);
  return users[0];
};

const getProfile = async (req, res) => {
  try {
    const user = await findUser(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "Pengguna tidak ditemukan." });
    }

    return res.json({ success: true, data: toProfile(user) });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal mengambil profil pengguna." });
  }
};

const updateProfile = async (req, res) => {
  const { username, email, phone, location, currentPassword, newPassword, confirmPassword } = req.body;

  if (!username || !email || !phone || !location) {
    return res.status(400).json({ success: false, message: "Semua informasi profil wajib diisi." });
  }

  const wantsPasswordChange = currentPassword || newPassword || confirmPassword;

  if (wantsPasswordChange && (!currentPassword || !newPassword || !confirmPassword)) {
    return res.status(400).json({ success: false, message: "Isi password saat ini, password baru, dan konfirmasinya." });
  }

  if (wantsPasswordChange && newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Konfirmasi password baru tidak sesuai." });
  }

  try {
    const user = await findUser(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "Pengguna tidak ditemukan." });
    }

    if (wantsPasswordChange && !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ success: false, message: "Password saat ini salah." });
    }

    const values = [username, email, phone, location];
    let query = "UPDATE users SET username = ?, email = ?, phone = ?, location = ?";

    if (wantsPasswordChange) {
      query += ", password = ?";
      values.push(await bcrypt.hash(newPassword, 10));
    }

    values.push(req.user.id);
    await db.execute(`${query} WHERE id = ?`, values);

    return res.json({
      success: true,
      message: wantsPasswordChange ? "Password berhasil diperbarui." : "Profil berhasil diperbarui.",
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ success: false, message: "Username sudah digunakan." });
    }

    console.error("UPDATE PROFILE ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal memperbarui profil pengguna." });
  }
};

module.exports = { getProfile, updateProfile };
