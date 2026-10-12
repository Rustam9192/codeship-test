import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * Question box. Enter sends; Shift+Enter inserts a line break.
 */
export function ChatComposer({
  disabled,
  onSend,
}: {
  disabled: boolean;
  onSend: (text: string) => void;
}) {
  return (
    <form
      className="px-4 pt-2 pb-5 sm:px-8"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const field = form.elements.namedItem("question");
        if (!(field instanceof HTMLTextAreaElement)) return;
        const text = field.value;
        field.value = "";
        onSend(text);
      }}
    >
      <div className="flex items-end gap-2 rounded-[24px] bg-background/80 p-2 shadow-lg">
        <Textarea
          name="question"
          placeholder="Write a question in the margin"
          disabled={disabled}
          rows={2}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <Button type="submit" disabled={disabled} className="mb-1 px-5">
          Send
        </Button>
      </div>
    </form>
  );
}
