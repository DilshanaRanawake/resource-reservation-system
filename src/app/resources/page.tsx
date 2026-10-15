import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState, LoadingState } from "@/components/states";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { setResourceActive } from "./actions";

export default function ResourcesPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="Resources"
        description="Rooms and equipment that can be reserved."
        actions={<Button nativeButton={false} render={<Link href="/resources/new" />}>New resource</Button>}
      />
      <Suspense fallback={<LoadingState label="Loading resources…" />}>
        <ResourceList />
      </Suspense>
    </section>
  );
}

async function ResourceList() {
  await connection();
  const resources = await prisma.resource.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  if (resources.length === 0) {
    return (
      <EmptyState title="No resources yet">
        <Button nativeButton={false} render={<Link href="/resources/new" />}>Create a resource</Button>
      </EmptyState>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {resources.map((resource) => (
        <li key={resource.id}>
          <Card className="h-full bg-white shadow-sm ring-[#e2e5ea]">
            <CardHeader>
              <CardTitle>{resource.name}</CardTitle>
              <CardAction>
                {resource.active ? (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </CardAction>
            </CardHeader>
            <CardFooter className="flex flex-wrap gap-2 bg-white">
              <Button variant="outline" nativeButton={false} render={<Link href={`/calendar?resource=${resource.id}`} />}>
                Calendar
              </Button>
              <Button variant="outline" nativeButton={false} render={<Link href={`/resources/${resource.id}/edit`} />}>
                Edit
              </Button>
              <form action={setResourceActive.bind(null, resource.id, !resource.active)}>
                <SubmitButton
                  idle={resource.active ? "Deactivate" : "Activate"}
                  pending="Saving…"
                  className="inline-flex h-8 items-center justify-center rounded-lg border bg-background px-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                />
              </form>
            </CardFooter>
          </Card>
        </li>
      ))}
    </ul>
  );
}
