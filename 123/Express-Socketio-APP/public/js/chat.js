const socket = io();

// URLSearchParams는 쿼리스트링 파싱을 도와주는 Web API 이고 매개변수로 location.search 전달하면
const query = new URLSearchParams(location.search);
// '?username=John&room=Roomy' 처럼 가져올수 있고
const username = query.get("username");
// 'John'
const room = query.get("room");
// 'Roomy'
// 처럼가져올 수있다

// chat.html을 들어오면 chat.js 본 파일이 로드되며, socket.emit 이벤트가 실행된다
// username과 room을 객체로 전달하여 서버에서 활용할 수 있게하기
socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;
// roomData 이벤트 수신 시 실행되는 메서드
socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });

  document.querySelector("#sidebar").innerHTML = html;
});

const messages = document.querySelector("#messages");
const messageTemplate = document.querySelector("#message-template").innerHTML;
// 서버에서 message 이벤트가 발생하면 실행되는 메서드
socket.on("message", (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    // 포멧하기
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  // insertAdjacentHTML("beforeend", html): element안에 가장 마지막 child에 html넣기
  messages.insertAdjacentHTML("beforeend", html);
  scrollToBottom();
});
// 스크롤 자동으로 내려가게
function scrollToBottom() {
  messages.scrollTop = messages.scrollHeight;
}
// 메세지 보내기위해 필요한 html 가져오기
const messageForm = document.querySelector("#message-form");
const messageFormInput = messageForm.querySelector("input");
const messageFormButton = messageForm.querySelector("button");

// 메세지 전송 버튼을 눌렀을때 실행될 이벤트
messageForm.addEventListener("submit", (e) => {
  // 페이지 refresh 막기
  e.preventDefault();
  // 메세지가 도착전까지 다시 전송버튼 못누르게 막기
  messageFormButton.setAttribute("disabled", "disabled");
  // 인풋입력값 가져오기
  const message = e.target.elements.message.value;
  // 데이터 전송
  socket.emit("sendMessage", message, (error) => {
    // 버튼누를수있게변경
    messageFormButton.removeAttribute("disabled");
    // 인풋 비우기
    messageFormInput.value = "";
    // 초점맞추기
    messageFormInput.focus();

    if (error) {
      return console.log(error);
    }
  });
});
