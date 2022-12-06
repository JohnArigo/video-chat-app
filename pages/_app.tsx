import "../styles/globals.css";
import type { AppProps } from "next/app";

function SafeHydrate({ children }: any) {
  return (
    <div suppressHydrationWarning>
      {typeof window === undefined ? null : children}
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SafeHydrate>
      <Component {...pageProps} />
    </SafeHydrate>
  );
}
