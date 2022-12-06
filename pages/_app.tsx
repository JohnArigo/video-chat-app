import "../styles/globals.css";
import type { AppProps } from "next/app";

import { useState } from "react";
import Menu from "../components/menu";
function SafeHydrate({ children }: any) {
  return (
    <div suppressHydrationWarning>
      {typeof window === "undefined" ? null : children}
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const [currentPage, setCurrentPage] = useState("home");
  const [joinCode, setJoinCode] = useState("");
  return (
    <SafeHydrate>
      {" "}
      <Menu
        joinCode={joinCode}
        setJoinCode={setJoinCode}
        setPage={setCurrentPage}
      />
      <Component {...pageProps} />
    </SafeHydrate>
  );
}
