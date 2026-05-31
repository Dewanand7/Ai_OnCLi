import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { streamMessage } from "../src/services/chatService.js";
import { db } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(__dirname, "../frontend")));


// 🔥 CHAT API
app.post("/chat", async (req, res) => {
  let { messages, model, chatId } = req.body;

  const userMessage = messages[messages.length - 1].content;

  // ✅ SYSTEM PROMPT (clean responses)
  messages.unshift({
    role: "system",
    content: `
You are a professional AI assistant.

Rules:
- Format code in markdown with language (like \`\`\`html)
- Keep answers clean and readable
- Avoid unnecessary long explanations
- Prefer code-first answers when user asks for implementation
`
  });

  try {
    await db.run(
      "INSERT INTO chats (chat_id, role, content) VALUES (?, ?, ?)",
      [chatId, "user", userMessage]
    );

    const stream = await streamMessage(model, messages);

    res.setHeader("Content-Type", "text/plain");

    let aiResponse = "";

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        aiResponse += text;
        res.write(text);
      }
    }

    await db.run(
      "INSERT INTO chats (chat_id, role, content) VALUES (?, ?, ?)",
      [chatId, "assistant", aiResponse]
    );

    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});


// 🔥 LOAD HISTORY
app.get("/history/:chatId", async (req, res) => {
  try {
    const rows = await db.all(
      "SELECT * FROM chats WHERE chat_id = ? ORDER BY id",
      [req.params.chatId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});


const server = app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});

process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  server.close(() => {
    console.log("✅ Server stopped");
    process.exit(0);
  });
});