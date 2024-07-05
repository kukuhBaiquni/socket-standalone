/* eslint-disable no-undef */
import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import { nanoid } from "nanoid";
import { produce } from "immer";
import OpenAI from "openai";
import axios from "axios";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    method: ["*"],
  },
});

const API_URL = "https://app.lenna.ai/backend/api/text-to-speech";

const openai = new OpenAI({
  apiKey: "",
});

io.on("connect", (socket) => {
  socket.join("PIKONG");

  socket.on("ON_SPEECH_END", async (data) => {
    console.log("DATA", data);

    if (data) {
      const chatCompletion = await openai.chat.completions.create({
        messages: [
          {
            role: "user",
            content: data,
          },
        ],
        model: "gpt-3.5-turbo",
      });

      const response = await axios({
        url: API_URL,
        responseType: "arraybuffer",
        params: {
          text: chatCompletion?.choices?.[0]?.message?.content,
          gender: "female",
          lang: "id",
          speaking_rate: 1,
          pitch: 1,
        },
      });

      socket.emit("SPEECH_RESULT", response.data);
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
