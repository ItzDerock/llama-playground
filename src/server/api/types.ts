export enum WSMessageType {
  // Identity -> server gives client a unique UUID
  IDENTITY,
  // Completion -> generated tokens are sent to the client
  COMPLETION,
  // Request Complete -> done generating tokens
  REQUEST_COMPLETE,
}

export type WSMessage = {
  type: WSMessageType;
  data: string;
};
