"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useFormToast } from "@/components/use-form-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initialActionState, minimumReservationMinutes } from "@/lib/validation";
import { createReservation } from "./actions";

type Option = { id: string; name: string };

export function BookingForm({
  resources,
  user,
}: {
  resources: Option[];
  user: Option | null;
}) {
  const [state, formAction, pending] = useActionState(createReservation, initialActionState);
  useFormToast(state);
  const [timezoneOffsetMinutes, setTimezoneOffsetMinutes] = useState<number | null>(null);
  const [resourceId, setResourceId] = useState("");
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    setTimezoneOffsetMinutes(new Date().getTimezoneOffset());
  }, []);

  useEffect(() => {
    if (!state.success) {
      return;
    }
    setTitle("");
    setStartTime("");
    setEndTime("");
  }, [state.success]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="timezoneOffsetMinutes" value={timezoneOffsetMinutes ?? ""} />
      <input type="hidden" name="userId" value={user?.id ?? ""} />
      <div className="space-y-1.5">
        <label htmlFor="resourceId" className="text-sm font-medium">
          Resource
        </label>
        <Select
          items={Object.fromEntries(resources.map((resource) => [resource.id, resource.name]))}
          name="resourceId"
          value={resourceId || null}
          onValueChange={(value) => setResourceId(value ?? "")}
          required
        >
          <SelectTrigger id="resourceId" className="w-full" aria-invalid={Boolean(state.fieldErrors?.resourceId)}>
            <SelectValue placeholder="Choose a resource" />
          </SelectTrigger>
          <SelectContent>
            {resources.map((resource) => (
              <SelectItem key={resource.id} value={resource.id}>
                {resource.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.fieldErrors?.resourceId ? (
          <p className="text-sm text-destructive">{state.fieldErrors.resourceId}</p>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">
        Booking as <span className="font-medium text-foreground">{user?.name ?? "no one"}</span>.
        Change the current user in the header. There is no login.
      </p>
      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <Input
          id="title"
          name="title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-invalid={Boolean(state.fieldErrors?.title)}
        />
        {state.fieldErrors?.title ? (
          <p className="text-sm text-destructive">{state.fieldErrors.title}</p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="startTime" className="text-sm font-medium">
            Start
          </label>
          <Input
            id="startTime"
            name="startTime"
            type="datetime-local"
            required
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            aria-invalid={Boolean(state.fieldErrors?.startTime)}
          />
          {state.fieldErrors?.startTime ? (
            <p className="text-sm text-destructive">{state.fieldErrors.startTime}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="endTime" className="text-sm font-medium">
            End
          </label>
          <Input
            id="endTime"
            name="endTime"
            type="datetime-local"
            required
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            aria-invalid={Boolean(state.fieldErrors?.endTime)}
          />
          {state.fieldErrors?.endTime ? (
            <p className="text-sm text-destructive">{state.fieldErrors.endTime}</p>
          ) : null}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Times are entered in your local timezone and stored in UTC. Bookings must be at least{" "}
        {minimumReservationMinutes} minutes, start in the future, and cannot overlap a confirmed
        booking. A later booking may start when the previous one ends.
      </p>
      {state.formError ? <p className="text-sm text-destructive">{state.formError}</p> : null}
      <Button
        type="submit"
        disabled={pending || timezoneOffsetMinutes === null || resources.length === 0 || !user}
      >
        {pending ? "Booking…" : "Book resource"}
      </Button>
    </form>
  );
}
