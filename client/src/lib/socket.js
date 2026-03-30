import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function createAppSocket(user) {
  return io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    auth: {
      userId: user?.id || ""
    }
  });
}
