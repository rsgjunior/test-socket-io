const form = document.querySelector("form");
const inputRoomName = document.querySelector("#roomName");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!inputRoomName.value?.length) {
    return;
  }

  window.location.href = encodeURI(
    `${window.location.origin}/chat/${inputRoomName.value}`
  );
});
