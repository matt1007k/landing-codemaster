import express, { Request, Response } from "express";
import expressWs from "express-ws";
import { WebSocket } from "ws";
import http from "http";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const port = 8080;
const wsInstance = expressWs(app, server);

app.use(
  cors({
    origin: ["http://localhost:4321"],
  })
);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

// Store clients by roomId
interface RoomClients {
  [roomId: string]: WebSocket[];
}
const roomClients: RoomClients = {};

app.ws("/ws/:roomId", (ws: WebSocket, req: Request) => {
  const { roomId } = req.params;
  console.log(`New connection to room: ${roomId}`);

  if (!roomClients[roomId]) {
    roomClients[roomId] = [];
  }
  roomClients[roomId].push(ws);

  ws.on("message", (message: string) => {
    console.log(`Received message in room ${roomId}: ${message}`);
    roomClients[roomId].forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on("close", () => {
    console.log(`Client disconnected from room: ${roomId}`);
    const index = roomClients[roomId].indexOf(ws);
    if (index > -1) {
      roomClients[roomId].splice(index, 1);
    }
    // Clean up room if no clients are left
    if (roomClients[roomId].length === 0) {
      delete roomClients[roomId];
    }
  });
});

// The /wss path remains as is, but it won't be affected by /send-message anymore
app.ws("/wss", (ws: WebSocket, req: Request) => {
  console.log("New connection to /wss");

  // This `clients` array is now separate from the room-specific clients
  // If you want to send messages to all clients including /wss from a separate endpoint,
  // you'd need a different mechanism or merge `roomClients` logic.
  // For this specific request, we are only targeting /ws/:roomId.
  ws.send("Welcome to the server! (from /wss)");

  ws.on("message", (message: string) => {
    console.log(`Received message on /wss: ${message}`);
    // You would typically broadcast to other /wss clients here if this was a separate chat
    // For now, it just echoes back or handles messages specific to this general path.
  });

  ws.on("close", () => {
    console.log("Client disconnected from /wss");
  });
});

app.get("/send-message", (req: Request, res: Response) => {
  const targetRoomId = req.query.roomId as string; // Get the room ID from query parameter

  if (!targetRoomId) {
    return res
      .status(400)
      .send(
        "Please provide a 'roomId' query parameter (e.g., /send-message?roomId=yourRoom)"
      );
  }

  const clientsInRoom = roomClients[targetRoomId];

  if (clientsInRoom && clientsInRoom.length > 0) {
    clientsInRoom.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            message: `Nice message from server for room ${targetRoomId}`,
            user: "User Server",
            avatar: "https://mighty.tools/mockmind-api/content/human/80.jpg",
            timestamp: new Date().toISOString(),
          })
        );
      }
    });
    res.send(`Message sent to clients in room: ${targetRoomId}`);
  } else {
    res.status(404).send(`No clients found in room: ${targetRoomId}`);
  }
});

app.get("/send-message-all", (req: Request, res: Response) => {
  const clients = wsInstance.getWss().clients;

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send("Hello from the server! (from /send-message-all)");
    }
  });
});
server.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
