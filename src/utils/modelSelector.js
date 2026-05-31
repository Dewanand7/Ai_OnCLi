import readlineSync from "readline-sync";
import fs from "fs";

const config = JSON.parse(
  fs.readFileSync(new URL("../config/config.json", import.meta.url))
);

export const selectModel = () => {
  console.log("\nAvailable Models:");
  config.models.forEach((m, i) => console.log(`${i + 1}. ${m}`));

  const choice = readlineSync.question("Choose model: ");
  return config.models[choice - 1] || config.defaultModel;
};