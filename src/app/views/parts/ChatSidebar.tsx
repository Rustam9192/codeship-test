"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ConversationType } from "@/lib/redux/slices/session/types";

/**
 * Lists saved conversations and starts another without discarding the rest.
 */
export function ChatSidebar({
  conversations,
  activeConversationId,
  disabled,
  onStart,
  onSelect,
  onRemove,
}: {
  conversations: ConversationType[];
  activeConversationId: string;
  disabled: boolean;
  onStart: () => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <aside className="flex max-h-56 w-full flex-col rounded-[28px] bg-card/70 p-3 shadow-sm md:max-h-none md:min-h-[calc(100dvh-2rem)] md:w-72 md:shrink-0">
      <Button type="button" className="w-full" disabled={disabled} onClick={onStart}>
        New conversation
      </Button>
      <ScrollArea className="mt-3 min-h-0 flex-1">
        <ul className="flex flex-col gap-1 pr-2">
          {conversations.map((chat) => {
            const selected = chat.id === activeConversationId;
            return (
              <li key={chat.id} className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={disabled}
                  aria-current={selected ? "true" : undefined}
                  className={
                    selected
                      ? "min-w-0 flex-1 truncate rounded-2xl bg-background px-3 py-2 text-left text-sm shadow-sm"
                      : "min-w-0 flex-1 truncate rounded-2xl px-3 py-2 text-left text-sm text-muted-foreground hover:bg-background/70 hover:text-foreground"
                  }
                  onClick={() => onSelect(chat.id)}
                >
                  {chat.title}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  aria-label={`Remove ${chat.title}`}
                  onClick={() => onRemove(chat.id)}
                >
                  <X />
                </Button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </aside>
  );
}
