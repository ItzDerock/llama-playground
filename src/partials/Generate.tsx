import { Flex, Button } from "@mantine/core";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  promptState,
  generatingState,
  wsState,
  wsUUIDState,
  ClientWSState,
  generatedText,
  maxPredictionTokensState,
  topKState,
  topPState,
  repeatPenaltyState,
  tempState,
  repeatLastNState,
} from "~/recoil/states";
import { WSMessageType } from "~/server/api/types";
import { api } from "~/utils/api";

export default function Generate() {
  const [prompt] = useRecoilState(promptState);
  const [loading, setLoading] = useRecoilState(generatingState);
  const [state, setWSState] = useRecoilState(wsState);
  const [uuid, setUUID] = useRecoilState(wsUUIDState);
  const [_generated, setGenerated] = useRecoilState(generatedText);
  const nPredict = useRecoilValue(maxPredictionTokensState);
  const topK = useRecoilValue(topKState);
  const topP = useRecoilValue(topPState);
  const repeatPenalty = useRecoilValue(repeatPenaltyState);
  const temp = useRecoilValue(tempState);
  const repeatLastN = useRecoilValue(repeatLastNState);

  // subscribe to generation updates
  api.llama.subscription.useSubscription(undefined, {
    onData: (data) => {
      // wait for identity
      if (data.type === WSMessageType.IDENTITY) {
        setUUID(data.data);
        setWSState(ClientWSState.READY);
        return;
      }

      // loading false when generation done
      if (data.type === WSMessageType.REQUEST_COMPLETE) {
        setLoading(false);
        return;
      }

      // update generated text
      if (data.type === WSMessageType.COMPLETION) {
        setGenerated(data.data);
        return;
      }
    },

    onError: (error) => {
      setWSState(ClientWSState.CONNECTING);
    },
  });

  // mutations
  const generate = api.llama.startGeneration.useMutation();
  const cancel = api.llama.cancelGeneration.useMutation();

  return (
    <Flex direction="row" gap="sm">
      <Button
        variant="filled"
        color="green"
        onClick={() => {
          generate.mutateAsync({
            prompt,
            options: {
              "--n_predict": nPredict,
              "--top_k": topK,
              "--top_p": topP,
              "--repeat_penalty": repeatPenalty,
              "--temp": temp,
              "--repeat_last_n": repeatLastN,
            },
            uuid,
          });
          setLoading(true);
        }}
        loading={loading || state === ClientWSState.CONNECTING}
      >
        Generate
      </Button>

      {/* cancel */}
      {loading && (
        <Button
          variant="filled"
          color="red"
          onClick={() => {
            cancel.mutateAsync({ uuid });
          }}
        >
          Cancel
        </Button>
      )}
    </Flex>
  );
}
