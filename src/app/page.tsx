"use client";
import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { ArrowRightIcon, SendHorizontal } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "./components/page-header";
import { cn } from "@/lib/utils";

const TITLE = "Dr tulu: End-to-End Training for Long-Form Deep Research with Adaptive Rubrics";

const BASE_PATH = '/dr-tulu';

const AUTHORS = [
  {
    name: "Dr Tulu Authors",
    affiliation: "Ai2 and others",
    email: "dr.tulu@gmail.com",
    website: "https://rl-rag.github.io/dr-tulu",
    avatar: `${BASE_PATH}/images/logo.png`,
  },
];

const PAPER_URL = "https://arxiv.org/";

const AuthorHoverCard = (author: (typeof AUTHORS)[0]) => (
  <HoverCard openDelay={100} closeDelay={100}>
    <HoverCardTrigger className="pr-4" style={{ marginLeft: 0 }}>
      <Button
        className="px-0"
        variant="link"
        onClick={() => {
          open(author.website, "_blank");
        }}
      >
        {author.name}
      </Button>
    </HoverCardTrigger>
    <HoverCardContent>
      <div className="flex justify-between">
        <Avatar className="mr-4">
          <AvatarImage src={author.avatar} />
          <AvatarFallback>{author.name[0]}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">{author.name}</h4>
          <p className="text-sm">{author.affiliation}</p>
          <div className="flex items-center pt-2 overflow-wrap break-words">
            <strong>Email: </strong>{" "}
            <Link className="pl-0.5" href={`mailto:${author.email}`}>
              {author.email}
            </Link>
          </div>
        </div>
      </div>
    </HoverCardContent>
  </HoverCard>
);

const Headline = () => (
  <PageHeader className="page-header pb-2 pt-0">
    <Link
      href={PAPER_URL}
      className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium"
    >
      <span className="sm:hidden">Check our paper!</span>
      <span className="hidden sm:inline">Check our paper!</span>
      <ArrowRightIcon className="ml-1 h-4 w-4" />
    </Link>
    <PageHeaderHeading className="tracking-tight">{TITLE}</PageHeaderHeading>
    <PageHeaderDescription>
      An advanced AI assistant for long-form deep research with adaptive evaluation rubrics.
    </PageHeaderDescription>
    <Separator className="mb-0.25 mt-2" />
    <div className="flex flex-wrap justify-start items-start align-start space-x-4">
      {AUTHORS.map((author, index) => (
        <React.Fragment key={index}>{AuthorHoverCard(author)}</React.Fragment>
      ))}
    </div>
  </PageHeader>
);

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm Dr. Tulu, your research assistant for long-form deep research. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "This is a placeholder response. Connect your AI backend to enable real conversations for deep research.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-[450px]">
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`${BASE_PATH}/images/logo.png`} alt="Dr. Tulu" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    DT
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "rounded-lg px-4 py-2 max-w-[80%]",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`${BASE_PATH}/images/logo.png`} alt="Dr. Tulu" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  DT
                </AvatarFallback>
              </Avatar>
              <div className="rounded-lg px-4 py-2 bg-muted">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      {/* <Separator className="w-full" /> */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your research..."
            className="min-h-[100px] max-h-[200px] resize-none pr-12"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            disabled={isLoading || !input.trim()}
            className="absolute bottom-2 right-2 h-8 w-8 rounded-lg hover:bg-muted"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex pl-2 mt-2">
          <p className="text-xs text-muted-foreground/60">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </form>
    </div>
  );
};

export default function Home() {
  return (
    <div className="container min-h-screen relative p-16">
      <Headline />
      <div className="mt-8 rounded-[0.5rem] border bg-background shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold ml-4 mb-4">Chat with Dr. Tulu</h2>
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
