import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";

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
    <div className={styles.container}>
      <form className={styles.main} onSubmit={handleLogin}>
        <h1>Lets join a room!</h1>
        <input
          onChange={(e) => setUserName(e.target.value)}
          value={userName}
          className={styles["room-name"]}
          placeholder="Enter Username"
        />
        <input
          onChange={(e) => setRoomName(e.target.value)}
          value={roomName}
          className={styles["room-name"]}
          placeholder="Enter Room Name"
        />
        <button type="submit" className={styles["join-room"]}>
          Join Room
        </button>
      </form>
    </div>
  );
}
