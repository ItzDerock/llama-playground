import { type AppType } from "next/app";
import {
  ColorScheme,
  ColorSchemeProvider,
  MantineProvider,
} from "@mantine/core";
import { api } from "~/utils/api";
import { RecoilRoot } from "recoil";

import "~/styles/globals.css";
import { useColorScheme, useLocalStorage } from "@mantine/hooks";
import Head from "next/head";

const App: AppType = ({ Component, pageProps }) => {
  // load color scheme from local storage
  const preferredColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: "colorScheme",
    defaultValue: preferredColorScheme,
  });

  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value ?? (colorScheme === "light" ? "dark" : "light"));

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#2f9e44" />

        <title>LLaMA Playground</title>

        <meta property="og:title" content="LLaMA Playground" />
        <meta
          name="description"
          content="A simple way to experiment with Meta's LLaMA language model. Enter a prompt and generate a response."
        />
        <meta property="og:type" content="website" />

        <link rel="icon" href="/public/favicon.ico" />

        {/* thumbnail (large) */}
        <meta property="og:image" content="/public/demo.gif" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <ColorSchemeProvider
        colorScheme={colorScheme}
        toggleColorScheme={toggleColorScheme}
      >
        <MantineProvider
          withGlobalStyles
          withNormalizeCSS
          theme={{ colorScheme }}
        >
          <RecoilRoot>
            <Component {...pageProps} />
          </RecoilRoot>
        </MantineProvider>
      </ColorSchemeProvider>
    </>
  );
};

export default api.withTRPC(App);
