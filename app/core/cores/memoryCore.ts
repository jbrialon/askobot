/**
 * MemoryCore - AskOS Conversation Memory System
 *
 * Manages conversation history and context retention across channels.
 * Automatically expires old conversations and maintains capacity limits.
 *
 * [Warning: Clearing Memory is permanent and cannot be undone]
 * [Note: Each channel maintains independent memory storage]
 * Part of the AskOS Core Systems v0.1alpha
 */

interface ChatMessage {
  role: string;
  content: string;
}

interface ChannelMemory {
  messages: ChatMessage[];
  lastActivity: number;
}

interface MemoryStorage {
  [channel: string]: ChannelMemory;
}

export class MemoryCore {
  private memoryCapacity: number;
  private memoryDuration: number; // in minutes
  private storage: MemoryStorage = {};

  constructor() {
    this.memoryCapacity = 40;
    this.memoryDuration = 60;
  }

  /**
   * Retrieves conversation history for a specific channel
   * Returns empty array if no history exists or if history has expired
   */
  getHistory(channel: string): ChatMessage[] {
    const memory = this.storage[channel];

    if (!memory) {
      return [];
    }

    // Check if memory has expired
    const now = Date.now();
    const expirationTime = now - this.memoryDuration * 60 * 1000;

    if (memory.lastActivity < expirationTime) {
      // Memory expired, clear it
      this.clearHistory(channel);
      return [];
    }

    return memory.messages;
  }

  /**
   * Adds a user message and assistant response to the conversation history
   * Automatically manages capacity and updates activity timestamp
   */
  addConversation(
    channel: string,
    user: string,
    userMessage: string,
    assistantResponse: string,
    platform: "twitch" | "discord" = "twitch",
  ): void {
    // Initialize channel memory if it doesn't exist
    if (!this.storage[channel]) {
      this.storage[channel] = {
        messages: [],
        lastActivity: Date.now(),
      };
    }

    const memory = this.storage[channel];
    const now = Date.now();
    const expirationTime = now - this.memoryDuration * 60 * 1000;

    // Clear history if expired
    if (memory.lastActivity < expirationTime) {
      memory.messages = [];
    }

    // Add user message
    memory.messages.push({
      role: "user",
      content: `[${platform.toUpperCase()}] @${user}: ${userMessage}`,
    });

    // Add assistant response
    memory.messages.push({
      role: "assistant",
      content: assistantResponse,
    });

    // Update last activity
    memory.lastActivity = now;

    // Trim history if it exceeds capacity
    if (memory.messages.length > this.memoryCapacity) {
      memory.messages = memory.messages.slice(-this.memoryCapacity);
    }
  }

  /**
   * Clears conversation history for a specific channel
   */
  clearHistory(channel: string): void {
    if (this.storage[channel]) {
      this.storage[channel].messages = [];
    }
  }

  /**
   * Clears all conversation history across all channels
   * [Warning: This operation cannot be undone]
   */
  clearAllHistory(): void {
    this.storage = {};
  }
}

// Singleton instance
const memoryCore = new MemoryCore();
export default memoryCore;
