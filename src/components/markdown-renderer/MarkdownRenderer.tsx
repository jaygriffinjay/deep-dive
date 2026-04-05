import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import {
  H1, H2, H3, H4, H5, H6,
  Paragraph,
  Blockquote,
  List,
  ListItem,
  InlineCode,
  Link,
  Bold,
  Italic,
  Strikethrough,
} from "@/components/typography";
import { Separator } from "@/components/ui/separator";
import styles from "./markdown-renderer.module.css";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn(styles.root, className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <H1>{children}</H1>,
          h2: ({ children }) => <H2>{children}</H2>,
          h3: ({ children }) => <H3>{children}</H3>,
          h4: ({ children }) => <H4>{children}</H4>,
          h5: ({ children }) => <H5>{children}</H5>,
          h6: ({ children }) => <H6>{children}</H6>,
          p: ({ children }) => <Paragraph>{children}</Paragraph>,
          blockquote: ({ children }) => <Blockquote>{children}</Blockquote>,
          hr: () => <Separator className={styles.divider} />,
          ul: ({ children }) => <List>{children}</List>,
          ol: ({ children }) => <List ordered>{children}</List>,
          li: ({ children }) => <ListItem>{children}</ListItem>,
          a: ({ href, children }) => (
            <Link href={href ?? "#"} target={href?.startsWith("http") ? "_blank" : undefined}>
              {children}
            </Link>
          ),
          strong: ({ children }) => <Bold>{children}</Bold>,
          em: ({ children }) => <Italic>{children}</Italic>,
          del: ({ children }) => <Strikethrough>{children}</Strikethrough>,
          img: ({ src, alt }) =>
            typeof src !== "string" ? null : (
              <span className={styles.imageWrapper}>
                <NextImage
                  src={src}
                  alt={alt ?? ""}
                  width={0}
                  height={0}
                  sizes="100vw"
                  className={styles.image}
                />
                {alt && <span className={styles.imageCaption}>{alt}</span>}
              </span>
            ),
          pre: ({ children }) => {
            const child = Array.isArray(children) ? children[0] : children;
            const props = (child as React.ReactElement<{ className?: string; children?: React.ReactNode }>)?.props;
            if (!props) return <pre className={styles.pre}>{children}</pre>;
            const lang = /language-(\w+)/.exec(props.className ?? "")?.[1];
            const code = String(props.children ?? "").replace(/\n$/, "");
            return (
              <pre className={styles.pre} data-language={lang}>
                <code>{code}</code>
              </pre>
            );
          },
          code: ({ children }) => <InlineCode>{children}</InlineCode>,
          table: ({ children }) => (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>{children}</table>
            </div>
          ),
          th: ({ children }) => <th className={styles.th}>{children}</th>,
          td: ({ children }) => <td className={styles.td}>{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
