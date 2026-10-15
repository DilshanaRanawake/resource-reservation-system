"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setCurrentUser } from "@/app/current-user-action";

export function UserSwitcher({
  users,
  currentId,
}: {
  users: Array<{ id: string; name: string }>;
  currentId: string | null;
}) {
  const [pending, startTransition] = useTransition();

  if (!currentId) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm font-semibold text-white sm:inline">Current user</span>
      <Select
        items={Object.fromEntries(users.map((user) => [user.id, user.name]))}
        value={currentId}
        disabled={pending}
        onValueChange={(value) => {
          if (!value) {
            return;
          }
          startTransition(() => {
            void setCurrentUser(value);
          });
        }}
      >
        <SelectTrigger className="w-44 bg-white text-[#1f2933] sm:w-52" aria-label="Current user">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
