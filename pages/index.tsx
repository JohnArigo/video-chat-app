import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Props {
  handleCredChange: (userName: string, roomName: string) => void;
  handleLogin: () => void;
}

export default function Home({ handleCredChange, handleLogin }: Props) {
  const [roomName, setRoomName] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    handleCredChange(userName, roomName);
  }, [roomName, userName, handleCredChange]);

  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center">
      {" "}
      <h1 className="text-center mb-20 text-4xl">Video Chat App</h1>
      <form className="w-96 h-96 flex flex-col" onSubmit={handleLogin}>
        <input
          onChange={(e) => setUserName(e.target.value)}
          value={userName}
          className="mb-3 h-10"
          placeholder="Enter Username"
          required
        />
        <input
          onChange={(e) => setRoomName(e.target.value)}
          value={roomName}
          className="mb-3 h-10"
          placeholder="Enter Room Name"
          required
        />
        <button
          type="submit"
          className="bg-white bg-opacity-50 h-8 rounded-full hover:bg-green-600 active:bg-green-600 focus:outline-none focus:ring focus:ring-green-200"
        >
          Join Room
        </button>
      </form>
    </div>
  );
}
