import bcrypt from "bcrypt";

const createHash = async () => {
  const password = "admin12345";
  const hash = await bcrypt.hash(password, 10);
  console.log("Hashed Password:", hash);
};

createHash();
