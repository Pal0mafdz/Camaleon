import { useChat } from "@ai-sdk/react";
import { env } from "@camaleon/env/web";
import { DefaultChatTransport } from "ai";
import { Loader2, Send } from "lucide-react";
import React, { useRef, useEffect, useState } from "react";
import { Streamdown } from "streamdown";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatMessage = ReturnType<typeof useChat>["messages"][number];

function MessageBubble({ message, isStreaming }: { message: ChatMessage; isStreaming: boolean }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[min(42rem,85%)] rounded-lg px-4 py-3 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary/60"
        }`}
      >
        <p className="mb-1 text-xs font-medium opacity-70">{isUser ? "You" : "AI Assistant"}</p>
        <div className="space-y-2 text-sm leading-6">
          {message.parts?.map((part, index) => {
            if (part.type === "text") {
              return (
                <Streamdown key={index} isAnimating={isStreaming && !isUser}>
                  {part.text}
                </Streamdown>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}

const AI: React.FC = () => {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `${env.VITE_SERVER_URL}/ai`,
    }),
  });
  const isBusy = status === "submitted" || status === "streaming";

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="mx-auto grid h-full w-full max-w-3xl grid-rows-[1fr_auto] overflow-hidden p-4">
      <div className="overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground">
            <p>Ask me anything to get started.</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={status === "streaming" && message.role === "assistant"}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="w-full flex items-center space-x-2 pt-2 border-t">
        <Input
          name="prompt"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
          autoComplete="off"
          autoFocus
          disabled={isBusy}
        />
        <Button
          type="submit"
          size="icon"
          disabled={isBusy || !input.trim()}
          aria-label="Send message"
        >
          {isBusy ? <Loader2 className="size-4 animate-spin" /> : <Send size={18} />}
        </Button>
      </form>
    </div>
  );
};

export default AI;
