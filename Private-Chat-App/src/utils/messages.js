const messageModel = require("../models/messages.model");

const getToken = (sender, receiver) => {
  const key = [sender, receiver].sort().join("_");
  return key;
};

const saveMessages = async ({ from, to, message, time }) => {
  const token = getToken(from, to);
  const data = {
    from,
    message,
    time,
  };
  // prettier-ignore
  //   messageModel.updateOne({ userToken: token },{
  //     $push: { messages: data, },
  //     }, (err,res) => {
  //         if(err) console.error(err);
  //         console.log('메세지가 생성되었습니다!')
  //     }
  //   );

  try {
      await messageModel.updateOne({ userToken: token }, {
        $push: { messages: data },
      });
      console.log(data)
      console.log('메세지 집어넣기');
    } catch (err) {
      console.error(err);
    }
};

const fetchMessages = async (io, sender, receiver) => {
  const token = getToken(sender, receiver);
  try {
    // 같은 토큰이 있는지 찾기
    const foundToken = await messageModel.findOne({ userToken: token });
    // 이미 있다면 A와 B가 대화를 나눈것이기때문애
    if (foundToken) {
      io.to(sender).emit("stored-messages", { messages: foundToken.messages });
      // 한번도 대화를 나눈적이 없다면(토큰이 없다면)
      // 새로만들기
    } else {
      const data = {
        userToken: token,
        messages: [],
      };
      const message = new messageModel(data);
      const savedMessage = await message.save();
      if (savedMessage) {
        console.log(savedMessage);
        console.log("메세지함이 생성되었습니다!");
      } else {
        console.log("메세지가 생성중 에러발생!");
      }
    }
  } catch (err) {
    console.error(err);
  }
};

module.exports = { saveMessages, fetchMessages };
