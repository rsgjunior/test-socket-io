import express from "express";
import url from "url";
import http from "http";
import path from "node:path";
import Logger from "./logger.js";
import { Server as SocketIoServer } from "socket.io";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const logger = new Logger();
const app = express();
const port = 3000;

const server = http.createServer(app);

const io = new SocketIoServer(server);

app.use("/web", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.redirect("/web");
});

io.on("connection", (socket) => {
  logger.log(`user "${socket.handshake.query.username}" connected`);

  io.emit("user connected", {
    username: socket.handshake.query.username,
    timestamp: Date.now(),
  });

  io.fetchSockets().then((data) => {
    socket.emit(
      "all users online",
      data.map((e) => e.handshake.query.username)
    );
  });

  socket.on("disconnect", () => {
    logger.log(`user ${socket.handshake.query.username} disconnected`);

    io.emit("user stopped typing", socket.handshake.query.username);
    io.emit("user disconnected", {
      username: socket.handshake.query.username,
      timestamp: Date.now(),
    });
  });

  socket.on("chat message", (msg) => {
    logger.log(`received message: ${msg}`);

    const msgObj = {
      message: msg,
      username: socket.handshake.query.username,
      timestamp: Date.now(),
    };

    io.emit("chat message", msgObj);
  });

  socket.on("user typing", (data) => {
    logger.log(`user ${socket.handshake.query.username} typing`);

    socket.broadcast.emit("user typing", socket.handshake.query.username);
  });

  socket.on("user stopped typing", (data) => {
    logger.log(`user ${socket.handshake.query.username} stopped typing`);

    socket.broadcast.emit(
      "user stopped typing",
      socket.handshake.query.username
    );
  });
});

server.listen(port, () => {
  logger.log(`Server running on port ${port}`);
});
