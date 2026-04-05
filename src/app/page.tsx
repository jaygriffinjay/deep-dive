"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  parseRepoUrl,
  fetchRepoInfo,
  fetchRepoTree,
  fetchFileContent,
  filterScannableFiles,
  type GitHubFile,
} from "@/lib/github";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Github,
  Key,
  Search,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  Download,
  RotateCcw,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Brain,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Zap,
  Pause,
  Play,
} from "lucide-react";
import MarkdownRenderer from "@/components/markdown-renderer/MarkdownRenderer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AppState = "input" | "pick-files" | "scanning" | "report";
type Provider = "anthropic" | "openai";
type Severity = "critical" | "high" | "medium" | "low" | "info";

interface ModelOption {
  id: string;
  label: string;
  provider: Provider;
}

const MODELS: ModelOption[] = [
  { id: "claude-opus-4-6", label: "Claude Opus 4.6", provider: "anthropic" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "anthropic" },
  { id: "claude-sonnet-4-5-20250514", label: "Claude Sonnet 4.5", provider: "anthropic" },
  { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", provider: "anthropic" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "anthropic" },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", provider: "openai" },
  { id: "o3", label: "o3", provider: "openai" },
  { id: "o4-mini", label: "o4-mini", provider: "openai" },
];

interface Finding {
  severity: Severity;
  title: string;
  file: string;
  line?: string;
  description: string;
  recommendation: string;
}

interface FileResult {
  path: string;
  status: "pending" | "scanning" | "done" | "error";
  analysis: string;
  findings: Finding[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseFindingsFromText(text: string, filePath: string): Finding[] {
  const findings: Finding[] = [];
  const pattern =
    /###\s*\[?(CRITICAL|HIGH|MEDIUM|LOW|INFO)\]?\s+(.+?)(?:\n|$)/gi;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const severity = match[1].toLowerCase() as Severity;
    const title = match[2].trim();

    const startIdx = match.index + match[0].length;
    const nextSection = text.indexOf("\n### ", startIdx);
    const section = text.slice(
      startIdx,
      nextSection === -1 ? undefined : nextSection,
    );

    const lineMatch = section.match(
      /\*\*Line:\*\*\s*~?\s*(\d+(?:\s*-\s*\d+)?)/i,
    );
    const descMatch = section.match(
      /\*\*Description:\*\*\s*([\s\S]*?)(?=\*\*|$)/i,
    );
    const recMatch = section.match(
      /\*\*Recommendation:\*\*\s*([\s\S]*?)(?=\*\*|###|$)/i,
    );

    findings.push({
      severity,
      title,
      file: filePath,
      line: lineMatch?.[1]?.trim(),
      description: descMatch?.[1]?.trim() ?? "",
      recommendation: recMatch?.[1]?.trim() ?? "",
    });
  }

  return findings;
}

const severityConfig: Record<
  Severity,
  { color: string; textColor: string; label: string; order: number }
> = {
  critical: {
    color: "bg-red-700/10 text-red-700 border-red-700/20 dark:text-red-500 dark:border-red-500/20",
    textColor: "text-red-700 dark:text-red-500",
    label: "Critical",
    order: 0,
  },
  high: {
    color: "bg-orange-600/10 text-orange-600 border-orange-600/20 dark:text-orange-400 dark:border-orange-400/20",
    textColor: "text-orange-600 dark:text-orange-400",
    label: "High",
    order: 1,
  },
  medium: {
    color: "bg-yellow-600/10 text-yellow-600 border-yellow-600/20 dark:text-yellow-400 dark:border-yellow-400/20",
    textColor: "text-yellow-600 dark:text-yellow-400",
    label: "Medium",
    order: 2,
  },
  low: {
    color: "bg-sky-600/10 text-sky-600 border-sky-600/20 dark:text-sky-400 dark:border-sky-400/20",
    textColor: "text-sky-600 dark:text-sky-400",
    label: "Low",
    order: 3,
  },
  info: {
    color: "bg-blue-800/10 text-blue-800 border-blue-800/20 dark:text-blue-400 dark:border-blue-400/20",
    textColor: "text-blue-800 dark:text-blue-400",
    label: "Info",
    order: 4,
  },
};

// ---------------------------------------------------------------------------
// File tree helpers
// ---------------------------------------------------------------------------

interface TreeNode {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  files: GitHubFile[];
}

function buildTree(files: GitHubFile[]): TreeNode {
  const root: TreeNode = { name: "", path: "", children: new Map(), files: [] };
  for (const file of files) {
    const parts = file.path.split("/");
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i];
      const dirPath = parts.slice(0, i + 1).join("/");
      if (!node.children.has(dirName)) {
        node.children.set(dirName, { name: dirName, path: dirPath, children: new Map(), files: [] });
      }
      node = node.children.get(dirName)!;
    }
    node.files.push(file);
  }
  return root;
}

