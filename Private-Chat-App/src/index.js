const express = require("express");
const path = require("path");
const app = express();
const { default: mongoose } = require("mongoose");
// 1. http 모듈불러오기, HTTP 모듈은 웹 서버를 생성하고 관리하는 데 필요한 메소드와 속성을 제공
const http = require("http");
// 2. http.createServer() 메소드는 HTTP 서버를 생성하는 데 사용되고 매개변수로 express객체를 전달, 이렇게 생성된 HTTP 서버는 Express 애플리케이션의 라우팅 및 미들웨어 기능을 활용할 수 있게 된다
const server = http.createServer(app);
// 3. 구조 분해 할당을 통해 socket.io 모듈에서 Server 클래스를 직접 추출 이렇게 함으로써, 별도의 객체 생성 없이 바로 Server 클래스를 사용
const { Server } = require("socket.io");
const Crypto = require("crypto");
const { saveMessages, fetchMessages } = require("./utils/messages");
// 4. Socket.IO 라이브러리를 사용하여, 이미 생성된 HTTP 서버(server)를 기반으로 새로운 Socket.IO 서버 인스턴스(io)를 생성
// = 하나의 서버에서 Express와 Socket.IO가 같이 일하고 있다
// 추가
// const { Server } = require("socket.io"); 이렇게 웹소켓 서버를 가져오고 const io = new Server(); 웹소켓만의 서버를 열수있지만(io.listen(3000);)
// 이렇게 하게되면 express서버와 웹소켓서버 두개가 돌아가는게 되버리기 때문에 하나의 서버로 연동하여 사용하기 위해 const io = new Server(server); 처럼
// express http 서버를 웹소켓 인스턴스객체에 넣어주면 HTTP 서버와 WebSocket 서버가 동일한 포트를 공유하게 되어 더 효율적인 서버 관리가 가능하다
const io = new Server(server);

require("dotenv").config();
const publicDirectoryPath = path.join(__dirname, "../public");
// console.log(publicDirectoryPath);
// express.static 미들웨어는 기본적으로 디렉토리 내의 index.html 파일을 루트 경로(/)로 요청 받았을 때 응답으로 제공하는 기능을 가지고 있음
app.use(express.static(publicDirectoryPath));
app.use(express.json());
// mongoose.connect("mongodb+srv://kyyyy8629:1234@express-cluster.fzshmg3.mongodb.net/?retryWrites=true&w=majority&appName=express-Cluster");
// console.log(mongoose.connect("mongodb+srv://kyyyy8629:1234@express-cluster.fzshmg3.mongodb.net/?retryWrites=true&w=majority&appName=express-Cluster"));
// console.log(process.env.ABC);
(async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log("정상적DB연결");
    // console.log("정상적DB연결: ", connection.connection.host);
  } catch (e) {
    console.log("DB연결실패" + e);
  }
})();
// 랜덤아이디생성해서 세션 만들때 같이 넣어주기
const randomId = () => Crypto.randomBytes(8).toString("hex");
// 클라이언트측 createSession함수에서 보내는 fetch요청 처리 엔드포인트API
app.post("/session", (req, res) => {
  console.log("/session 들어옴");
  const data = {
    username: req.body.username,
    userID: randomId(),
  };
  // 데이터 만들어서 보내기
  res.send(data);
});
// 설명추가 use 등 미들웨어 이해가 딸림
io.use((socket, next) => {
  const username = socket.handshake.auth.username;
  const userID = socket.handshake.auth.userID;
  if (!username) return next(new Error("사용자 이름이 없습니다."));
  socket.username = username;
  socket.id = userID;
  next();
});

let users = [];
io.on("connection", async (socket) => {
  let userData = {
    username: socket.username,
    userID: socket.id,
  };
  users.push(userData);
  io.emit("users-data", { users });

  // 클라이언트에서 보내온 메세지 A가서 먼저 서버로 전송,서버에서 DB에 저장후 B에게 메세지 다시전달
  // payload에는 클라이언트에서 보낸 데이터 객체가 들어있음
  socket.on("message-to-server", async (payload) => {
    // .to() 메소드는 메시지를 보낼 대상을 지정,
    // 서버 측에서는 io.to().emit() 구문을 사용하여 특정 클라이언트나 클라이언트 그룹에 이벤트를 발생시키고,
    // 클라이언트 측에서는 해당 이벤트를 수신하여 적절한 처리를 수행할 수 있음
    // payload.to의 id를 가진 클라이언트에게만 데이터가 전송된다
    io.to(payload.to).emit("message-to-client", payload);
    // 데이터베이스에 저장할 함수
    saveMessages(payload);
  });
  // 데이터 베이스에서 메세지 가져오기
  // 클라이언트에서 자신의 id를 보내준다
  socket.on("fetch-messages", async ({ receiver }) => {
    // io: 전체 유저 통신가능한 소켓
    // socket.id: 보내는사람
    // receiver: 받는사람
    // console.log("못들어오나?");
    fetchMessages(io, socket.id, receiver);
  });
  // 유저가 방에서 나갔을때
  socket.on("disconnect", async (data) => {
    // 방을 나갔을때 내아이디 찾아서 유저목록에서 없애기
    users = users.filter((user) => user.userID !== socket.id);
    // 사이드바 리스트에서 없애기(업데이트된 users목록 클라이언트 전체에게 전송)
    io.emit("users-data", { users });
    // 대화중이라면 대화창없애기
    io.emit("user-away", socket.id);
  });
});

const port = 4000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
