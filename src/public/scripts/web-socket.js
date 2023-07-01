console.log("web socket script loaded");

const username = prompt("Insira seu nome de usuário");

const socket = io(window.location.host, {
  query: {
    username: username,
  },
});

const messages = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");

form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (input.value) {
    socket.emit("chat message", input.value);
    input.value = "";
  }
});

socket.on("chat message", function (msgObj) {
  const date = new Date(msgObj.timestamp).toLocaleString();

  insertMessage(`[${date}] <b>${msgObj.username}</b>: ${msgObj.message}`);
});

socket.on("user connected", function (obj) {
  const date = new Date(obj.timestamp).toLocaleString();
  const usernameString = obj.username === username ? "Você" : obj.username;

  insertMessage(`[${date}] <b>${usernameString}</b> entrou no chat!`);
});

socket.on("user disconnected", function (obj) {
  const date = new Date(obj.timestamp).toLocaleString();
  const usernameString = obj.username === username ? "Você" : obj.username;

  insertMessage(`[${date}] <b>${usernameString}</b> saiu do chat.`);
});

function insertMessage(msg, prefix = "") {
  const item = document.createElement("li");
  item.innerHTML = `${prefix}${msg}`;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
}
