import fs from "fs";

const FILE = "chat-history.json";

export const saveHistory = (messages) => {
  fs.writeFileSync(FILE, JSON.stringify(messages, null, 2));
};

export const loadHistory = () => {
  if (fs.existsSync(FILE)) {
    return JSON.parse(fs.readFileSync(FILE));
  }
  return [];
};