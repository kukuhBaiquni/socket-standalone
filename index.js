/* eslint-disable no-undef */
import http from "http";
import app from "./app.js";
import { Server } from "socket.io";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    method: ["*"],
  },
});

let availableUser = [];
let group = [];

io.on("connect", (socket) => {
  // socket.handshake?.headers?.token
  socket.on("JOIN", (name) => {
    const id = `${name}--${Date.now()}`;
    const me = {
      name,
      id,
      isActive: true,
    };

    socket.join(id);
    // register another user to join room
    const registerToRoom = io.sockets.sockets
      .get(socket.id)
      .join(/*some room */);

    availableUser.push(me);
    socket.emit("AUTHORIZE", me);
    socket.emit("AVAILABLE_USER", availableUser);
    socket.broadcast.emit("AVAILABLE_USER", availableUser);
  });

  socket.on("RECONNECT", (user) => {
    let clone = [...availableUser];
    const index = availableUser.map((usr) => usr.id).indexOf(user.id);
    if (index !== -1) {
      clone[index].isActive = true;
      availableUser = clone;
    }
    socket.join(user.id);
    socket.broadcast.emit("AVAILABLE_USER", availableUser);
    socket.emit("AVAILABLE_USER", availableUser);
    socket.emit("AUTHORIZE", user);
  });

  socket.on("PRIVATE_MESSAGE", (data) => {
    socket.to(data.to.id).emit("PRIVATE_MESSAGE", data);
    socket.emit("PRIVATE_MESSAGE", data);
  });

  socket.on("READ_MESSAGE", (data) => {
    socket.to(data.to).emit("READ_MESSAGE", data.room);
  });

  socket.on("START_TYPING", (data) => {
    socket.to(data.to).emit("START_TYPING", data.me);
  });

  socket.on("STOP_TYPING", (data) => {
    socket.to(data.to).emit("STOP_TYPING", data.me);
  });

  socket.on("DISCONNECTED", (user) => {
    let clone = [...availableUser];
    const index = availableUser.map((usr) => usr.id).indexOf(user.id);
    if (index !== -1) {
      clone[index].isActive = false;
      availableUser = clone;
    }
    socket.broadcast.emit("AVAILABLE_USER", availableUser);
  });
});

// run server
server.listen(process.env.PORT);
