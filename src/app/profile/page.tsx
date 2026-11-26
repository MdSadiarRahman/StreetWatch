import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ProfileWorkspace } from "@/components/account/ProfileWorkspace";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/login?callbackUrl=/profile");
  }

  return <ProfileWorkspace />;
}
