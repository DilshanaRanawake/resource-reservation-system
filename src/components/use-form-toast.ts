"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/validation";

export function useFormToast(state: ActionState) {
  const toasted = useRef(state);

  useEffect(() => {
    if (toasted.current === state) {
      return;
    }

    toasted.current = state;

    if (state.success) {
      toast.success(state.success);
    } else if (state.formError) {
      toast.error(state.formError);
    }
  }, [state]);
}
