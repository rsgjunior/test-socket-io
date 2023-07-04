console.log("web socket script loaded");

let username = null;
while (!username?.length) {
  username = prompt("Insira seu nome de usuário no chat:");
}

const socket = io(window.location.host, {
  query: {
    username: username,
  },
});

const main = document.getElementById("main");
const messages = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
const usersOnlineUl = document.getElementById("usersOnline");
const typingUsersSpan = document.querySelector("#typingUsers");

const typingUsers = [];
let ultimaMsgEnviada = null;
let onlineUsers = [];
let intervalDigitacao = null;
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

eventEmitter.on("user stopped typing", (data) => {
  if (data === username) {
    clearInterval(intervalDigitacao);
    intervalDigitacao = null;
    digitando = false;
    socket.emit("user stopped typing", username);
    return;
  }

  removeUsernameOfTypingUsers(data);
});

// DOM event listeners
form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (!input.value) {
    return;
  }
  socket.emit("chat message", input.value);
  eventEmitter.emit("user stopped typing", username);

  ultimaMsgEnviada = input.value;

  if (input.value.startsWith("/w ")) {
    const splittedMsg = input.value.split(" ");
    input.value = "/w ";
    if (splittedMsg[1]) {
      input.value += `${splittedMsg[1]} `;
    }
    return;
  }

  input.value = "";
});

input.addEventListener("keydown", function (e) {
  if (e.key === "ArrowUp" && ultimaMsgEnviada) {
    input.value = ultimaMsgEnviada;
  }
});

input.addEventListener("keypress", function (e) {
  console.log("keypress", e);

  eventEmitter.emit("user typing", username);

  if (intervalDigitacao === null) {
    intervalDigitacao = setInterval(() => {
      console.log("checando se esta digitando");

      if (!digitando) {
        console.log("usuario não está digitando");
        eventEmitter.emit("user stopped typing", username);
        return;
      }

      console.log("usuario esta digitando");
      digitando = false;
    }, 1500);
  }
});

// Socket event listeners
socket.on("chat message", function (msgObj) {
  const date = formatDate(msgObj.timestamp);

  let msg = `[${date}] `;

  if (msgObj.type === "particular") {
    if (msgObj.destinatary === username) {
      msg += `<b>${msgObj.username}</b> sussurrou para você: `;
    } else {
      msg += `Você sussurrou para <b>${msgObj.destinatary}</b>: `;
    }
  } else if (msgObj.type === "geral" && msgObj.username) {
    msg += `<b>${msgObj.username}</b>: `;
  }

  msg += msgObj.message;

  insertMessage(msg, msgObj.type);
});

socket.on("user connected", function (obj) {
  const date = formatDate(obj.timestamp);
  const usernameString = obj.username === username ? "Você" : obj.username;

  insertMessage(`[${date}] <b>${usernameString}</b> entrou no chat!`);

  if (obj.username !== username) {
    insertUserInOnlineList(obj.username);
  }
});

socket.on("user disconnected", function (obj) {
  const date = formatDate(obj.timestamp);
  const usernameString = obj.username === username ? "Você" : obj.username;

  insertMessage(`[${date}] <b>${usernameString}</b> saiu do chat.`);

  removeUserFromOnlineList(obj.username);
});

socket.on("user typing", function (usernameFromServer) {
  eventEmitter.emit("user typing", usernameFromServer);
});

socket.on("user stopped typing", function (usernameFromServer) {
  console.log("user stopped typing", usernameFromServer);

  eventEmitter.emit("user stopped typing", usernameFromServer);
});

socket.on("all users online", function (data) {
  console.log("all users online", data);
  updateAllUsersOnlineOnDom(data || []);
});

// Helper functions
function insertMessage(msg, type = "geral") {
  const item = document.createElement("li");
  item.innerHTML = msg;

  if (type === "error") {
    item.style.backgroundColor = "#f53022";
  } else if (type === "particular") {
    item.style.backgroundColor = "#8fc1ff";
  }

  messages.appendChild(item);
  main.scrollTo(0, main.scrollHeight);
}

function updateTypingUsersOnDom() {
  const usersString = typingUsers.join(", ");

  if (!typingUsers.length) {
    typingUsersSpan.innerHTML = "";
    return;
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

  updateTypingUsersOnDom();
}

function removeUsernameOfTypingUsers(usernameToRemove) {
  const userIndex = typingUsers.findIndex((u) => u === usernameToRemove);

  if (userIndex === -1) {
    return;
  }

  typingUsers.splice(userIndex, 1);

  updateTypingUsersOnDom();
}

function formatDate(dateArg) {
  return new Date(dateArg).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

function updateAllUsersOnlineOnDom(users) {
  for (const user of users) {
    insertUserInOnlineList(user);
  }
}

function insertUserInOnlineList(usernameToInsert) {
  if (onlineUsers.includes(usernameToInsert)) {
    return;
  }

  onlineUsers.push(usernameToInsert);

  const item = document.createElement("li");
  item.id = `onlineList-${usernameToInsert}`;
  item.innerText = usernameToInsert;
  item.onclick = () => {
    input.value = `/w ${usernameToInsert} `;
    input.focus();
  };

  if (usernameToInsert === username) {
    item.innerText += " (Você)";
  }

  usersOnlineUl.appendChild(item);
}

function removeUserFromOnlineList(usernameToRemove) {
  const userIndex = onlineUsers.findIndex((u) => u === usernameToRemove);

  if (userIndex === -1) {
    return;
  }

  onlineUsers.splice(userIndex, 1);

  document.getElementById(`onlineList-${usernameToRemove}`)?.remove();
}
