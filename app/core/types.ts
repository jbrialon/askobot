export interface ChatMessage {
  role: string;
  content: string;
}

export interface GenerateResponseParams {
  channel: string;
  user: string;
  message: string;
  platform?: "twitch" | "discord";
  history?: ChatMessage[];
}

export interface AskOSResponse {
  message: string;
  emotion: string;
  animation: string;
}
