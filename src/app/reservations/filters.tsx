"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statuses = [
  { value: "all", label: "Any status" },
  { value: "confirmed", label: "Confirmed" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export function ReservationFilters({
  resources,
  values,
}: {
  resources: Array<{ id: string; name: string; active: boolean }>;
  values: { resource: string; date: string; status: string; q: string };
}) {
  const router = useRouter();
  const [resource, setResource] = useState(values.resource || "all");
  const [status, setStatus] = useState(values.status || "all");
  const [date, setDate] = useState(values.date);
  const [query, setQuery] = useState(values.q);

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (resource !== "all") {
      params.set("resource", resource);
    }
    if (status !== "all") {
      params.set("status", status);
    }
    if (date) {
      params.set("date", date);
    }
    if (query.trim()) {
      params.set("q", query.trim());
    }
    const search = params.toString();
    router.push(search ? `/reservations?${search}` : "/reservations");
  }

  return (
    <form
      onSubmit={apply}
      className="grid items-end gap-4 rounded-lg border border-[#e2e5ea] bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <label className="space-y-1.5 text-sm sm:col-span-2 lg:col-span-1">
        <span className="font-medium">Search</span>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Title"
        />
      </label>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium">Resource</span>
        <Select
          items={{
            all: "All resources",
            ...Object.fromEntries(
              resources.map((item) => [item.id, `${item.name}${item.active ? "" : " (inactive)"}`]),
            ),
          }}
          value={resource}
          onValueChange={(value) => setResource(value ?? "all")}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All resources</SelectItem>
            {resources.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
                {item.active ? "" : " (inactive)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium">Date (UTC)</span>
        <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </label>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium">Status</span>
        <Select
          items={Object.fromEntries(statuses.map((item) => [item.value, item.label]))}
          value={status}
          onValueChange={(value) => setStatus(value ?? "all")}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
        <Button type="submit">Apply</Button>
        <Button type="button" variant="outline" onClick={() => router.push("/reservations")}>
          Clear
        </Button>
      </div>
    </form>
  );
}
