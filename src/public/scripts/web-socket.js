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
const typingUsersSpan = document.querySelector("#typingUsers");

const typingUsers = [];
let intervalDigitacao;
let digitando = false;
const eventEmitter = new EventEmitter();

// custom event emitter
eventEmitter.on("user typing", (data) => {
  console.log("event user typing", data);

  if (data === username) {
    if (digitando) {
      return;
    }

    digitando = true;
    socket.emit("user typing", data);
    return;
  }

  insertUsernameInTypingUsers(data);
});

// DOM event listeners
form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (input.value) {
    socket.emit("chat message", input.value);
    input.value = "";
  }
});

input.addEventListener("focus", function () {
  console.log("input focus");

  intervalDigitacao = setInterval(() => {
    console.log("checando se esta digitando");

    if (!digitando) {
      console.log("usuario não está digitando");
      return;
    }

    console.log("usuario esta digitando");
    digitando = false;
  }, 1500);
});

input.addEventListener("blur", function () {
  console.log("input blur");

  clearInterval(intervalDigitacao);
});

input.addEventListener("keypress", function (e) {
  console.log("keypress", e);

  eventEmitter.emit("user typing", username);
});

// Socket event listeners
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

socket.on("user typing", function (usernameFromServer) {
  eventEmitter.emit("user typing", usernameFromServer);
});

// Helper functions
function insertMessage(msg, prefix = "") {
  const item = document.createElement("li");
  item.innerHTML = `${prefix}${msg}`;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
}

function updateTypingUsersOnDom() {
  const usersString = typingUsers.join(", ");

  if (!typingUsers.length) {
    typingUsersSpan.innerHTML = "";
  }

  typingUsersSpan.innerHTML =
    typingUsers.length > 1
      ? `<b>${usersString}</b> estão digitando...`
      : `<b>${usersString}</b> está digitando...`;
}

function insertUsernameInTypingUsers(usernameToInsert) {
  if (typingUsers.includes(usernameToInsert)) {
    return;
  }

  if (usernameToInsert === username) {
    return;
  }

  typingUsers.push(usernameToInsert);
}

function removeUsernameOfTypingUsers(usernameToRemove) {}
