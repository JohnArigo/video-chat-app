import "../styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useState } from "react";

function SafeHydrate({ children }: any) {
  return (
    <div suppressHydrationWarning>
      {typeof window === undefined ? null : children}
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const [userName, setUserName] = useState("");
  const [roomName, setRoomName] = useState("");
  const router = useRouter();

  const handleLogin = (event: Event) => {
    event.preventDefault();
    router.push(`/room/${roomName}`);
  };
  return (
    <Component
      handleCredChange={(userName: string, roomName: string) => {
        setUserName(userName);
        setRoomName(roomName);
      }}
      userName={userName}
      roomName={roomName}
      handleLogin={handleLogin}
      {...pageProps}
    />
  );
}
