/* eslint-disable no-undef */
import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import { nanoid } from "nanoid";
import { produce } from "immer";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    method: ["*"],
  },
});

io.on("connect", (socket) => {
  console.log("CONNECTED");
});

server.listen(3001);
