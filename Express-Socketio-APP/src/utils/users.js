const users = [];

const addUser = ({ id, username, room }) => {
  // 빈칸 없애기
  username = username.trim();
  room = room.trim();

  // 유효성 검사
  if (!username || !room) {
    return {
      error: "사용자 이름과 방이 필요합니다.",
    };
  }
  const existingUser = users.find((user) => {
    return user.room === room && user.username === username;
  });

  if (existingUser) {
    return {
      error: "사용자 이름이 사용 중입니다.",
    };
  }

  // 유저 저장
  const user = { id, username, room };
  users.push(user);
  return { user };
};

// 같은 방에 있는 사람들을 가져오는 함수 (방에 포함된 사람들을 보여주기 위함)
const getUsersInRoom = (room) => {
  room = room.trim();

  return users.filter((user) => user.room === room);
};
// 특정유저 정보를 가져오는 함수
const getUser = (id) => {
  return users.find((user) => user.id === id);
};

// 유저와 연결이 끊겼을 시 users 배열에서 제거하는 함수
const removeUser = (id) => {
  // 지우려고 하는 유저가 있는지 찾기
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    //만약 있다면 지우기
    // splice(index,1)[0]은 지우고 지워진걸 return 하는방식
    return users.splice(index, 1)[0];
  }
};

module.exports = {
  addUser,
  getUsersInRoom,
  getUser,
  removeUser,
};
