import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { SettingsWorkspace } from "@/components/account/SettingsWorkspace";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/login?callbackUrl=/settings");
  }

  return <SettingsWorkspace initialTab={searchParams?.tab || "account"} />;
}
