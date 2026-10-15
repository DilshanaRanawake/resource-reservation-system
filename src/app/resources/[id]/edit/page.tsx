import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { z } from "zod";
import { LoadingState } from "@/components/states";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { setResourceActive, updateResource } from "../../actions";
import { ResourceForm } from "../../resource-form";

export default function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<LoadingState label="Loading resource…" />}>
      <EditResource params={params} />
    </Suspense>
  );
}

async function EditResource({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const parsedId = z.uuid().safeParse(id);

  if (!parsedId.success) {
    notFound();
  }

  const resource = await prisma.resource.findUnique({
    where: { id: parsedId.data },
  });

  if (!resource) {
    notFound();
  }

  return (
    <section className="space-y-8">
      <PageHeader
        title="Edit resource"
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
        <CardContent className="space-y-6">
          <ResourceForm
            action={updateResource}
            submitLabel="Save changes"
            resource={{ id: resource.id, name: resource.name }}
          />
          <form action={setResourceActive.bind(null, resource.id, !resource.active)}>
            <SubmitButton
              idle={resource.active ? "Deactivate" : "Activate"}
              pending="Saving…"
              className="inline-flex h-8 items-center justify-center rounded-lg border bg-background px-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
            />
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
