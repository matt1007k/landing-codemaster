// import { DatabaseSync } from "node:sqlite";
// const database = new DatabaseSync(":memory:");

// database.exec(`
//   CREATE TABLE data(
//     key INTEGER PRIMARY KEY,
//     value TEXT
//   ) STRICT
// `);
// // Create a prepared statement to insert data into the database.
// const insert = database.prepare("INSERT INTO data (key, value) VALUES (?, ?)");
// // Execute the prepared statement with bound values.
// insert.run(1, "hello");
// insert.run(2, "world");
// // Create a prepared statement to read data from the database.
// const query = database.prepare("SELECT * FROM data ORDER BY key");
// // Execute the prepared statement and log the result set.
// console.log(query.all());

// console.log("Hello via Bun!");
import express, { Request, Response } from "express";
// import WebSocket from "ws";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { set } from "astro:schema";
const app = express();
const server = http.createServer(app);
const port = 8080;
const io = new Server(server, {
  cors: {
    origin: "http://localhost:4321",
    methods: ["GET", "POST"],
  },
});
// const wss = new WebSocket.Server({ port });

app.use(
  cors({
    origin: ["http://localhost:4321"],
  })
);
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("message", (msg) => {
    console.log("message: " + msg);
  });

  socket.on("sendMessage", (msg: { message: string }) => {
    console.log("sendMessage: " + msg.message);
    socket.to("room").emit("sendMessage", msg);
  });
  socket.on("join", (room: string) => {
    console.log("join: " + room);
    socket.join("room");
    socket.broadcast.to(room).emit("join_user", room);
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  setInterval(() => {
    socket
      .to("room")
      .emit("sendMessage", { message: "Hello from the server!" });
  }, 1000 * 10);
});

server.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
