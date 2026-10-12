"use client";

import type { CitationType } from "@/types/chat/chatMessageType";

/**
 * Passages the answer was grounded on, so the reader can check the source.
 */
export function CitationList({ citations }: { citations: CitationType[] }) {
  return (
    <section className="mt-4 border-t border-foreground/10 pt-3">
      <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">Sources</p>
      <ol className="mt-2 flex flex-col gap-3">
        {citations.map((citation, index) => (
          <li key={`${citation.fileName}-${citation.title}-${index}`}>
            <p className="text-xs">
              <span className="font-medium">{citation.fileName}</span>
              <span className="text-muted-foreground"> · {citation.title}</span>
            </p>
            <p className="mt-1 line-clamp-3 font-heading text-sm leading-5 text-muted-foreground italic">
              {citation.excerpt}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
