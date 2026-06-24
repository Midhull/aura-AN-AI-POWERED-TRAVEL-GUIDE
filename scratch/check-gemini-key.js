import fs from "fs";

// Check process.env and .env.local
const envContent = fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "";
const envVars = {};
envContent.split("\n").forEach((line) => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    envVars[parts[0].trim()] = parts.slice(1).join("=").trim();
  }
});

console.log("GEMINI_API_KEY in process.env:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
console.log("GEMINI_API_KEY in .env.local:", envVars.GEMINI_API_KEY ? "EXISTS" : "MISSING");
