export interface GitHubFile {
  path: string;
  size: number;
  sha: string;
}

export interface RepoInfo {
  owner: string;
  repo: string;
  defaultBranch: string;
}

/** Parse GitHub URL or owner/repo shorthand into { owner, repo } */
export function parseRepoUrl(
  input: string,
): { owner: string; repo: string } | null {
  const cleaned = input.trim().replace(/\.git$/, "").replace(/\/$/, "");

  // https://github.com/owner/repo or github.com/owner/repo
  const urlMatch = cleaned.match(
    /(?:https?:\/\/)?github\.com\/([^/]+)\/([^/]+)/,
  );
  if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2] };

  // owner/repo shorthand
  const shortMatch = cleaned.match(
    /^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/,
  );
  if (shortMatch) return { owner: shortMatch[1], repo: shortMatch[2] };

  return null;
}

/** Fetch repo metadata (default branch) — 1 API call */
export async function fetchRepoInfo(
  owner: string,
  repo: string,
): Promise<RepoInfo> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
  if (!res.ok) {
    if (res.status === 404)
      throw new Error("Repository not found. Make sure it's a public repo.");
    if (res.status === 403)
      throw new Error("GitHub rate limit hit. Try again in a minute.");
    throw new Error(`GitHub API error: ${res.status}`);
  }
  const data = await res.json();
  return { owner, repo, defaultBranch: data.default_branch };
}

/** Fetch the full file tree — 1 API call */
export async function fetchRepoTree(
  owner: string,
  repo: string,
  branch: string,
): Promise<GitHubFile[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
  );
  if (!res.ok) throw new Error(`Failed to fetch repository tree: ${res.status}`);
  const data = await res.json();

  if (data.truncated) {
    console.warn("Repository tree was truncated — very large repo");
  }

  return (data.tree as any[])
    .filter((item) => item.type === "blob")
    .map((item) => ({
      path: item.path as string,
      size: (item.size ?? 0) as number,
      sha: item.sha as string,
    }));
}

/** Fetch raw file content from raw.githubusercontent.com — NOT rate-limited */
export async function fetchFileContent(
  owner: string,
  repo: string,
  branch: string,
  path: string,
): Promise<string> {
  const res = await fetch(
    `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}/${path}`,
  );
  if (!res.ok) throw new Error(`Failed to fetch file: ${path}`);
  return res.text();
}

// ---------------------------------------------------------------------------
// File filtering
// ---------------------------------------------------------------------------

const SCANNABLE_EXTENSIONS = new Set([
  // Systems / low-level
  ".c", ".h", ".cpp", ".hpp", ".cc", ".cxx", ".rs", ".go", ".zig",
  // Web / scripting
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".py", ".rb", ".php", ".java", ".scala", ".kt",
  // Config / infra
  ".yaml", ".yml", ".toml", ".json", ".xml",
  ".tf", ".hcl", ".sql",
  ".sh", ".bash", ".zsh",
  // Smart contracts
  ".sol",
]);

const SKIP_DIRS = new Set([
  "node_modules", ".git", "vendor", "dist", "build", ".next",
  "__pycache__", ".venv", "venv", "target", ".cargo",
  "coverage", ".nyc_output", ".turbo", ".cache",
  "assets", "static", "public", "images", "fonts",
  ".github", ".vscode", ".idea",
]);

const SKIP_FILES = new Set([
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
  "composer.lock", "Cargo.lock", "Gemfile.lock",
  "poetry.lock", "go.sum",
]);

/** Filter to security-relevant source files and cap at maxFiles */
export function filterScannableFiles(
  files: GitHubFile[],
  maxFiles: number = 30,
): GitHubFile[] {
  return files
    .filter((f) => {
      if (f.size > 100_000) return false;
      const name = f.path.split("/").pop() ?? "";
      if (SKIP_FILES.has(name)) return false;
      if (f.path.split("/").some((p) => SKIP_DIRS.has(p))) return false;
      const ext = "." + name.split(".").pop()?.toLowerCase();
      return SCANNABLE_EXTENSIONS.has(ext);
    })
    .sort((a, b) => a.size - b.size)
    .slice(0, maxFiles);
}