function getAllFilePaths(node: TreeNode): string[] {
  const paths: string[] = node.files.map((f) => f.path);
  for (const child of node.children.values()) {
    paths.push(...getAllFilePaths(child));
  }
  return paths;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Home() {
  // App state
  const [appState, setAppState] = useState<AppState>("input");

  // Input state
  const [repoUrl, setRepoUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [model, setModel] = useState("claude-sonnet-4-20250514");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // File picker state
  const [availableFiles, setAvailableFiles] = useState<GitHubFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [collapsedDirs, setCollapsedDirs] = useState<Set<string>>(new Set());
  const [fileTree, setFileTree] = useState<TreeNode | null>(null);
  const [fetchedBranch, setFetchedBranch] = useState("");

  // Scan state
  const [repoInfo, setRepoInfo] = useState<{
    owner: string;
    repo: string;
  } | null>(null);
  const [fileResults, setFileResults] = useState<FileResult[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [currentAnalysis, setCurrentAnalysis] = useState("");
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [paused, setPaused] = useState(false);

  // Refs
  const terminalRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pauseRef = useRef(false);
  const resumeRef = useRef<(() => void) | null>(null);
  const userScrolledSidebarRef = useRef(false);
  const sidebarScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [currentAnalysis, currentFileIndex]);

  // Auto-scroll sidebar to current file, unless user took control
  useEffect(() => {
    if (scanComplete || userScrolledSidebarRef.current) return;
    const container = sidebarRef.current;
    if (!container) return;
    const activeEl = container.children[0]?.children[currentFileIndex] as HTMLElement | undefined;
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [currentFileIndex, scanComplete]);

  // --------------------------------------------------
  // Step 1: Fetch repo files → show picker
  // --------------------------------------------------
  const fetchFiles = useCallback(async () => {
    setError(null);
    setLoading(true);

    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      setError(
        "Invalid GitHub URL. Try https://github.com/owner/repo or owner/repo",
      );
      setLoading(false);
      return;
    }

    // Validate owner/repo contain only safe characters
    if (!/^[a-zA-Z0-9_.-]+$/.test(parsed.owner) || !/^[a-zA-Z0-9_.-]+$/.test(parsed.repo)) {
      setError("Invalid repository owner or name.");
      setLoading(false);
      return;
    }

    if (!apiKey.trim()) {
      setError("Please enter your API key");
      setLoading(false);
      return;
    }

    try {
      const info = await fetchRepoInfo(parsed.owner, parsed.repo);
      setRepoInfo(parsed);
      setFetchedBranch(info.defaultBranch);

      const tree = await fetchRepoTree(parsed.owner, parsed.repo, info.defaultBranch);
      const files = filterScannableFiles(tree, Infinity);

      if (files.length === 0) {
        setError("No scannable source files found in this repository.");
        setLoading(false);
        return;
      }

      setAvailableFiles(files);
      setSelectedFiles(new Set(files.map((f) => f.path)));
      setFileTree(buildTree(files));
      setCollapsedDirs(new Set());
      setAppState("pick-files");
      setLoading(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setLoading(false);
    }
  }, [repoUrl, apiKey]);

  // --------------------------------------------------
  // Step 2: Run scan on selected files
  // --------------------------------------------------
  const runScan = useCallback(async () => {
    if (selectedFiles.size === 0 || !repoInfo) return;

    const files = availableFiles.filter((f) => selectedFiles.has(f.path));

    const results: FileResult[] = files.map((f) => ({
      path: f.path,
      status: "pending" as const,
      analysis: "",
      findings: [],
    }));

    setFileResults(results);
    setAppState("scanning");
    setScanComplete(false);
    setCurrentFileIndex(0);

    const abort = new AbortController();
    abortRef.current = abort;
    pauseRef.current = false;
    setPaused(false);

    for (let i = 0; i < files.length; i++) {
      if (abort.signal.aborted) break;

      // Check if paused — wait until resumed
      if (pauseRef.current) {
        await new Promise<void>((resolve) => {
          resumeRef.current = resolve;
        });
        resumeRef.current = null;
        if (abort.signal.aborted) break;
      }

      setCurrentFileIndex(i);
      setCurrentAnalysis("");
      setScanProgress((i / files.length) * 100);

      setFileResults((prev) => {
        const next = [...prev];
        next[i] = { ...next[i], status: "scanning" };
        return next;
      });

      try {
        const content = await fetchFileContent(
          repoInfo.owner,
          repoInfo.repo,
          fetchedBranch,
          files[i].path,
        );

        if (!content.trim()) {
          setFileResults((prev) => {
            const next = [...prev];
            next[i] = {
              ...next[i],
              status: "done",
              analysis: "Empty file — skipped.",
            };
            return next;
          });
          continue;
        }

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileContent: content.slice(0, 30_000),
            filePath: files[i].path,
            apiKey,
            provider,
            model,
            repoContext: `${repoInfo.owner}/${repoInfo.repo}`,
          }),
          signal: abort.signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `API error: ${res.status}`);
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          setCurrentAnalysis(fullText);
        }

        const findings = parseFindingsFromText(fullText, files[i].path);

        setFileResults((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], status: "done", analysis: fullText, findings };
          return next;
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // If paused, revert current file to pending so it's retried on resume
          if (pauseRef.current) {
            setFileResults((prev) => {
              const next = [...prev];
              next[i] = { ...next[i], status: "pending", analysis: "" };
              return next;
            });
          }
          break;
        }
        const message =
          err instanceof Error ? err.message : "Unknown error";
        setFileResults((prev) => {
          const next = [...prev];
          next[i] = {
            ...next[i],
            status: "error",
            analysis: `Error: ${message}`,
          };
          return next;
        });
      }
    }

    if (!pauseRef.current) {
      setScanProgress(100);
      setScanComplete(true);
    }
  }, [selectedFiles, availableFiles, repoInfo, fetchedBranch, apiKey, provider, model]);

  // --------------------------------------------------
  // Controls
  // --------------------------------------------------

  const pauseScan = useCallback(() => {
    pauseRef.current = true;
    setPaused(true);
    // Abort the current in-flight request so we don't wait for it
    abortRef.current?.abort();
  }, []);

  const resumeScan = useCallback(async () => {
    pauseRef.current = false;
    setPaused(false);

    // If scan loop is waiting on the pause promise, release it
    if (resumeRef.current) {
      // Create a fresh AbortController for continued requests
      const abort = new AbortController();
      abortRef.current = abort;
      resumeRef.current();
      return;
    }

    // If the loop already exited (aborted mid-request), restart from where we left off
    if (!repoInfo || !fetchedBranch) return;
    const files = availableFiles.filter((f) => selectedFiles.has(f.path));

    const abort = new AbortController();
    abortRef.current = abort;

    // Find the first file that isn't done
    const startIndex = fileResults.findIndex(
      (f) => f.status === "pending" || f.status === "scanning" || f.status === "error",
    );
    if (startIndex === -1) {
      setScanProgress(100);
      setScanComplete(true);
      return;
    }

    for (let i = startIndex; i < files.length; i++) {
      if (abort.signal.aborted) break;

      if (pauseRef.current) {
        await new Promise<void>((resolve) => {
          resumeRef.current = resolve;
        });
        resumeRef.current = null;
        if (abort.signal.aborted) break;
      }

      setCurrentFileIndex(i);
      setCurrentAnalysis("");
      setScanProgress((i / files.length) * 100);

      setFileResults((prev) => {
        const next = [...prev];
        next[i] = { ...next[i], status: "scanning" };
        return next;
      });

      try {
        const content = await fetchFileContent(
          repoInfo.owner,
          repoInfo.repo,
          fetchedBranch,
          files[i].path,
        );

        if (!content.trim()) {
          setFileResults((prev) => {
            const next = [...prev];
            next[i] = {
              ...next[i],
              status: "done",
              analysis: "Empty file — skipped.",
            };
            return next;
          });
          continue;
        }

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileContent: content.slice(0, 30_000),
            filePath: files[i].path,
            apiKey,
            provider,
            model,
            repoContext: `${repoInfo.owner}/${repoInfo.repo}`,
          }),
          signal: abort.signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `API error: ${res.status}`);
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          setCurrentAnalysis(fullText);
        }

        const findings = parseFindingsFromText(fullText, files[i].path);

        setFileResults((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], status: "done", analysis: fullText, findings };
          return next;
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") break;
        const message =
          err instanceof Error ? err.message : "Unknown error";
        setFileResults((prev) => {
          const next = [...prev];
          next[i] = {
            ...next[i],
            status: "error",
            analysis: `Error: ${message}`,
          };
          return next;
        });
      }
    }

    if (!pauseRef.current) {
      setScanProgress(100);
      setScanComplete(true);
    }
  }, [repoInfo, fetchedBranch, availableFiles, selectedFiles, fileResults, apiKey, provider, model]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setAppState("input");
    setFileResults([]);
    setCurrentAnalysis("");
    setScanProgress(0);
    setScanComplete(false);
    setPaused(false);
    setError(null);
    setAvailableFiles([]);
    setSelectedFiles(new Set());
    setFileTree(null);
  }, []);

  // --------------------------------------------------
  // Report generation
  // --------------------------------------------------

  const generateReport = useCallback(() => {
    const allFindings = fileResults.flatMap((f) => f.findings);
    const sorted = [...allFindings].sort(
      (a, b) => severityConfig[a.severity].order - severityConfig[b.severity].order,
    );

    const counts: Record<Severity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };
    sorted.forEach((f) => counts[f.severity]++);

    let md = `# Security Audit Report\n\n`;
    md += `**Repository:** ${repoInfo?.owner}/${repoInfo?.repo}\n`;
    md += `**Date:** ${new Date().toISOString().split("T")[0]}\n`;
    md += `**Files Scanned:** ${fileResults.filter((f) => f.status === "done").length}\n`;
    md += `**Model:** ${MODELS.find((m) => m.id === model)?.label ?? model}\n\n`;
    md += `## Summary\n\n`;
    md += `| Severity | Count |\n|----------|-------|\n`;
    md += `| 🔴 Critical | ${counts.critical} |\n`;
    md += `| 🟠 High | ${counts.high} |\n`;
    md += `| 🟡 Medium | ${counts.medium} |\n`;
    md += `| 🔵 Low | ${counts.low} |\n`;
    md += `| ⚪ Info | ${counts.info} |\n`;
    md += `| **Total** | **${sorted.length}** |\n\n`;

    if (sorted.length === 0) {
      md += `No security issues were found during this scan.\n\n`;
    } else {
      md += `## Findings\n\n`;
      sorted.forEach((f, i) => {
        md += `### ${i + 1}. [${f.severity.toUpperCase()}] ${f.title}\n\n`;
        md += `**File:** ${f.file}${f.line ? ` (Line ${f.line})` : ""}\n\n`;
        if (f.description) md += `**Description:** ${f.description}\n\n`;
        if (f.recommendation) md += `**Recommendation:** ${f.recommendation}\n\n`;
        md += `---\n\n`;
      });
    }

    md += `## File Analysis Details\n\n`;
    fileResults.forEach((f) => {
      if (f.status === "done" && f.analysis) {
        md += `### ${f.path}\n\n${f.analysis}\n\n---\n\n`;
      }
    });

    return md;
  }, [fileResults, repoInfo, model]);

  // --------------------------------------------------
  // Export
  // --------------------------------------------------

  const exportReport = useCallback(
    (format: "md" | "json") => {
      const allFindings = fileResults.flatMap((f) => f.findings);

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === "json") {
        content = JSON.stringify(
          {
            repository: `${repoInfo?.owner}/${repoInfo?.repo}`,
            date: new Date().toISOString(),
            filesScanned: fileResults.filter((f) => f.status === "done").length,
            model,
            findings: allFindings,
            fileDetails: fileResults.map((f) => ({
              path: f.path,
              status: f.status,
              analysis: f.analysis,
              findings: f.findings,
            })),
          },
          null,
          2,
        );
        filename = `deep-dive-${repoInfo?.repo}.json`;
        mimeType = "application/json";
      } else {
        content = generateReport();
        filename = `deep-dive-${repoInfo?.repo}.md`;
        mimeType = "text/markdown";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    [fileResults, repoInfo, model, generateReport],
  );

  // --------------------------------------------------
  // Derived values
  // --------------------------------------------------

  const allFindings = fileResults.flatMap((f) => f.findings);
  const severityCounts: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  allFindings.forEach((f) => severityCounts[f.severity]++);
  const filesScanned = fileResults.filter((f) => f.status === "done").length;

  const [copied, setCopied] = useState(false);
  const copyReport = useCallback(() => {
    navigator.clipboard.writeText(generateReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generateReport]);

  // ====================================================================
  // RENDER — Input state
  // ====================================================================

  if (appState === "input") {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-8">
          {/* Hero */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
              <Shield className="size-3" />
              AI-Powered Security Audit
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Deep Dive</h1>
            <p className="text-muted-foreground text-balance max-w-md mx-auto">
              Point an AI agent at any public GitHub repo and get a security
              vulnerability report. BYO API key — nothing stored, nothing
              tracked.
            </p>
          </div>

          {/* Form */}
          <Card>
            <CardContent className="space-y-4 pt-6">
              {/* Repo URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Github className="size-4" />
                  GitHub Repository
                </label>
                <Input
                  placeholder="https://github.com/owner/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchFiles()}
                />
              </div>

              {/* Provider + Model */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Brain className="size-4" />
                  AI Provider
                </label>
                <Select
                  value={provider}
                  onValueChange={(v) => {
                    const p = v as Provider;
                    setProvider(p);
                    const firstModel = MODELS.find((m) => m.provider === p);
                    if (firstModel) setModel(firstModel.id);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Model */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  Model
                </label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.filter((m) => m.provider === provider).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Key className="size-4" />
                  API Key
                </label>
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    placeholder={
                      provider === "anthropic" ? "sk-ant-..." : "sk-..."
                    }
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-10"
                    onKeyDown={(e) => e.key === "Enter" && fetchFiles()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKey ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your key is proxied through this app&apos;s server to{" "}
                  {provider === "anthropic" ? "Anthropic" : "OpenAI"} (required
                  for CORS). It is never stored or logged.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button
                className="w-full"
                size="lg"
                onClick={fetchFiles}
                disabled={loading || !repoUrl.trim() || !apiKey.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Fetching repository...
                  </>
                ) : (
                  <>
                    <Search className="size-4" />
                    Choose Files to Scan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            Inspired by{" "}
            <a
              href="https://mtlynch.io/claude-code-found-linux-vulnerability/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Nicholas Carlini finding Linux kernel vulnerabilities with AI
            </a>
          </p>
        </div>
      </div>
    );
  }

  // ====================================================================
  // RENDER — File picker state
  // ====================================================================

  if (appState === "pick-files" && fileTree) {
    const allPaths = availableFiles.map((f) => f.path);
    const allSelected = selectedFiles.size === allPaths.length;

    const toggleAll = (checked: boolean) => {
      setSelectedFiles(checked ? new Set(allPaths) : new Set());
    };

    const toggleDir = (dirNode: TreeNode, checked: boolean) => {
      const paths = getAllFilePaths(dirNode);
      setSelectedFiles((prev) => {
        const next = new Set(prev);
        for (const p of paths) {
          if (checked) next.add(p);
          else next.delete(p);
        }
        return next;
      });
    };

    const toggleFile = (path: string) => {
      setSelectedFiles((prev) => {
        const next = new Set(prev);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        return next;
      });
    };

    const toggleCollapse = (dirPath: string) => {
      setCollapsedDirs((prev) => {
        const next = new Set(prev);
        if (next.has(dirPath)) next.delete(dirPath);
        else next.add(dirPath);
        return next;
      });
    };

    const isDirChecked = (node: TreeNode): boolean | "indeterminate" => {
      const paths = getAllFilePaths(node);
      const selected = paths.filter((p) => selectedFiles.has(p)).length;
      if (selected === 0) return false;
      if (selected === paths.length) return true;
      return "indeterminate";
    };

    const renderTree = (node: TreeNode, depth: number = 0) => {
      const sortedDirs = [...node.children.entries()].sort((a, b) =>
        a[0].localeCompare(b[0]),
      );
      const sortedFiles = [...node.files].sort((a, b) =>
        a.path.localeCompare(b.path),
      );

      return (
        <>
          {sortedDirs.map(([name, child]) => {
            const collapsed = collapsedDirs.has(child.path);
            const checked = isDirChecked(child);
            const fileCount = getAllFilePaths(child).length;
            return (
              <div key={child.path}>
                <div
                  className="flex items-center gap-1.5 py-1 hover:bg-muted/50 rounded-md px-1 cursor-pointer"
                  style={{ paddingLeft: `${depth * 16 + 4}px` }}
                >
                  <button
                    type="button"
                    onClick={() => toggleCollapse(child.path)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    {collapsed ? (
                      <ChevronRight className="size-3.5" />
                    ) : (
                      <ChevronDown className="size-3.5" />
                    )}
                  </button>
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) => toggleDir(child, !!c)}
                    className="shrink-0"
                  />
                  {collapsed ? (
                    <Folder className="size-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <FolderOpen className="size-3.5 text-muted-foreground shrink-0" />
                  )}
                  <button
                    type="button"
                    onClick={() => toggleCollapse(child.path)}
                    className="text-sm truncate text-left"
                  >
                    {name}/
                  </button>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {fileCount}
                  </span>
                </div>
                {!collapsed && renderTree(child, depth + 1)}
              </div>
            );
          })}
          {sortedFiles.map((file) => {
            const fileName = file.path.split("/").pop() ?? file.path;
            return (
              <div
                key={file.path}
                className="flex items-center gap-1.5 py-1 hover:bg-muted/50 rounded-md px-1"
                style={{ paddingLeft: `${depth * 16 + 24}px` }}
              >
                <Checkbox
                  checked={selectedFiles.has(file.path)}
                  onCheckedChange={() => toggleFile(file.path)}
                  className="shrink-0"
                />
                <FileCode className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm truncate" title={file.path}>
                  {fileName}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {file.size > 1024
                    ? `${(file.size / 1024).toFixed(1)}KB`
                    : `${file.size}B`}
                </span>
              </div>
            );
          })}
        </>
      );
    };

    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {repoInfo?.owner}/{repoInfo?.repo}
            </h1>
            <p className="text-muted-foreground text-sm">
              {availableFiles.length} scannable files found — select which to
              analyze
            </p>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileCode className="size-4" />
                  Files
                  <Badge variant="secondary" className="ml-1">
                    {selectedFiles.size}/{availableFiles.length}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleAll(false)}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    Deselect all
                  </button>
                  <label
                    onClick={() => toggleAll(!allSelected)}
                    className="flex items-center gap-2 rounded-md px-2 py-1 -mr-2 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(c) => toggleAll(!!c)}
                    />
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Deep Dive — Select All
                    </span>
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-3 pb-3">
              <div className="max-h-[50vh] overflow-y-auto space-y-0.5 rounded-md border p-2">
                {renderTree(fileTree)}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={reset} className="flex-1">
              <RotateCcw className="size-4" />
              Back
            </Button>
            <Button
              className="flex-2"
              size="lg"
              onClick={runScan}
              disabled={selectedFiles.size === 0}
            >
              <Shield className="size-4" />
              Scan {selectedFiles.size} File{selectedFiles.size !== 1 ? "s" : ""}
            </Button>
          </div>

        </div>
      </div>
    );
  }

  // ====================================================================
  // RENDER — Scanning / report state
  // ====================================================================

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        {/* Header bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">
                {repoInfo?.owner}/{repoInfo?.repo}
              </h1>
              {scanComplete ? (
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="size-3" />
                  Complete
                </Badge>
              ) : paused ? (
                <Badge variant="secondary" className="gap-1">
                  <Pause className="size-3" />
                  Paused
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <Loader2 className="size-3 animate-spin" />
                  Scanning
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {filesScanned} of {fileResults.length} files scanned
              {allFindings.length > 0 &&
                ` · ${allFindings.length} finding${allFindings.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!scanComplete && !paused && (
              <Button variant="outline" size="sm" onClick={pauseScan}>
                <Pause className="size-3.5" />
                Pause
              </Button>
            )}
            {paused && !scanComplete && (
              <Button variant="outline" size="sm" onClick={resumeScan}>
                <Play className="size-3.5" />
                Resume
              </Button>
            )}
            {(scanComplete || paused) && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportReport("md")}
                >
                  <Download className="size-3.5" />
                  Markdown
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportReport("json")}
                >
                  <Download className="size-3.5" />
                  JSON
                </Button>
                <Button variant="outline" size="sm" onClick={copyReport}>
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="size-3.5" />
              New Scan
            </Button>
          </div>
        </div>

        {/* Progress */}
        <Progress value={scanProgress} className="h-1.5" />

        {/* Severity badges */}
        {allFindings.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {(
              Object.entries(severityCounts) as [Severity, number][]
            )
              .filter(([, count]) => count > 0)
              .map(([sev, count]) => (
                <Badge
                  key={sev}
                  variant="outline"
                  className={`gap-1 ${severityConfig[sev].color}`}
                >
                  {count} {severityConfig[sev].label}
                </Badge>
              ))}
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          {/* File list sidebar */}
          <Card className="h-fit max-h-[calc(100vh-14rem)] overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Files</CardTitle>
            </CardHeader>
            <CardContent
              ref={sidebarRef}
              className="overflow-y-auto max-h-[calc(100vh-18rem)] px-3 pb-3 pt-0"
              onScroll={() => {
                userScrolledSidebarRef.current = true;
                if (sidebarScrollTimerRef.current) clearTimeout(sidebarScrollTimerRef.current);
                sidebarScrollTimerRef.current = setTimeout(() => {
                  userScrolledSidebarRef.current = false;
                }, 4000);
              }}
            >
              <div className="space-y-0.5">
                {fileResults.map((f, i) => (
                  <div
                    key={f.path}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
                      i === currentFileIndex && !scanComplete
                        ? "bg-primary/10 text-primary"
                        : f.status === "error"
                          ? "text-destructive"
                          : f.findings.length > 0
                            ? severityConfig[
                                f.findings.reduce((worst, finding) =>
                                  severityConfig[finding.severity].order < severityConfig[worst].order
                                    ? finding.severity
                                    : worst,
                                  f.findings[0].severity,
                                )
                              ].textColor
                            : f.status === "done"
                              ? "text-foreground/40"
                              : "text-foreground/20"
                    }`}
                  >
                    {f.status === "scanning" ? (
                      <Loader2 className="size-3 shrink-0 animate-spin" />
                    ) : f.status === "done" ? (
                      f.findings.length > 0 ? (
                        <AlertTriangle className="size-3 shrink-0" />
                      ) : (
                        <CheckCircle2 className="size-3 shrink-0" />
                      )
                    ) : f.status === "error" ? (
                      <AlertTriangle className="size-3 shrink-0" />
                    ) : (
                      <FileCode className="size-3 shrink-0 opacity-40" />
                    )}
                    <span className="truncate" title={f.path}>
                      {f.path.split("/").pop()}
                    </span>
                    {f.findings.length > 0 && (
                      <Badge
                        className="ml-auto h-4 px-1 text-[10px]"
                        variant="secondary"
                      >
                        {f.findings.length}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main content: terminal + findings */}
          <div className="space-y-4">
            {/* Live terminal */}
            {!scanComplete && (
              <Card className="overflow-hidden border-primary/20">
                <CardHeader className="pb-2 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="size-2.5 rounded-full bg-red-500/80" />
                      <div className="size-2.5 rounded-full bg-yellow-500/80" />
                      <div className="size-2.5 rounded-full bg-green-500/80" />
                    </div>
                    <CardDescription className="text-xs font-mono">
                      {paused
                        ? "Paused"
                        : fileResults[currentFileIndex]?.path ?? "Initializing..."}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div
                    ref={terminalRef}
                    className="h-[400px] overflow-y-auto p-4 font-mono text-xs leading-relaxed text-green-400 bg-[#0d1117] whitespace-pre-wrap"
                  >
                    {currentAnalysis || (
                      <span className="text-muted-foreground animate-pulse">
                        {paused ? "Paused — click Resume to continue" : "Analyzing file..."}
                      </span>
                    )}
                    {!scanComplete && !paused && (
                      <span className="inline-block w-1.5 h-4 bg-green-400 ml-0.5 animate-pulse" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Findings list */}
            {(scanComplete || allFindings.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="size-4" />
                    Findings
                    {allFindings.length > 0 && (
                      <Badge variant="secondary">{allFindings.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allFindings.length === 0 && scanComplete ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="size-10 mx-auto mb-3 text-green-500" />
                      <p className="font-medium text-foreground">
                        No security issues found
                      </p>
                      <p className="text-sm mt-1">
                        The AI agent didn&apos;t identify any vulnerabilities in
                        the scanned files.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[...allFindings]
                        .sort(
                          (a, b) =>
                            severityConfig[a.severity].order -
                            severityConfig[b.severity].order,
                        )
                        .map((finding, i) => (
                          <div
                            key={`${finding.file}-${finding.title}-${i}`}
                            className="rounded-lg border p-4 space-y-2 min-w-0 overflow-hidden"
                          >
                            <div className="flex items-start gap-2">
                              <Badge
                                variant="outline"
                                className={severityConfig[finding.severity].color}
                              >
                                {severityConfig[finding.severity].label}
                              </Badge>
                              <div className="space-y-1 min-w-0">
                                <span className="font-medium text-sm">
                                  {finding.title}
                                </span>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {finding.file}
                                  {finding.line && `:${finding.line}`}
                                </p>
                              </div>
                            </div>
                            {finding.description && (
                              <MarkdownRenderer
                                content={finding.description}
                                className="text-sm text-muted-foreground"
                              />
                            )}
                            {finding.recommendation && (
                              <div className="rounded-md bg-muted/50 px-3 py-2.5">
                                <div className="text-xs font-semibold mb-1">Recommendation</div>
                                <MarkdownRenderer
                                  content={finding.recommendation}
                                  className="text-xs text-muted-foreground"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
