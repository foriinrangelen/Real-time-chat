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

const publicDirectoryPath = path.join(__dirname, "../public");
console.log(publicDirectoryPath);
// express.static 미들웨어는 기본적으로 디렉토리 내의 index.html 파일을 루트 경로(/)로 요청 받았을 때 응답으로 제공하는 기능을 가지고 있음
app.use(express.static(publicDirectoryPath));
app.use(express.json());

const port = 4000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
