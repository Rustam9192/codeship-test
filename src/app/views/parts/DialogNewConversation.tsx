"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type DialogNewConversationProps = {
  disabled: boolean;
  hasMessages: boolean;
  onConfirm: () => void;
};

/**
 * Confirms that a new conversation discards the one on screen.
 */
export function DialogNewConversation({
  disabled,
  hasMessages,
  onConfirm,
}: DialogNewConversationProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => {
          if (!hasMessages) {
            onConfirm();
            return;
          }
          setOpen(true);
        }}
      >
        New Conversation
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              The current conversation will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={() => {
                onConfirm();
                setOpen(false);
              }}
            >
              Remove conversation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
