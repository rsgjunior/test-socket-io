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

  socket.on("chat message", async (msg) => {
    logger.log(
      `user ${socket.handshake.query.username} sent message: '${msg}'`
    );

    const msgObj = {
      message: msg,
      username: socket.handshake.query.username,
      timestamp: Date.now(),
      type: "geral",
    };

    // whisper
    if (msg.startsWith("/w ")) {
      logger.log("NOTICE starts with /w");

      const splitedMsg = msg.split(" ");

      if (splitedMsg.length < 3) {
        msgObj.username = null;
        msgObj.type = "error";
        msgObj.message = "Comando inválido. Utilize: '/w Username Mensagem'";
        socket.emit("chat message", msgObj);
        return;
      }

      const usernameBeingWhispered = splitedMsg[1];
      msgObj.destinatary = usernameBeingWhispered;

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
        msgObj.message = `O usuário ${splitedMsg[1]} não está online :(`;
        socket.emit("chat message", msgObj);
        return;
      }

      splitedMsg.shift();
      splitedMsg.shift();

      msgObj.message = splitedMsg.join(" ");
      msgObj.type = "particular";

      socket.emit("chat message", msgObj);
      socketBeingWhispered.emit("chat message", msgObj);
      return;
    }

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
