const test = require("node:test");
const assert = require("node:assert/strict");

const envKeys = [
  "NODE_ENV",
  "JWT_SECRET",
  "CORS_ORIGIN",
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
];

const loadConfig = (values) => {
  const original = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

  envKeys.forEach((key) => delete process.env[key]);
  Object.assign(process.env, values);
  delete require.cache[require.resolve("../src/config/env")];

  try {
    return require("../src/config/env");
  } finally {
    envKeys.forEach((key) => {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    });
  }
};

test("production requires all security and database environment variables", () => {
  assert.throws(
    () => loadConfig({ NODE_ENV: "production", JWT_SECRET: "secret" }),
    /Environment production belum lengkap: CORS_ORIGIN, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME/
  );
});

test("database port is configurable", () => {
  const config = loadConfig({ DB_PORT: "3307" });

  assert.equal(config.database.port, 3307);
});
