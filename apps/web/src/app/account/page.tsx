import { AccountPage } from "@/components/workspace/account";
export const metadata = { title: "Account" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ signin?: string }>;
}) {
  return (
    <AccountPage signinFailed={(await searchParams).signin === "failed"} />
  );
}
