import { Badge } from "@/components/ui/badge";

const label = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
} as const;

export function StatusBadge({ status }: { status: keyof typeof label }) {
  if (status === "confirmed") {
    return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
  }

  if (status === "cancelled") {
    return <Badge variant="destructive">Cancelled</Badge>;
  }

  return <Badge variant="secondary">{label[status]}</Badge>;
}
