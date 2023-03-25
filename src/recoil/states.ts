import { atom } from "recoil";

// websocket state
export const wsUUIDState = atom({
  key: "ws_uuid",
  default: "",
});

export enum ClientWSState {
  CONNECTING,
  READY,
}

export const wsState = atom({
  key: "ws_state",
  default: ClientWSState.CONNECTING,
});

// model options
export const maxPredictionTokensState = atom({
  key: "num_predict",
  default: 2048,
});

export const nBatchState = atom({
  key: "n_batch",
  default: 8,
});

export const topKState = atom({
  key: "top_k",
  default: 40,
});

export const topPState = atom({
  key: "top_p",
  default: 0.95,
});

export const repeatPenaltyState = atom({
  key: "repeat_penalty",
  default: 1.3,
});

export const repeatLastNState = atom({
  key: "repeat_last_n",
  default: 64,
});

export const tempState = atom({
  key: "temp",
  default: 0.8,
});

export const promptState = atom({
  key: "prompt",
  default: "asdf",
});

export const promptTemplateState = atom({
  key: "prompt_template",
  default: "",
});

export const generatingState = atom({
  key: "generating",
  default: false,
});

export const generatedText = atom({
  key: "generated_text",
  default: "",
});
