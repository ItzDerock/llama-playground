import { Flex, LoadingOverlay } from "@mantine/core";
import { type NextPage } from "next";
import Head from "next/head";
import { useRecoilValue } from "recoil";
import Generate from "~/partials/Generate";
import Header from "~/partials/Header";
import ModelControls from "~/partials/ModelControls";
import PromptEditor from "~/partials/PromptEditor";
import { ClientWSState, wsState } from "~/recoil/states";

const Home: NextPage = () => {
  const state = useRecoilValue(wsState);

  return (
    <>
      <main>
        <LoadingOverlay
          visible={state != ClientWSState.READY}
          overlayBlur={2}
        />
        <Header />
        <Flex
          p="xs"
          direction={{ base: "column", sm: "row" }}
          gap={{ base: "sm", sm: "lg" }}
          justify={{ sm: "center" }}
          w="100%"
          mih="calc(100vh - 60px)"
        >
          <Flex direction="column" gap="sm" sx={{ flexGrow: 1 }}>
            <PromptEditor />
            <Generate />
          </Flex>
          <ModelControls />
        </Flex>
      </main>
    </>
  );
};

export default Home;
