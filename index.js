/* eslint-disable no-undef */
import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import { nanoid } from "nanoid";
import { produce } from "immer";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://ms-client.vercel.app/",
  },
});

let room = [];

io.on("connect", (socket) => {
  io.emit("BLAST_ROOM", room);

  socket.on("CREATE_ROOM", (data) => {
    const selfId = nanoid();
    socket.join(selfId);

    const me = {
      name: data,
      id: selfId,
      shortName: splitName(data),
    };

    const roomId = nanoid();
    const res = {
      roomId,
      roomName: `room-${Date.now()}`,
      owner: me,
      createdAt: new Date(),
      participant: [me],
    };
    console.log("ROOM", room);
    console.log(res);
    room = [...room, res];
    socket.join(roomId);
    io.emit("BLAST_ROOM", room);
    socket.emit("ME", me);
    socket.emit("INITIATE_ROOM", res);
    console.log("CREATE_ROOM");
  });

  socket.on("REQUEST_JOIN", (data) => {
    const owner = data.room.owner; // room.find((rm) => rm.roomId === data.roomId)?.owner;

    const selfId = nanoid();
    const me = {
      name: data.name,
      id: selfId,
      shortName: splitName(data.name),
    };

    socket.emit("ME", me);

    socket.to(owner.id).emit("REQUEST_JOIN", {
      roomId: data.room.roomId,
      from: me,
      socketId: socket.id,
    });
    console.log("REQUEST JOIN");
  });

  socket.on("OFFER", (data) => {
    /**
     * data.offer offer
     * data.roomId string
     * data.from {
     *  id: string
     *  name: string
     *  shortName: string
     * }
     */

    // const owner = room.find((rm) => rm.roomId === data.roomId)?.owner;
    socket.broadcast.to(data.roomId).emit("OFFER", {
      offer: data.offer,
      roomId: data.roomId,
      from: data.from,
    });
    console.log("RECEIVE OFFER");
  });

  socket.on("ACCEPT_REQUEST", (data) => {
    io.sockets.sockets.get(data.socketId).join(data.roomId);
    socket.to(data.socketId).emit("ACCEPT_REQUEST", data.roomId);
    const index = room.map((rm) => rm.roomId).indexOf(data.roomId);
    const updatedRoom = produce(room, (draft) => {
      draft[index].participant.push(data.from);
    });
    room = updatedRoom;
    // console.log("updated", updatedRoom);

    console.log("ACCEPT REQUEST", data);
  });

  // socket.on("ACCEPT_REQUEST", (data) => {
  //   // TODO~
  //   /**
  //    * data.roomId string
  //    * data.from {
  //    *  id: string
  //    *  name: string
  //    *  shortName: string
  //    * }
  //    */

  //   const offer = offerQueue.find(
  //     (ofr) => ofr.roomId === data.roomId && ofr.from.id === data.from.id
  //   );

  //   io.sockets.sockets.get(data.socketId).join(data.roomId);
  //   socket.to(data.from.id).emit("ACCEPT_REQUEST", data.roomId);

  //   socket.to(data.roomId).emit("NEW_COMMER", {
  //     user: data.from,
  //   });

  //   offerQueue = offerQueue.filter(
  //     (ofr) => ofr.roomId !== data.roomId && ofr.from.id !== data.from.id
  //   );
  // });

  socket.on("ANSWER", (data) => {
    socket.broadcast.to(data.roomId).emit("ANSWER", data.answer);
    console.log("RECEIVE ANSWER");
    const participant = Array.from(
      io.sockets.adapter.rooms.get(data.roomId) || []
    );
    console.log("PARTICIPANT", participant);
  });

  socket.on("ICE_CANDIDATE", (data) => {
    const targetRoom = room.find((rm) => rm.roomId === data.roomId);
    socket.broadcast.to(data.roomId).emit("ICE_CANDIDATE", {
      iceCandidate: data.iceCandidate,
      participant: targetRoom.participant.filter(
        (par) => par.id !== targetRoom.owner.id
      ),
    });
    console.log("RECEIVE ICE CANDIDATE");
  });

  socket.on("INITIATE_CONNECTION", (data) => {
    console.log("RECEIVE INITIATE CONNECTION", data);
    // console.log("ROOM", room);
    const participant = Array.from(
      io.sockets.adapter.rooms.get(data.roomId) || []
    );
    io.to(data.roomId).emit("INITIATE_CONNECTION", {
      room,
      participant,
    });
  });
});

const splitName = (name) => {
  const [first, second] = name?.split(" ");
  return `${first[0]}${second?.[0] || ""}`;
};

// let availableUser = [];
// let group = [];

// io.on("connect", (socket) => {
//   // socket.handshake?.headers?.token
//   console.log("DJOIN____");
//   socket.on("JOIN", (name) => {
//     const id = `${name}--${Date.now()}`;
//     const me = {
//       name,
//       id,
//       isActive: true,
//     };

//     socket.join(id);
//     // register another user to join room
//     const registerToRoom = io.sockets.sockets
//       .get(socket.id)
//       .join(/*some room */);

//     availableUser.push(me);
//     socket.emit("AUTHORIZE", me);
//     socket.emit("AVAILABLE_USER", availableUser);
//     socket.broadcast.emit("AVAILABLE_USER", availableUser);
//   });

//   socket.on("RECONNECT", (user) => {
//     let clone = [...availableUser];
//     const index = availableUser.map((usr) => usr.id).indexOf(user.id);
//     if (index !== -1) {
//       clone[index].isActive = true;
//       availableUser = clone;
//     }
//     socket.join(user.id);
//     socket.broadcast.emit("AVAILABLE_USER", availableUser);
//     socket.emit("AVAILABLE_USER", availableUser);
//     socket.emit("AUTHORIZE", user);
//   });

//   socket.on("PRIVATE_MESSAGE", (data) => {
//     socket.to(data.to.id).emit("PRIVATE_MESSAGE", data);
//     socket.emit("PRIVATE_MESSAGE", data);
//   });

//   socket.on("READ_MESSAGE", (data) => {
//     socket.to(data.to).emit("READ_MESSAGE", data.room);
//   });

//   socket.on("START_TYPING", (data) => {
//     socket.to(data.to).emit("START_TYPING", data.me);
//   });

//   socket.on("STOP_TYPING", (data) => {
//     socket.to(data.to).emit("STOP_TYPING", data.me);
//   });

//   socket.on("DISCONNECTED", (user) => {
//     let clone = [...availableUser];
//     const index = availableUser.map((usr) => usr.id).indexOf(user.id);
//     if (index !== -1) {
//       clone[index].isActive = false;
//       availableUser = clone;
//     }
//     socket.broadcast.emit("AVAILABLE_USER", availableUser);
//   });

//   // ========================================================================

//   socket.on("offer", (data) => {
//     io.to(data.to).emit("offer", data.offer);
//   });

//   socket.on("answer", (data) => {
//     io.to(data.to).emit("answer", data.answer);
//   });

//   socket.on("candidate", (data) => {
//     io.to(data.to).emit("candidate", data.candidate);
//   });

//   socket.on("disconnect", () => {
//     console.log("Client disconnected");
//   });
// });

// run server
server.listen(3001);
