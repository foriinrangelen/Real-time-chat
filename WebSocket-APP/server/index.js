// "ws" 모듈을 불러와서 WebSocket 변수에 할당
const WebSocket = require("ws");

// WebSocket.Server를 인스턴스화하여 WebSocket 서버를 생성하고, 매개변수로 포트번호 객체로 넣기
const wss = new WebSocket.Server({ port: 7071 });
// on 메서드: 이벤트 리스너를 등록하는 데 사용되는 메서드이며 이벤트가 발생했을때 원하는 동작을 수행할 수 있는 콜백함수를 지정할 수 있다
// "connection": 새로운 클라이언트가 서버에 연결될 때마다 실행
// 'ws' 파라미터는 연결된 클라이언트와의 연결을 나타냄
wss.on("connection", (ws) => {
  // send()메소드로 클라이언트에 데이터 전송가능
  ws.send("connected");

  // 'message': 클라이언트가 서버로 보낸데이터 수신
  // 'messageFromClient' 파라미터는 클라이언트가 보낸 메시지
  ws.on("message", (messageFromClient) => {
    // 클라이언트로부터 받은 메시지(JSON 문자열)를 객체로 변환합니다.
    const message = JSON.parse(messageFromClient);
    // 변환된 메시지 객체를 콘솔에 출력합니다.
    console.log(message);
  });
});
