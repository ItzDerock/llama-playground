import {
  Flex,
  Slider,
  TextInput,
  Tooltip,
  Text,
  Container,
  NumberInput,
  Group,
  Select,
} from "@mantine/core";
import { useRecoilState } from "recoil";
import {
  maxPredictionTokensState,
  repeatLastNState,
  repeatPenaltyState,
  tempState,
  topKState,
  topPState,
} from "~/recoil/states";
import { api } from "~/utils/api";

export default function ModelControls() {
  const [temp, setTemp] = useRecoilState(tempState);
  const [maxTokens, setMaxTokens] = useRecoilState(maxPredictionTokensState);
  const [topK, setTopK] = useRecoilState(topKState);
  const [topP, setTopP] = useRecoilState(topPState);
  const [repeatPenalty, setRepeatPenalty] = useRecoilState(repeatPenaltyState);
  const [repeatLastN, setRepeatLastN] = useRecoilState(repeatLastNState);

  // status
  const status = api.llama.status.useQuery(undefined, {
    refetchInterval: (data) => {
      if (data && data.status === "ready") {
        return 0;
      } else {
        return 1000;
      }
    },
  });

  return (
    <Flex direction="column" gap="sm" miw={300}>
      {/* future idea: allow loading multiple models, 7B, 15B, 30B, etc */}
      <Select data={["LLaMA"]} defaultValue="LLaMA" disabled />

      {/* Maximum Length */}
      <Tooltip
        position="left"
        label="The maximum number of tokens to generate."
        multiline
        width={250}
      >
        <NumberInput
          value={maxTokens}
          onChange={(value) => setMaxTokens(value === "" ? 0 : value)}
          min={0}
          precision={0}
          hideControls
          label="Maximum Tokens"
          required
        />
      </Tooltip>

      {/* Temperature */}
      <Tooltip
        position="left"
        label="As the temperature increases, the model will become more creative, but also more likely to generate nonsensical text."
        multiline
        width={250}
      >
        <Container w="100%" p={0}>
          <Flex w="100%">
            <Group position="apart">
              <Text size="sm" weight={500}>
                Temperature
              </Text>
            </Group>
            <Group ml="auto">
              <NumberInput
                value={temp}
                onChange={(value) => setTemp(value === "" ? 0 : value)}
                min={0}
                max={1}
                precision={2}
                hideControls
                size="xs"
                required
              />
            </Group>
          </Flex>
          <Slider
            value={temp}
            onChange={(value) => setTemp(value)}
            min={0}
            max={1}
            step={0.01}
            precision={2}
            mt="sm"
            label={null}
          />
        </Container>
      </Tooltip>

      {/* Top P */}
      <Tooltip
        position="left"
        label="The cumulative probability for top-p sampling. For example, 0.9 means that 90% of the total probability mass is assigned to the top 10 tokens."
        multiline
        width={250}
      >
        <Container w="100%" p={0}>
          <Flex w="100%">
            <Group position="apart">
              <Text size="sm" weight={500}>
                Top P
              </Text>
            </Group>
            <Group ml="auto">
              <NumberInput
                value={topP}
                onChange={(value) => setTopP(value === "" ? 0 : value)}
                min={0}
                max={1}
                precision={2}
                hideControls
                required
                size="xs"
              />
            </Group>
          </Flex>
          <Slider
            value={topP}
            onChange={(value) => setTopP(value)}
            min={0}
            max={1}
            step={0.01}
            precision={2}
            mt="sm"
            label={null}
          />
        </Container>
      </Tooltip>

      {/* Top K */}
      <Tooltip
        position="left"
        label="The number of highest probability vocabulary tokens to keep for top-k sampling."
        multiline
        width={250}
      >
        <NumberInput
          value={topK}
          onChange={(value) => setTopK(value === "" ? 0 : value)}
          min={0}
          precision={0}
          hideControls
          required
          label="Top K"
        />
      </Tooltip>

      {/* Repeat Penalty */}
      <Tooltip
        position="left"
        label="The penalty to apply if the model generates a token that has already been generated."
        multiline
        width={250}
      >
        <NumberInput
          value={repeatPenalty}
          onChange={(value) => setRepeatPenalty(value === "" ? 0 : value)}
          min={0}
          precision={2}
          hideControls
          required
          label="Repeat Penalty"
        />
      </Tooltip>

      {/* Repeat last n */}
      <Tooltip
        position="left"
        label="Last n tokens to consider for penalize"
        multiline
        width={250}
      >
        <NumberInput
          value={repeatLastN}
          onChange={(value) => setRepeatLastN(value === "" ? 0 : value)}
          min={0}
          precision={1}
          hideControls
          required
          label="Repeat Last N"
        />
      </Tooltip>

      {/* Model status */}
      <Text size="sm" weight={500}>
        {status.data?.status}
      </Text>
    </Flex>
  );
}
