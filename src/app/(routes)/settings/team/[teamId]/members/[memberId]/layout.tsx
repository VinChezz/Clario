export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 space-y-8">{children}</div>
  );
}
