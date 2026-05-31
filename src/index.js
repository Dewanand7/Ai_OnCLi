import readlineSync from "readline-sync";
import { selectModel } from "./utils/modelSelector.js";
import { streamMessage } from "./services/chatService.js";
import { saveHistory, loadHistory } from "./utils/historyManager.js";
import fs from "fs";

const config = JSON.parse(
  fs.readFileSync(new URL("./config/config.json", import.meta.url))
);

const SYSTEM_PROMPT = `
You are an expert EDI Mapping Assistant.
Generate mapping specs, XSLT, and transformation logic.
`;

let model = selectModel();

console.log("\nCommands: /clear /model /save /load /exit\n");

// load previous chat
let messages = [
  { role: "system", content: SYSTEM_PROMPT },
  ...loadHistory(),
];

while (true) {
  const input = readlineSync.question("You: ");

  if (input === "/exit") break;

  if (input === "/clear") {
    messages = [{ role: "system", content: SYSTEM_PROMPT }];
    console.log("🧹 Cleared\n");
    continue;
  }

  if (input === "/model") {
    model = selectModel();
    continue;
  }

  if (input === "/save") {
    saveHistory(messages.slice(1));
    console.log("💾 Saved\n");
    continue;
  }

  if (input === "/load") {
    messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...loadHistory(),
    ];
    console.log("📂 Loaded\n");
    continue;
  }

  messages.push({ role: "user", content: input });

  try {
    const reply = await streamMessage(model, messages);
    messages.push({ role: "assistant", content: reply });

    // limit history
    if (messages.length > config.maxHistory) {
      messages.splice(1, 2);
    }

  } catch (err) {
    console.error("\n❌ Error:", err.message);
  }
}