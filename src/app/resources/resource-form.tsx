"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type ActionState, initialActionState } from "@/lib/validation";

type ResourceFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  resource?: { id: string; name: string };
};

export function ResourceForm({ action, submitLabel, resource }: ResourceFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const toasted = useRef(state);

  useEffect(() => {
    if (toasted.current === state) {
      return;
    }
    toasted.current = state;
    if (state.success) {
      toast.success(state.success);
      router.push("/resources");
    } else if (state.formError) {
      toast.error(state.formError);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      {resource ? <input type="hidden" name="id" value={resource.id} /> : null}
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={resource?.name ?? ""}
          aria-invalid={state.fieldErrors?.name ? true : undefined}
          aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
        />
        {state.fieldErrors?.name ? (
          <p id="name-error" className="text-sm text-destructive">
            {state.fieldErrors.name}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
