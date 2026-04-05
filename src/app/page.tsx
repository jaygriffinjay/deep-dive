import { H1, Paragraph } from "@/components/typography";
import { siteConfig } from "@/site-config";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4">
      <H1 className="text-5xl font-bold tracking-tight"> Hello World</H1>
    </div>
  );
}
