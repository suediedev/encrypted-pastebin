"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Copy, Check, Lock } from "lucide-react";
import Prism from "prismjs";
import "prismjs/themes/prism.css";

interface SnippetData {
  content?: string;
  expiresAt?: string;
  isProtected?: boolean;
}

export default function SnippetPage() {
  const params = useParams();
  const { toast } = useToast();
  const [snippet, setSnippet] = useState<SnippetData | null>(null);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchSnippet = async (withPassword?: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/snippets/${params.id}`, {
        method: withPassword ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
        },
        ...(withPassword && { body: JSON.stringify({ password }) }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch snippet");
      }

      const data = await response.json();
      setSnippet(data);

      if (data.content) {
        setTimeout(() => {
          Prism.highlightAll();
        }, 0);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch snippet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSnippet();
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchSnippet(password);
  };

  const copyToClipboard = async () => {
    if (snippet?.content) {
      await navigator.clipboard.writeText(snippet.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (!snippet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto p-6">
          <p className="text-center text-muted-foreground">
            Snippet not found or has expired
          </p>
        </Card>
      </div>
    );
  }

  if (snippet.isProtected && !snippet.content) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto p-6">
          <div className="text-center mb-4">
            <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <h2 className="text-xl font-semibold mb-4">
              This snippet is password protected
            </h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full">
              Unlock Snippet
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto p-6">
        {snippet.expiresAt && (
          <p className="text-sm text-muted-foreground mb-4">
            Expires {formatDistanceToNow(new Date(snippet.expiresAt))}
          </p>
        )}
        <div className="relative">
          <pre className="rounded-lg bg-muted p-4">
            <code className="language-javascript">{snippet.content}</code>
          </pre>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyToClipboard}
            className="absolute top-2 right-2"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}