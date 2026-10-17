import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { createSocketConnection } from "../utils/socket";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../utils/constants";

const Chat = () => {
  const { targetUserId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const user = useSelector((store) => store.user);
  const userId = user?._id;
  const socketRef = useRef(null);

  const fetchChatMessages = async () => {
    const chat = await axios.get(BASE_URL + "/chat/" + targetUserId, {
      withCredentials: true,
    });

    console.log(chat.data.messages);

    const chatMessages = chat?.data?.messages.map((msg) => {
      const { senderId, text } = msg;
      return {
        firstName: senderId?.firstName,
        lastName: senderId?.lastName,
        text,
      };
    });
    setMessages(chatMessages);
  };
  useEffect(() => {
    fetchChatMessages();
  }, []);

  useEffect(() => {
  if (!userId || !targetUserId) return;

  const socket = createSocketConnection();
  socketRef.current = socket;

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);

    socket.emit("joinChat", {
      firstName: user.firstName,
      userId,
      targetUserId,
    });
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection failed:", error.message);
  });

  socket.on("messageReceived", ({ firstName, lastName, text }) => {
    setMessages((previousMessages) => [
      ...previousMessages,
      { firstName, lastName, text },
    ]);
  });

  return () => {
    socket.disconnect();
    socketRef.current = null;
  };
}, [userId, targetUserId]);

 const sendMessage = () => {
  if (!newMessage.trim() || !socketRef.current?.connected) {
    return;
  }

  socketRef.current.emit("sendMessage", {
    firstName: user.firstName,
    lastName: user.lastName,
    userId,
    targetUserId,
    text: newMessage.trim(),
  });

  setNewMessage("");
};

  return (
    <div className="w-3/4 mx-auto border border-gray-600 m-5 h-[70vh] flex flex-col">
      <h1 className="p-5 border-b border-gray-600">Chat</h1>
      <div className="flex-1 overflow-scroll p-5">
        {messages.map((msg, index) => {
          return (
            <div
              key={index}
              className={
                "chat " +
                (user.firstName === msg.firstName ? "chat-end" : "chat-start")
              }
            >
              <div className="chat-header">
                {`${msg.firstName}  ${msg.lastName}`}
                <time className="text-xs opacity-50">
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              <div className="chat-bubble">{msg.text}</div>
              
            </div>
          );
        })}
      </div>
      <div className="p-5 border-t border-gray-600 flex items-center gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 border border-gray-500 text-white rounded p-2"
        ></input>
        <button onClick={sendMessage} className="btn btn-secondary">
          Send
        </button>
      </div>
    </div>
  );
};
export default Chat;
