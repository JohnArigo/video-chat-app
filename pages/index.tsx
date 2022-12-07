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
    <div className="w-screen h-screen ">
      <form className="" onSubmit={handleLogin}>
        <h1>Lets join a room!</h1>
        <input
          onChange={(e) => setUserName(e.target.value)}
          value={userName}
          className=""
          placeholder="Enter Username"
        />
        <input
          onChange={(e) => setRoomName(e.target.value)}
          value={roomName}
          className=""
          placeholder="Enter Room Name"
        />
        <button type="submit" className="">
          Join Room
        </button>
      </form>
    </div>
  );
}
