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

app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  logger.log(` ${req.ip} ${req.method} ${req.originalUrl}`);
  res.sendFile(path.join(__dirname, "pages", "index.html"));
});

app.get("/chat/:roomID", (req, res) => {
  logger.log(` ${req.ip} ${req.method} ${req.originalUrl}`);
  res.sendFile(path.join(__dirname, "pages", "chat.html"));
});

io.of((name, auth, next) => {
  console.log(name);
  logger.log(`namespace of ${name}`);
  next(null, true);
}).on("connection", (socket) => {
  const namespace = socket.nsp;

  logger.log(
    `user "${socket.handshake.query.username}" connected on namespace ${namespace.name}`
  );

  namespace.emit("user connected", {
    username: socket.handshake.query.username,
    timestamp: Date.now(),
  });

  namespace.fetchSockets().then((data) => {
    socket.emit(
      "all users online",
      data.map((e) => e.handshake.query.username)
    );
  });

  socket.on("disconnect", () => {
    logger.log(`user ${socket.handshake.query.username} disconnected`);

    namespace.emit("user stopped typing", socket.handshake.query.username);
    namespace.emit("user disconnected", {
      username: socket.handshake.query.username,
      timestamp: Date.now(),
    });
  });

  socket.on("chat message", async (msg) => {
    logger.log(
      `user ${socket.handshake.query.username} sent message: '${msg}'`
    );

    const msgObj = {
      message: msg,
      username: socket.handshake.query.username,
      timestamp: Date.now(),
      type: "common",
    };

    // whisper
    if (msg.startsWith("/w ")) {
      logger.log("NOTICE starts with /w");

      // regex for "/w stringDeExemplo Uma frase de exemplo"
      const regexMatch = msg.match(/^\/w\s(\w+)\s(.+)/);

      if (!regexMatch) {
        msgObj.username = null;
        msgObj.type = "error";
        msgObj.message = "Comando inválido. Utilize: '/w Username Mensagem'";
        socket.emit("chat message", msgObj);
        return;
      }

      const usernameBeingWhispered = regexMatch[1];
      const msgString = regexMatch[2];

      if (usernameBeingWhispered === socket.handshake.query.username) {
        msgObj.username = null;
        msgObj.type = "error";
        msgObj.message = "Para de falar sozinho seu maluco...";
        socket.emit("chat message", msgObj);
        return;
      }

      const allSockets = await io.fetchSockets();
      const socketBeingWhispered = allSockets.find(
        (s) => s.handshake.query.username === usernameBeingWhispered
      );

      if (!socketBeingWhispered) {
        msgObj.username = null;
        msgObj.type = "error";
        msgObj.message = `O usuário ${usernameBeingWhispered} não está online :(`;
        socket.emit("chat message", msgObj);
        return;
      }

      msgObj.destinatary = usernameBeingWhispered;
      msgObj.message = msgString;
      msgObj.type = "private";

      socket.emit("chat message", msgObj);
      socketBeingWhispered.emit("chat message", msgObj);
      return;
    }

    namespace.emit("chat message", msgObj);
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
