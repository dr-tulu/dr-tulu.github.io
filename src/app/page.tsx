"use client";
import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { ArrowRightIcon, SendHorizontal, ChevronRight, ExternalLink, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { nanoid } from "nanoid";

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

type Source = {
  id: string;
  title: string;
  url: string;
  snippet?: string;
};

type FullTraces = {
  generated_text: string;
  total_tokens: number;
  tool_call_count: number;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: Source[];
  fullTraces?: FullTraces;
};

type ExampleData = {
  example_id: string;
  problem: string;
  final_response: string;
  full_traces: {
    generated_text: string;
    total_tokens: number;
    tool_call_count: number;
    tool_calls: Array<{
      tool_name: string;
      call_id: string;
      documents: Array<{
        id: string;
        title: string;
        url: string;
        snippet: string;
      }>;
    }>;
  };
};

// Utility: Parse citations in text and return React elements with tooltips
const parseCitationsWithTooltips = (
  text: string,
  sources: Source[]
): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  const regex = /<cite id="([^"]+)">([^<]+)<\/cite>/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the citation
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const citationIds = match[1].split(",");
    const citedText = match[2];
    const citedSources = sources.filter((s) => citationIds.includes(s.id));

    // Create citation with tooltip
    parts.push(
      <CitationTooltip
        key={`cite-${match.index}`}
        sources={citedSources}
        text={citedText}
      />
    );

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

