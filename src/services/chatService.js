import { client } from "../config/client.js";

// ONLY AI logic
export const streamMessage = async (model, messages) => {
  const stream = await client.chat.completions.create({
    model,
    messages,
    stream: true,
  });

  return stream;
};