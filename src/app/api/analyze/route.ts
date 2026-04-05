import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { fileContent, filePath, apiKey, provider, model, repoContext } = body;

  if (!apiKey || !fileContent || !filePath) {
    return new Response("Missing required fields", { status: 400 });
  }

  const systemPrompt = `You are a senior security researcher performing a thorough source code audit. You are an expert at finding security vulnerabilities, logic bugs, and potential exploits.

Analyze the provided source code file carefully. Look for:
- Memory safety issues (buffer overflows, use-after-free, etc.)
- Injection vulnerabilities (SQL, XSS, command injection, SSRF, etc.)
- Authentication/authorization flaws
- Race conditions and TOCTOU bugs
- Cryptographic misuse
- Logic errors that could be exploited
- Input validation issues
- Information disclosure

For each finding, format as:

### [SEVERITY] Title
**Line:** approximate line number
**Description:** clear explanation of the vulnerability
**Recommendation:** how to fix it

Where SEVERITY is one of: CRITICAL, HIGH, MEDIUM, LOW, INFO

Be thorough but concise. If a file has no meaningful security issues, briefly explain why the file looks safe. Do NOT fabricate issues — only report real concerns.`;

  const userPrompt = `Repository: ${repoContext}
File: ${filePath}

\`\`\`
${fileContent}
\`\`\`

Analyze this file for security vulnerabilities.`;

  if (provider === "anthropic") {
    return proxyAnthropic(apiKey, model || "claude-sonnet-4-6", systemPrompt, userPrompt);
  }
  return proxyOpenAI(apiKey, model || "gpt-4o", systemPrompt, userPrompt);
}

// ---------------------------------------------------------------------------
// Anthropic proxy
// ---------------------------------------------------------------------------

async function proxyAnthropic(apiKey: string, model: string, system: string, user: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
      stream: true,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    return new Response(error, { status: res.status });
  }

  return new Response(transformAnthropicStream(res.body!), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function transformAnthropicStream(body: ReadableStream<Uint8Array>) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (
                parsed.type === "content_block_delta" &&
                parsed.delta?.text
              ) {
                controller.enqueue(encoder.encode(parsed.delta.text));
              }
            } catch {
              // skip non-JSON lines
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });
}

// ---------------------------------------------------------------------------
// OpenAI proxy
// ---------------------------------------------------------------------------

async function proxyOpenAI(apiKey: string, model: string, system: string, user: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      stream: true,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    return new Response(error, { status: res.status });
  }

  return new Response(transformOpenAIStream(res.body!), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function transformOpenAIStream(body: ReadableStream<Uint8Array>) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            } catch {
              // skip non-JSON lines
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });
}
