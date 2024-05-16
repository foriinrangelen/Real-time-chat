// WebSocket 객체를 생성하여 "ws://localhost:7071/ws" 주소로 연결을 시도합니다. 이는 로컬 서버의 7071 포트에서 WebSocket 연결을 기다리고 있다고 가정합니다.
const ws = new WebSocket("ws://localhost:7071/ws");

// WebSocket으로부터 메시지를 받았을 때 실행될 콜백 함수를 정의
// ws 메소드의 onmessage로 데이터 수신가능
ws.onmessage = (webSocketMessage) => {
  // 받은 메시지 전체를 콘솔에 출력
  console.log(webSocketMessage);
  // 받은 메시지에서 데이터 부분만을 추출하여 콘솔에 출력
  console.log(webSocketMessage.data);
};

// 브라우저에서 마우스를 움직일 때마다 실행될 이벤트 핸들러를 정의
document.body.onmousemove = (event) => {
  // 마우스의 현재 위치를 객체로 생성
  // event.clientX와 event.clientY는 마우스 포인터의 화면 상의 x, y 좌표
  const messageBody = {
    x: event.clientX,
    y: event.clientY,
  };
  // 마우스 위치 정보를 담은 객체를 JSON 문자열로 변환하여 WebSocket을 통해 서버로 전송
  // ws 객체의 send()메소드로 데이터 전송가능
  ws.send(JSON.stringify(messageBody));
};
