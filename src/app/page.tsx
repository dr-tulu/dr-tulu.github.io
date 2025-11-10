"use client";
import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { ArrowRightIcon, SendHorizontal, ChevronRight, ExternalLink, PanelLeftClose, PanelLeftOpen, Search, ArrowDownFromLine, ArrowUpFromLine } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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
    {/* <PageHeaderDescription>
      An advanced AI assistant for long-form deep research with adaptive evaluation rubrics.
    </PageHeaderDescription> */}
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

type Document = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  tool_call_id: string;
  tool_name: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: Source[];
  fullTraces?: FullTraces;
  documents?: Document[];
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

  // Create a mapping from source IDs to citation numbers
  const sourceIdToNumber = new Map<string, number>();
  sources.forEach((source, index) => {
    sourceIdToNumber.set(source.id, index + 1);
  });

  while ((match = regex.exec(text)) !== null) {
    // Add text before the citation
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const citationIds = match[1].split(",");
    const citedText = match[2];
    const citedSources = sources.filter((s) => citationIds.includes(s.id));
    const citationNumbers = citationIds
      .map(id => sourceIdToNumber.get(id.trim()))
      .filter(num => num !== undefined) as number[];

    // Create citation with tooltip
    parts.push(
      <CitationTooltip
        key={`cite-${match.index}`}
        sources={citedSources}
        text={citedText}
        citationNumbers={citationNumbers}
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
  citationNumbers,
}: {
  sources: Source[];
  text: string;
  citationNumbers: number[];
}) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span className="text-foreground underline decoration-blue-400 decoration-dotted cursor-help transition-colors duration-200 hover:text-blue-600">
            {text}
            <sup className="ml-0.5 text-[10px] text-blue-500 font-medium">
              [{citationNumbers.join(", ")}]
            </sup>
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-3" side="top">
        <div className="space-y-2">
            {sources.length > 0 ? (
              sources.map((source, index) => (
                <div key={source.id} className="text-xs">
                  <div className="font-semibold">
                    [{citationNumbers[index]}] {source.title}
                  </div>
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
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setTimeout(() => {
        const scrollContainer = contentRef.current?.closest('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollBy({ 
            top: 60,
            behavior: "auto"
          });
        }
      }, 150);
    }
  }, [isOpen]);

  return (
    <div className="px-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className={cn("h-3 w-3 transition-transform duration-200", isOpen && "rotate-90")} />
          <span>Sources ({sources.length})</span>
        </CollapsibleTrigger>
        <CollapsibleContent 
          ref={contentRef}
          className="mt-2 space-y-1 animate-in slide-in-from-top-1 duration-200"
        >
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

// Parse full traces into structured sections
type TraceSection = {
  type: "text" | "tool_call" | "tool_output";
  content: string;
  toolName?: string;
  toolParams?: Record<string, string>;
};

const parseFullTraces = (generatedText: string): TraceSection[] => {
  const sections: TraceSection[] = [];
  const toolCallRegex = /<call_tool name="([^"]+)"([^>]*)>([\s\S]*?)<\/call_tool>/g;
  const toolOutputRegex = /<tool_output>([\s\S]*?)<\/tool_output>/g;
  
  let lastIndex = 0;
  const matches: Array<{type: "call" | "output", index: number, endIndex: number, content: string, name?: string, params?: Record<string, string>}> = [];
  
  // Find all tool calls
  let match;
  while ((match = toolCallRegex.exec(generatedText)) !== null) {
    const toolName = match[1];
    const paramsString = match[2];
    const content = match[3];
    
    // Parse parameters
    const params: Record<string, string> = {};
    const paramRegex = /(\w+)="([^"]*)"/g;
    let paramMatch;
    while ((paramMatch = paramRegex.exec(paramsString)) !== null) {
      params[paramMatch[1]] = paramMatch[2];
    }
    
    matches.push({
      type: "call",
      index: match.index,
      endIndex: match.index + match[0].length,
      content,
      name: toolName,
      params
    });
  }
  
  // Find all tool outputs
  toolOutputRegex.lastIndex = 0;
  while ((match = toolOutputRegex.exec(generatedText)) !== null) {
    matches.push({
      type: "output",
      index: match.index,
      endIndex: match.index + match[0].length,
      content: match[1]
    });
  }
  
  // Sort matches by index
  matches.sort((a, b) => a.index - b.index);
  
  // Build sections
  matches.forEach((match) => {
    // Add text before this match
    if (match.index > lastIndex) {
      const textContent = generatedText.slice(lastIndex, match.index).trim();
      if (textContent) {
        sections.push({
          type: "text",
          content: textContent
        });
      }
    }
    
    // Add the match itself
    if (match.type === "call") {
      sections.push({
        type: "tool_call",
        content: match.content.trim(),
        toolName: match.name,
        toolParams: match.params
      });
    } else {
      sections.push({
        type: "tool_output",
        content: match.content.trim()
      });
    }
    
    lastIndex = match.endIndex;
  });
  
  // Add any remaining text
  if (lastIndex < generatedText.length) {
    const textContent = generatedText.slice(lastIndex).trim();
    if (textContent) {
      sections.push({
        type: "text",
        content: textContent
      });
    }
  }
  
  return sections;
};

