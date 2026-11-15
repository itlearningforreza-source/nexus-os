import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nexus OS — The Company Operating System",
  description:
    "One Platform. One Workspace. One Company Operating System. Everything your company needs in a single, powerful platform.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}