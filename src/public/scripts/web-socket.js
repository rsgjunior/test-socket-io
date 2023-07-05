console.log("web socket script loaded");

let tmpUsername = null;
while (!tmpUsername?.length) {
  tmpUsername = prompt("Insira seu nome de usuário no chat:")?.replace(
    /[^a-zA-Z0-9]/g,
    ""
  );
}

const chatState = new ChatState({
  clientUsername: tmpUsername,
});

const socket = io(window.location.host, {
  query: {
    username: chatState.clientUsername,
  },
});

const notificationAudio = new Audio(
  `${window.location.href}audio/msgNotification.mp3`
);

const chatDOM = new ChatDOM({
  clientUsername: chatState.clientUsername,
});

chatDOM.queryHtmlElements();

// chatState event emitter
chatState.on("user typing", (username) => {
  if (username !== chatState.clientUsername) {
    chatState.usersTyping.add(username);
    chatDOM.updateUsersTyping(chatState.getUsersTypingAsArray());
    return;
  }

  if (chatState.clientIsTyping) {
    return;
  }

  chatState.setClientTypingState(1500, () => {
    chatState.emit("user stopped typing", chatState.clientUsername);
  });

  socket.emit("user typing", chatState.clientUsername);
});

chatState.on("user stopped typing", (username) => {
  if (username === chatState.clientUsername) {
    chatState.clearClientTypingState();
    socket.emit("user stopped typing", chatState.clientUsername);
  } else {
    chatState.usersTyping.delete(username);
  }

  chatDOM.updateUsersTyping(chatState.getUsersTypingAsArray());
});

// DOM event listeners
chatDOM.htmlElementForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const currentMessage = chatDOM.htmlElementInput.value?.trim();

  if (!currentMessage) {
    return;
  }

  socket.emit("chat message", currentMessage);
  chatState.emit("user stopped typing", chatState.clientUsername);

  chatState.lastMessageSentByClient = currentMessage;

  // regex for "/w stringDeExemplo Uma frase de exemplo"
  const regexMatch = currentMessage.match(/^(\/w\s\w+\s).+/);

  if (regexMatch) {
    chatDOM.htmlElementInput.value = regexMatch[1];
    return;
  }

  chatDOM.htmlElementInput.value = "";
});

chatDOM.htmlElementInput.addEventListener("keydown", function (e) {
  if (e.key === "ArrowUp" && chatState.lastMessageSentByClient) {
    chatDOM.htmlElementInput.value = chatState.lastMessageSentByClient;
  }
});

chatDOM.htmlElementInput.addEventListener("keypress", function (e) {
  chatState.emit("user typing", chatState.clientUsername);
});

// Socket event listeners
socket.on("chat message", function (msgObj) {
  chatDOM.insertMessage(msgObj);

  if (msgObj.username && msgObj.username !== chatState.clientUsername) {
    notificationAudio.play();
  }
});

socket.on("user connected", function (obj) {
  chatState.usersOnline.add(obj.username);

  const isTheOwnClient = obj.username === chatState.clientUsername;

  if (!isTheOwnClient) {
    chatDOM.insertUserInOnlineList(obj.username);
  }

  obj.type = "serverEvent";
  obj.message = `${isTheOwnClient ? "Você" : obj.username} entrou no chat!`;

  chatDOM.insertMessage(obj);
});

socket.on("user disconnected", function (obj) {
  chatState.usersOnline.delete(obj.username);

  const isTheOwnClient = obj.username === chatState.clientUsername;
  obj.type = "serverEvent";
  obj.message = `${isTheOwnClient ? "Você" : obj.username} saiu do chat :(`;

  chatDOM.removeUserFromOnlineList(obj.username).insertMessage(obj);
});

socket.on("user typing", function (usernameFromServer) {
  chatState.emit("user typing", usernameFromServer);
});

socket.on("user stopped typing", function (usernameFromServer) {
  chatState.emit("user stopped typing", usernameFromServer);
});

socket.on("all users online", function (data) {
  console.log("all users online", data);
  chatDOM.updateUsersOnlineList(
    chatState.setUsersOnlineFromArray(data).getUsersOnlineAsArray()
  );
});
