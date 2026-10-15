import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createResource } from "../actions";
import { ResourceForm } from "../resource-form";

export default function NewResourcePage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="New resource"
        actions={
          <Link href="/resources" className="text-sm font-semibold text-[#1e3a8a] hover:underline">
            Back to resources
          </Link>
        }
      />
      <Card className="max-w-lg bg-white shadow-sm ring-[#e2e5ea]">
        <CardHeader>
          <CardTitle>Resource details</CardTitle>
        </CardHeader>
        <CardContent>
          <ResourceForm action={createResource} submitLabel="Create resource" />
        </CardContent>
      </Card>
    </section>
  );
}
