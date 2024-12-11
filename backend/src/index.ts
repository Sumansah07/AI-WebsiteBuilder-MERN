require("dotenv").config();
import express from "express";
import OpenAI from "openai";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";
import cors from "cors";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Make sure to set this in your .env file
});

const app = express();
app.use(cors());
app.use(express.json());

app.post("/template", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or gpt-3.5-turbo
      messages: [{
        role: 'user', 
        content: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra"
      }],
      max_tokens: 10
    });

    const answer = response.choices[0].message.content?.trim().toLowerCase();

    if (answer === "react") {
      res.json({
        prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
        uiPrompts: [reactBasePrompt]
      });
      return;
    }

    if (answer === "node") {
      res.json({
        prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
        uiPrompts: [nodeBasePrompt]
      });
      return;
    }

    res.status(403).json({message: "You can't access this"});
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Error processing request"});
  }
});

app.post("/chat", async (req, res) => {
  try {
    const messages = req.body.messages;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or gpt-3.5-turbo
      messages: messages,
      max_tokens: 8000
    });

    res.json({
      response: response.choices[0].message.content
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Error processing chat request"});
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});