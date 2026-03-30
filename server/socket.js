import { Server } from "socket.io";

let ioInstance = null;
const onlineUsers = new Map();

function broadcastOnlineCount() {
  if (!ioInstance) {
    return;
  }

  ioInstance.emit("online:update", {
    count: onlineUsers.size
  });
}

export function initializeSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  ioInstance.on("connection", (socket) => {
    const userId = String(socket.handshake.auth?.userId || socket.id);
    socket.join(userId);
    onlineUsers.set(socket.id, userId);
    broadcastOnlineCount();

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.id);
      broadcastOnlineCount();
    });
  });

  return ioInstance;
}

export function getIo() {
  return ioInstance;
}

export function getOnlineCount() {
  return onlineUsers.size;
}

export function emitToUser(userId, event, payload) {
  if (!ioInstance || !userId) {
    return;
  }

  ioInstance.to(String(userId)).emit(event, payload);
}