// Component to render a single trace section
const TraceSection = ({ section, index }: { section: TraceSection; index: number }) => {
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);
  
  if (section.type === "text") {
    return (
      <div className="bg-background rounded-md border overflow-hidden">
        <Collapsible open={isThinkingOpen} onOpenChange={setIsThinkingOpen}>
          <CollapsibleTrigger className="flex items-center justify-between p-4 w-full hover:bg-muted/50 transition-colors duration-200">
            <span className="text-xs font-semibold text-muted-foreground">Thinking</span>
            <div className={cn(
              "transform transition-all duration-300 ease-in-out",
              isThinkingOpen ? "rotate-0 scale-100" : "rotate-0 scale-100"
            )}>
              {isThinkingOpen ? (
                <ArrowUpFromLine className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ArrowDownFromLine className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 duration-300">
            <div className="px-4 pb-4 pt-1">
              <p className="text-xs whitespace-pre-wrap font-mono leading-relaxed break-words">
                {section.content}
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }
  
  if (section.type === "tool_call") {
    return (
      <div className="bg-blue-50 p-4 rounded-md border border-blue-200 transition-all duration-200 hover:shadow-md hover:border-blue-300 hover:bg-blue-100 cursor-pointer overflow-hidden">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-blue-700">
              Tool Call: {section.toolName}
            </span>
            {section.toolParams && Object.keys(section.toolParams).length > 0 && (
              <div className="mt-1 space-y-0.5">
                {Object.entries(section.toolParams).map(([key, value]) => (
                  <div key={key} className="text-xs text-muted-foreground break-all overflow-hidden">
                    <span className="font-medium">{key}:</span> {value}
                  </div>
                ))}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground bg-blue-100 px-2 py-0.5 rounded flex-shrink-0">
            #{index + 1}
          </span>
        </div>
        <div className="max-h-48 overflow-y-auto overflow-x-hidden">
          <p className="text-xs whitespace-pre-wrap font-mono leading-relaxed text-muted-foreground mt-2 break-all overflow-hidden">
            {section.content}
          </p>
        </div>
      </div>
    );
  }
  
  if (section.type === "tool_output") {
    return (
      <div className="bg-green-50 p-4 rounded-md border border-green-200 overflow-hidden">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-xs font-semibold text-green-700">
            Tool Output
          </span>
        </div>
        <div className="max-h-48 overflow-y-auto overflow-x-hidden">
          <p className="text-xs whitespace-pre-wrap font-mono leading-relaxed text-muted-foreground break-all overflow-hidden">
            {section.content}
          </p>
        </div>
      </div>
    );
  }
  
  return null;
};

// Side Panel Component with Tabs
const SidePanel = ({
  fullTraces,
  documents,
}: {
  fullTraces: FullTraces;
  documents: Document[];
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [parsedTraces, setParsedTraces] = useState<TraceSection[]>([]);

  useEffect(() => {
    const sections = parseFullTraces(fullTraces.generated_text);
    setParsedTraces(sections);
  }, [fullTraces.generated_text]);

  const filteredDocuments = documents.filter((doc) => {
    const query = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(query) ||
      doc.snippet.toLowerCase().includes(query) ||
      doc.url.toLowerCase().includes(query)
    );
  });

  return (
    <div className="bg-muted/20 flex flex-col h-full overflow-hidden border-l ">
      <Tabs defaultValue="traces" className="flex flex-col h-full">
        <div className="p-4 border-b bg-background">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="traces">Full Traces</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="traces" className="flex-1 overflow-hidden mt-0">
          <div className="p-4 border-b bg-background">
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Tokens: {fullTraces.total_tokens.toLocaleString()}</span>
              <span>Tool Calls: {fullTraces.tool_call_count}</span>
            </div>
          </div>
          <ScrollArea className="h-[calc(100%-3rem)] p-4">
            <div className="space-y-3">
              {parsedTraces.map((section, index) => (
                <TraceSection key={index} section={section} index={index} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="documents" className="flex-1 overflow-hidden mt-0">
          <div className="p-4 border-b bg-background">
            <div className="relative flex items-center">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-8 pr-32 h-9 text-xs"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                {searchQuery ? (
                  <span>Showing {filteredDocuments.length} of {documents.length} result{documents.length !== 1 ? "s" : ""}</span>
                ) : (
                  <span>{documents.length} retrieved</span>
                )}
              </div>
            </div>
          </div>
          <ScrollArea className="h-[calc(100%-5rem)] p-4">
            <div className="space-y-4">
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc, index) => (
                  <div
                    key={`${doc.tool_call_id}-${doc.id}`}
                    className="bg-background p-4 rounded-md border"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-sm flex-1">{doc.title}</h4>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        #{documents.indexOf(doc) + 1}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {doc.snippet}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {doc.tool_name}
                      </span>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:text-blue-700 inline-flex items-center gap-1"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No documents found matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
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

// Extract documents from tool calls - only include cited documents
const extractDocuments = (data: ExampleData): Document[] => {
  const citedIds = getCitedSnippetIds(data.final_response);
  const documents: Document[] = [];
  
  if (data.full_traces.tool_calls) {
    data.full_traces.tool_calls.forEach((toolCall) => {
      if (toolCall.documents) {
        toolCall.documents.forEach((doc, index) => {
          // Create snippet ID in the format: call_id-index (e.g., "fb888718-0")
          const snippetId = `${toolCall.call_id}-${index}`;
          
          // Only include documents that are actually cited in the response
          if (citedIds.has(snippetId)) {
            documents.push({
              id: snippetId,
              title: doc.title,
              url: doc.url,
              snippet: doc.snippet,
              tool_call_id: toolCall.call_id,
              tool_name: toolCall.tool_name,
            });
          }
        });
      }
    });
  }
  
  return documents;
};

// Convert example data to messages
const convertExampleToMessages = (data: ExampleData): Message[] => {
  const sources = extractSources(data);
  const documents = extractDocuments(data);

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
      documents,
      fullTraces: {
        generated_text: data.full_traces.generated_text,
        total_tokens: data.full_traces.total_tokens,
        tool_call_count: data.full_traces.tool_call_count,
      },
    },
  ];
};

const ChatInterface = ({ selectedExample, isPanelOpen, onPanelToggle }: { selectedExample: string; isPanelOpen: boolean; onPanelToggle: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<any>(null);

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

  // Handle panel collapse/expand
  useEffect(() => {
    if (panelRef.current) {
      if (isPanelOpen) {
        panelRef.current.expand();
      } else {
        panelRef.current.collapse();
      }
    }
  }, [isPanelOpen]);

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
    <ResizablePanelGroup direction="horizontal" className="h-[600px]">
      <ResizablePanel defaultSize={65} minSize={30}>
        <div className="flex flex-col h-[600px]">
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
      </ResizablePanel>

      {/* Side Panel for Full Traces and Documents */}
      {messages.length > 0 && messages[1]?.fullTraces && (
        <>
          <ResizableHandle withHandle className="w-0" />
          <ResizablePanel 
            ref={panelRef}
            defaultSize={35} 
            minSize={20}
            maxSize={60}
            collapsible
            collapsedSize={0}
            className="h-[600px]"
          >
            <SidePanel
              fullTraces={messages[1].fullTraces}
              documents={messages[1].documents || []}
            />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
};

const Footer = () => (
  <footer className="mt-16 border-t bg-muted/20 px-8">
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-muted-foreground">
          © 2025 Dr. Tulu Authors. All rights reserved.
        </div>
        <div className="flex items-center gap-6">
          <Link
            href={PAPER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Paper
          </Link>
          <Link
            href="https://rl-rag.github.io/dr-tulu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Project Page
          </Link>
          <Link
            href="mailto:dr.tulu@gmail.com"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact
          </Link>
        </div>
      </div>
    </div>
  </footer>
);

export default function Home() {
  const [selectedExample, setSelectedExample] = useState<string>("example");
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container relative p-16 flex-1">
        <Headline />
        <div className="mt-8 rounded-[0.5rem] border bg-background shadow overflow-hidden">
          <div className="px-0 pt-6 pb-0">
            <div className="mr-6 ml-8 flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Dr. Tulu for Deep Research</h2>
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
                      {isPanelOpen ? "Hide side panel" : "Show side panel"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <Separator className="mt-2" />
            <ChatInterface 
              selectedExample={selectedExample} 
              isPanelOpen={isPanelOpen} 
              onPanelToggle={() => setIsPanelOpen(!isPanelOpen)}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
