"use client";

import { useFormToast } from "@/components/use-form-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { initialActionState } from "@/lib/validation";
import { useActionState } from "react";
import { cancelReservation } from "./actions";

export function CancelReservationForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(cancelReservation, initialActionState);
  useFormToast(state);

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" type="button" />}>
        Cancel
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this reservation?</DialogTitle>
          <DialogDescription>
            The booking stays in the list as cancelled, and the time can be reserved again.
          </DialogDescription>
        </DialogHeader>
        {state.formError ? <p className="text-sm text-destructive">{state.formError}</p> : null}
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Cancelling…" : "Cancel booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
