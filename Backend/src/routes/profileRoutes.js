const express = require("express");
const router = express.Router();
const { getProfile, updateProfile } = require("../controllers/profileController");

// Endpoint ini dipakai oleh MyProfile.jsx (GET data)
router.get("/profile/:id", getProfile);

// Endpoint ini dipakai JUGA oleh MyProfile.jsx DAN Security.jsx (PUT data)
router.put("/profile/:id", updateProfile);

module.exports = router;