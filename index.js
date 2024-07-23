/* eslint-disable no-undef */
import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import { nanoid } from "nanoid";
import { produce } from "immer";
import OpenAI from "openai";
import axios from "axios";
import { config } from "dotenv";

config();

const server = http.createServer(app);
const io = new Server(server, {
  addTrailingSlash: false,
  cors: {
    origin: "*",
  },
});

const API_URL = "https://app.lenna.ai/backend/api/text-to-speech";

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

io.on("connect", (socket) => {
  socket.join("PIKONG");

  socket.on("ON_SPEECH_END", async (data) => {
    console.log("DATA", data);

    if (data.length) {
      const chatCompletion = await openai.chat.completions.create({
        messages: data,
        model: "gpt-3.5-turbo",
      });

      const audio = await openai.audio.speech.create({
        model: "tts-1-hd",
        voice: "alloy",
        input: chatCompletion?.choices?.[0]?.message?.content,
      });

      const buffer = Buffer.from(await audio.arrayBuffer());
      // const response = await axios({
      //   url: API_URL,
      //   responseType: "arraybuffer",
      //   params: {
      //     text: chatCompletion?.choices?.[0]?.message?.content,
      //     gender: "female",
      //     lang: "id",
      //     speaking_rate: 1,
      //     pitch: 1,
      //   },
      // });

      socket.emit("SPEECH_RESULT", {
        buffer: buffer,
        text: chatCompletion?.choices?.[0]?.message?.content,
      });
    }
  });

  const joinedUsers = io.sockets.adapter.rooms.get("PIKONG");
  if (joinedUsers.size > 1) {
    io.emit("PAOK");
  }

  socket.on("MESSAGE", (data) => {
    console.log("MESSAGE", data);
    socket.to("PIKONG").emit("MESSAGE", data);
  });

  socket.on("OFFER", (data) => {
    console.log("OFFER");
    socket.to("PIKONG").emit("OFFER", data);
  });

  socket.on("ANSWER", (data) => {
    console.log("ANSWER");
    socket.to("PIKONG").emit("ANSWER", data);
  });

  socket.on("ICE_CANDIDATE", (data) => {
    console.log("ICE CANDIDATE");
    socket.to("PIKONG").emit("ICE_CANDIDATE", data);
  });
});

server.listen(3001);
