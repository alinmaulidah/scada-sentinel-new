const bcrypt = require("bcryptjs");

const createHash = async () => {
  const password = "alin12345";
  const hash = await bcrypt.hash(password, 10);
  console.log("Hashed Password:", hash);
};

createHash();
