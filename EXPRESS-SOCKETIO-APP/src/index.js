const express = require("express");
const path = require("path");
const app = express();

// 1. http 모듈불러오기, HTTP 모듈은 웹 서버를 생성하고 관리하는 데 필요한 메소드와 속성을 제공
const http = require("http");
// 2. http.createServer() 메소드는 HTTP 서버를 생성하는 데 사용되고 매개변수로 express객체를 전달, 이렇게 생성된 HTTP 서버는 Express 애플리케이션의 라우팅 및 미들웨어 기능을 활용할 수 있게 된다
const server = http.createServer(app);
// 3. 구조 분해 할당을 통해 socket.io 모듈에서 Server 클래스를 직접 추출 이렇게 함으로써, 별도의 객체 생성 없이 바로 Server 클래스를 사용
const { Server } = require("socket.io");
const { addUser, getUsersInRoom, getUser, removeUser } = require("./utils/users");
const { generateMessage } = require("./utils/messages");
// 4. Socket.IO 라이브러리를 사용하여, 이미 생성된 HTTP 서버(server)를 기반으로 새로운 Socket.IO 서버 인스턴스(io)를 생성
// = 하나의 서버에서 Express와 Socket.IO가 같이 일하고 있다
// 추가
// const { Server } = require("socket.io"); 이렇게 웹소켓 서버를 가져오고 const io = new Server(); 웹소켓만의 서버를 열수있지만(io.listen(3000);)
// 이렇게 하게되면 express서버와 웹소켓서버 두개가 돌아가는게 되버리기 때문에 하나의 서버로 연동하여 사용하기 위해 const io = new Server(server); 처럼
// express http 서버를 웹소켓 인스턴스객체에 넣어주면 HTTP 서버와 WebSocket 서버가 동일한 포트를 공유하게 되어 더 효율적인 서버 관리가 가능하다
const io = new Server(server);

io.on("connection", (socket) => {
  // 매개변수로 받는 socket은 각각 접속한 클라이언트의 정보가 담겨있는 객체
  // ex) client A 가 접속했다면 socket은 client A의 정보 client B가 접속했다면 client B의 정보가 담긴다
  // 클라이언트가 서버에 접속했을 시 발생하는 이벤트
  console.log("socket 유저접속 : " + socket.id);
  socket.on("join", (options, callback) => {
    // users.js에 정의된 함수에 id와 클라이언트에게 입력받은 options(username, room)를 스프레드로 전부 전달
    // 기본적으론 user를 반환하지만 error를 리턴할 수도 있으니 둘다 받아주기
    const { error, user } = addUser({ id: socket.id, ...options });
    // 에러가 있다면 callback에 에러전달, 이 callback은 클라이언트 emit메서드의 콜백으로 간다
    if (error) return callback(error);
    // 에러가 없고 정상적으로 생성이 되었다면 socket.join()메서드로 방에 입장가능
    // socket.join(방이름): 그 방에 socket이 들어가게된다
    socket.join(user.room);
    // 입장한사람에게 보이는 메세지
    // generateMessage함수는 message.js에 정의 되어있고 이름,텍스트,시간을 담은 객체를 리턴
    socket.emit("message", generateMessage("ADMIN", `${user.room}방에 오신 걸 환영합니다.`));
    // 자신을 제외한 방에있는 모든사람에게 보여지는 메세지
    socket.broadcast.to(user.room).emit("message", generateMessage("ADMIN", `${user.username}가 방에 참여했습니다.`));

    // io.to는 자신을 포함한 방에있는 모든사람에 보여지는 메세지
    // 방 이름과 방안에 포함되어있는 유저들을 필터링해서 전송
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    // 로 인해 서버에서는 클라이언트가 입장 시 세가지의 메세지를 클라이언트에 전달하게 된다
  });
  // 클라이언트가 메세지를 보냈을 때 발생하는 이벤트
  socket.on("sendMessage", (message, callback) => {
    // getUser(): user.js에 정의 되어있고 메세지를 보낸 특정유저의 데이터를 가져오기 위한함수
    const user = getUser(socket.id);
    // 모든 접속한 클라이언트들에게 메세지 보내기(특정 클라이언트 이름과 보낸 message)
    io.to(user.room).emit("message", generateMessage(user.username, message));
    // callback()을 호출해줘야 클라이언트에서 작성한 emit메서드의 callback함수가 실행된다
    callback();
  });
  // 클라이언트와 접속이 끊겼을때 발생하는 이벤트
  socket.on("disconnect", () => {
    console.log(`socket 연결끊김 : ${socket.id}`);
    // removeUser(): user.js에 정의 되어있고 특정 유저를 삭제하기 위한 함수
    const user = removeUser(socket.id);
    // 유저가 존재한다면 정상적으로 삭제 된거니
    if (user) {
      // 방에 전체에 메세지 전달하기
      io.to(user.room).emit("message", generateMessage("ADMIN", `${user.username}가 방을 나갔습니다.`));
      // 나간유저를 제외하고 새롭게 현재 방에 접속한 유저 보여주기
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});
const publicDirectoryPath = path.join(__dirname, "../public");
console.log(publicDirectoryPath);
// express.static 미들웨어는 기본적으로 디렉토리 내의 index.html 파일을 루트 경로(/)로 요청 받았을 때 응답으로 제공하는 기능을 가지고 있음
app.use(express.static(publicDirectoryPath));
const port = 4000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