// Citation Tooltip Component
const CitationTooltip = ({
  sources,
  text,
}: {
  sources: Source[];
  text: string;
}) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span className="text-blue-600 underline decoration-dotted cursor-help">
            {text}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-3" side="top">
          <div className="space-y-2">
            {sources.length > 0 ? (
              sources.map((source) => (
                <div key={source.id} className="text-xs">
                  <div className="font-semibold">{source.title}</div>
                  {source.snippet && (
                    <div className="text-muted-foreground mt-1 line-clamp-2">
                      {source.snippet}
                    </div>
                  )}
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 inline-flex items-center gap-1 mt-1"
                  >
                    View Source <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground">
                No source information available
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Sources Collapsible Component
const SourcesCollapsible = ({ sources }: { sources: Source[] }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="px-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ChevronRight className={cn("h-3 w-3 transition-transform", isOpen && "rotate-90")} />
          <span>Sources ({sources.length})</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-1">
          {sources.map((source) => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              • {source.title}
            </a>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// Full Traces Panel Component
const FullTracesPanel = ({
  fullTraces,
  isOpen,
}: {
  fullTraces: FullTraces;
  isOpen: boolean;
}) => {
  return (
    <div
      className={cn(
        "border-l bg-muted/20 flex flex-col h-full transition-all duration-300 ease-in-out overflow-hidden",
        isOpen ? "w-96 opacity-100" : "w-0 opacity-0"
      )}
    >
      <div className="p-4 border-b bg-background min-w-96">
        <h3 className="font-semibold text-sm">Full Traces</h3>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span>Tokens: {fullTraces.total_tokens.toLocaleString()}</span>
          <span>Tool Calls: {fullTraces.tool_call_count}</span>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4 min-w-96">
        <pre className="text-xs whitespace-pre-wrap font-mono bg-background p-4 rounded-md">
          {fullTraces.generated_text}
        </pre>
      </ScrollArea>
    </div>
  );
};

// Load example JSON
const loadExampleData = async (): Promise<ExampleData | null> => {
  const response = await fetch("/dr-tulu/example.json");
  if (!response.ok) {
    console.error("Failed to load example.json");
    return null;
  }
  return response.json();
};

// Extract snippet IDs that are actually cited in the final response
const getCitedSnippetIds = (finalResponse: string): Set<string> => {
  const citedIds = new Set<string>();
  const regex = /<cite id="([^"]+)">/g;
  let match;
  
  while ((match = regex.exec(finalResponse)) !== null) {
    const ids = match[1].split(",").map(id => id.trim());
    ids.forEach(id => citedIds.add(id));
  }
  
  return citedIds;
};

// Parse snippet blocks from generated_text
const parseSnippetsFromGeneratedText = (generatedText: string): Map<string, Source> => {
  const snippetMap = new Map<string, Source>();
  const snippetRegex = /<snippet id=([^\s>]+)>\s*Title:\s*([^\n]+)\s*URL:\s*([^\n]+)\s*Snippet:\s*([^<]+)<\/snippet>/g;
  let match;
  
  while ((match = snippetRegex.exec(generatedText)) !== null) {
    const [, id, title, url, snippet] = match;
    snippetMap.set(id.trim(), {
      id: id.trim(),
      title: title.trim(),
      url: url.trim(),
      snippet: snippet.trim(),
    });
  }
  
  return snippetMap;
};

// Extract sources from example data - only include cited sources
const extractSources = (data: ExampleData): Source[] => {
  const citedIds = getCitedSnippetIds(data.final_response);
  const snippetMap = parseSnippetsFromGeneratedText(data.full_traces.generated_text);
  
  const sources: Source[] = [];
  
  // Only include sources that are actually cited
  citedIds.forEach(id => {
    const snippet = snippetMap.get(id);
    if (snippet) {
      sources.push(snippet);
    }
  });

  return sources;
};

// Convert example data to messages
const convertExampleToMessages = (data: ExampleData): Message[] => {
  const sources = extractSources(data);

  return [
    {
      id: nanoid(),
      role: "user",
      content: data.problem,
      timestamp: new Date(),
    },
    {
      id: nanoid(),
      role: "assistant",
      content: data.final_response,
      timestamp: new Date(),
      sources,
      fullTraces: {
        generated_text: data.full_traces.generated_text,
        total_tokens: data.full_traces.total_tokens,
        tool_call_count: data.full_traces.tool_call_count,
      },
    },
  ];
};

const ChatInterface = ({ selectedExample, isPanelOpen }: { selectedExample: string; isPanelOpen: boolean }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load example data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = await loadExampleData();
      if (data) {
        const msgs = convertExampleToMessages(data);
        setMessages(msgs);
      }
      setIsLoading(false);
    };
    loadData();
  }, [selectedExample]);

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
    // Disabled for now - will be enabled later
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-[600px] gap-0 pl-0">
      <div className="flex-1 flex flex-col">
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 pl-8">
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">Loading example...</div>
              </div>
            ) : (
              messages.map((message) => (
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
                  <div className="flex flex-col gap-2 max-w-[80%]">
                    <div
                      className={cn(
                        "rounded-lg px-4 py-3",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.role === "assistant" && message.sources
                          ? parseCitationsWithTooltips(message.content, message.sources)
                          : message.content}
                      </div>
                    </div>
                    {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                      <SourcesCollapsible sources={message.sources} />
                    )}
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="p-4 pl-8 border-t bg-muted/10">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Chat functionality coming soon..."
              className="min-h-[80px] max-h-[200px] resize-none pr-12 opacity-50"
              disabled={true}
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              disabled={true}
              className="absolute bottom-2 right-2 h-8 w-8 rounded-lg hover:bg-muted"
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex pl-2 mt-2">
            <p className="text-xs text-muted-foreground/60">
              Interactive chat coming soon. Currently displaying example research output.
            </p>
          </div>
        </form>
      </div>

      {/* Side Panel for Full Traces */}
      {messages.length > 0 && messages[1]?.fullTraces && (
        <FullTracesPanel
          fullTraces={messages[1].fullTraces}
          isOpen={isPanelOpen}
        />
      )}
    </div>
  );
};

export default function Home() {
  const [selectedExample, setSelectedExample] = useState<string>("example");
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);

  return (
    <div className="container min-h-screen relative p-16">
      <Headline />
      <div className="mt-8 rounded-[0.5rem] border bg-background shadow overflow-hidden">
        <div className="px-0 pt-6 pb-0">
          <div className="mr-6 ml-8 flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Research Assistant Demo</h2>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Select Example:</label>
              <Select value={selectedExample} onValueChange={setSelectedExample} disabled>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Choose an example" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="example">Example 1: Feather Hydrolysate Research</SelectItem>
                </SelectContent>
              </Select>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsPanelOpen(!isPanelOpen)}
                      className="h-8 w-8 transition-all hover:bg-muted"
                    >
                      {isPanelOpen ? (
                        <PanelLeftClose className="h-4 w-4 transition-transform duration-200" />
                      ) : (
                        <PanelLeftOpen className="h-4 w-4 transition-transform duration-200" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {isPanelOpen ? "Hide full traces" : "Show full traces"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <Separator className="mt-2" />
          <ChatInterface selectedExample={selectedExample} isPanelOpen={isPanelOpen} />
        </div>
      </div>
    </div>
  );
}
