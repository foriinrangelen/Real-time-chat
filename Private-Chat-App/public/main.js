// autoConnect: false: 접속시 자동으로 소켓이 연결되는걸 막기
// 로그인한후 소켓이 연결되어야 하기때문에
const socket = io("http://localhost:4000", {
  autoConnect: false,
});

// socket.onAny((event, ...args)=>{}) :모든 이벤트에 대해 공통적으로 적용되는 핸들러를 설정할 수 있다
// event: 발생한 이벤트를 나타냄
// ...args: 콜백으로 전달되는 나머지 파라미터들
socket.onAny((event, ...args) => {
  console.log(event, ...args);
});

// 클라이언츠 측 전역 변수들
const chatBody = document.querySelector(".chat-body");
const userTitle = document.querySelector("#user-title");
const loginContainer = document.querySelector(".login-container");
const userTable = document.querySelector(".users");
const userTagline = document.querySelector("#users-tagline");
const title = document.querySelector("#active-user");
const messages = document.querySelector(".messages");
const msgDiv = document.querySelector(".msg-form");

// login form handler
const loginForm = document.querySelector(".user-login");
// 방에 입장하기 입장버튼을 눌렀을때 실행될 핸들러함수
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  // 입력한이름가져오기
  const username = document.getElementById("username");
  createSession(username.value.toLowerCase());
  username.value = "";
});
// 세션만드는함수,
const createSession = async (username) => {
  // fetch 옵션설정
  const options = {
    method: "Post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  };

  try {
    const response = await fetch("/session", options);
    const data = await response.json();
    // console.log(data);
    const { username, userID } = data;
    console.log(username, userID);
    socketConnect(username, userID);

    // localStorage에 세션을 Set
    localStorage.setItem("session-username", username);
    localStorage.setItem("session-userID", userID);
    console.log(userID);
    console.log(username);
    // html 조작
    loginContainer.classList.add("d-none");
    chatBody.classList.remove("d-none");
    userTitle.innerHTML = username;
  } catch (err) {
    console.error(err);
  }
};
// 소켓연결하는 함수
const socketConnect = async (username, userID) => {
  // socket.auth : 소켓인증정보 설정
  // auth는 인증 정보를 저장하는 객체로, 이 객체에 username과 userID를 포함시켜 서버 측에서 해당 사용자를 식별할 수 있게 한다
  socket.auth = { username, userID };
  // 소켓연결이 완료될때까지 기다리기
  await socket.connect();
};

// 접속자를 클릭했을 시 실행되는함수, 동적으로 생성한 html에 onclick에 이벤트가 등록되어있음
const setActiveUser = (element, username, userID) => {
  title.innerHTML = username;
  title.setAttribute("userID", userID);

  const lists = document.getElementsByClassName("socket-users");
  for (let i = 0; i < lists.length; i++) {
    lists[i].classList.remove("table-active");
  }

  element.classList.add("table-active");

  // 사용자 선택 후 메시지 영역 표시
  msgDiv.classList.remove("d-none");
  messages.classList.remove("d-none");
  messages.innerHTML = "";
  socket.emit("fetch-messages", { receiver: userID });
  const notify = document.getElementById(userID);
  notify.classList.add("d-none");
};

// 메시지 화면에 뿌려주는 함수
const appendMessage = ({ message, time, background, position }) => {
  let div = document.createElement("div");
  div.classList.add("message", "bg-opacity-25", "m-2", "px-2", "py-1", background, position);
  div.innerHTML = `<span class="msg-text">${message}</span> <span class="msg-time"> ${time}</span>`;
  messages.append(div);
  messages.scrollTo(0, messages.scrollHeight);
};

// 서버에서 보내는 users-data 이벤트 데이터 받기
socket.on("users-data", ({ users }) => {
  // 자신은 제거하기 (접속한 사람 보여주기위해)
  const index = users.findIndex((user) => user.userID === socket.id);
  if (index > -1) {
    users.splice(index, 1);
  }

  // user table list 생성하기
  userTable.innerHTML = "";
  let ul = `<table class="table table-hover">`;
  for (const user of users) {
    ul += `<tr class="socket-users" onclick="setActiveUser(this, '${user.username}', '${user.userID}')"><td>${user.username}<span class="text-danger ps-1 d-none" id="${user.userID}">!</span></td></tr>`;
  }
  ul += `</table>`;
  if (users.length > 0) {
    userTable.innerHTML = ul;
    userTagline.innerHTML = "접속 중인 유저";
    userTagline.classList.remove("text-danger");
    userTagline.classList.add("text-success");
  } else {
    userTagline.innerHTML = "접속 중인 유저 없음";
    userTagline.classList.remove("text-success");
    userTagline.classList.add("text-danger");
  }
});

// 유저가 나갔을때 나간 유저와 대화창 지우기
socket.on("user-away", (userID) => {
  const to = title.getAttribute("userID");
  if (to === userID) {
    title.innerHTML = "&nbsp;";
    msgDiv.classList.add("d-none");
    messages.classList.add("d-none");
  }
});

// 페이지가 refresh 되어도 localStorage에 저장되어있는 데이터를 가져와서 있다면 바로 연결시키기
const sessUsername = localStorage.getItem("session-username");
const sessUserID = localStorage.getItem("session-userID");

if (sessUsername && sessUserID) {
  socketConnect(sessUsername, sessUserID);

  loginContainer.classList.add("d-none");
  chatBody.classList.remove("d-none");
  userTitle.innerHTML = sessUsername;
}

// 메세지 전송버튼을 클릭했을 때 실행될 함수
const msgForm = document.querySelector(".msgForm");
const message = document.getElementById("message");

msgForm.addEventListener("submit", (e) => {
  e.preventDefault();
  // 누구에게 보낼지 아이디 가져오기
  const to = title.getAttribute("userID");
  // 시간도 같이 보내기
  const time = new Date().toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  // 메시지 payload 만들기
  const payload = {
    from: socket.id,
    to,
    message: message.value,
    time,
  };
  // 만들어진 payload를 서버로 보내기
  socket.emit("message-to-server", payload);
  // 보낸 데이터를 화면에 뿌려주기
  appendMessage({ ...payload, background: "bg-success", position: "right" });

  message.value = "";
  message.focus();
});

// 서버에서 보내는 데이터 받기
socket.on("message-to-client", ({ from, message, time }) => {
  const receiver = title.getAttribute("userID");
  const notify = document.getElementById(from);

  if (receiver === null) {
    notify.classList.remove("d-none");
  } else if (receiver === from) {
    appendMessage({
      message,
      time,
      background: "bg-secondary",
      position: "left",
    });
  } else {
    notify.classList.remove("d-none");
  }
});
// 메세지 뿌려주기
socket.on("stored-messages", ({ messages }) => {
  if (messages.length > 0) {
    messages.forEach((msg) => {
      const payload = {
        message: msg.message,
        time: msg.time,
      };
      if (msg.from === socket.id) {
        appendMessage({
          ...payload,
          background: "bg-success",
          position: "right",
        });
      } else {
        appendMessage({
          ...payload,
          background: "bg-secondary",
          position: "left",
        });
      }
    });
  }
});
