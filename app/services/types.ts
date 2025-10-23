export interface History {
  [channel: string]: {
    messages: { role: string; content: string }[];
    lastActivity: number;
  };
}

export interface AskobotResponse {
  message: string;
  emotion?: string;
  animation?: string;
  emoji?: string;
}
