const http = require("http").createServer();
// socket.io 모듈을 사용하여 HTTP 서버와 WebSocket 서버를 통합합니다. cors 옵션을 설정하여 모든 출처에서의 접근을 허용
// prettier-ignore
const io = require("socket.io")(http,{cors: { origin: "*" },});
// on은 수신용 ,emit은 송신용
// connection 이벤트를 통해 클라이언트가 WebSocket 서버에 연결될 때마다 실행
// 클라이언트와 같은 이벤트이름을 가지고 있어야 한다
// io.on(): 특정 이벤트를 수신하기 위해 사용, 발생시 콜백실행
io.on("connection", (socket) => {
  console.log("유저 연결");
  //  io.on("connection", (socket) => {...}) 내부에 정의된 로직은 클라이언트가 서버에 연결된 후 계속해서 대기 상태가 된다
  // 클라이언트가 서버에 연결되면, 그 연결된 클라이언트를 대상으로 하는 소켓 인스턴스가 생성되고, 이 소켓을 통해 서버와 클라이언트 간의 통신이 이루어진다
  // 클라이언트로 message라는 이름으로 데이터가 온다면(이벤트가 발생한다면) 같은이벤트명의 on으로 받기
  socket.on("message", (message) => {
    console.log("message: " + message);
    // io.emit(): 모든 클라이언트에게 이벤트를 발생시킵니다.
    // socket.emit(): 이벤트를 발생시킨 특정 클라이언트에게만 이벤트를 발생시킵니다.
    // 데이터를 보낼때도 클라이언트에서 on하고있는 이벤트이름과 서버에서 emit하는 이벤트명이 같아야한다
    io.emit("message", `${socket.id.substr(0, 5)} said ${message}`);
  });
});

const port = 8080;
http.listen(port, () => {
  console.log(port + "서버 실행");
});
