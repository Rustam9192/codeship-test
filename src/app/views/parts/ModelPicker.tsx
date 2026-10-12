import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PublicModelType } from "@/types/chat/publicModelType";

/**
 * Switches the provider for the next reply without clearing the conversation.
 */
export function ModelPicker({
  models,
  selectedModelId,
  disabled,
  onChange,
}: {
  models: PublicModelType[];
  selectedModelId: string;
  disabled: boolean;
  onChange: (modelId: string) => void;
}) {
  const selected = models.find((model) => model.id === selectedModelId);

  return (
    <Select
      value={selectedModelId}
      disabled={disabled || models.length === 0}
      onValueChange={(value) => {
        if (typeof value === "string") onChange(value);
      }}
    >
      <SelectTrigger className="w-44 sm:w-56" aria-label="Model">
        <SelectValue placeholder="Choose a model">
          {selected ? (
            <span className="truncate">
              {selected.providerLabel}
              {!selected.available ? " (no key)" : ""}
            </span>
          ) : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem
            key={model.id}
            value={model.id}
            disabled={!model.available}
          >
            <span className="flex flex-col items-start">
              <span>{model.providerLabel}</span>
              <span className="text-xs text-muted-foreground">
                {model.description}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
