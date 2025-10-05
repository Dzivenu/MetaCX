export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Portal-specific layout wrapper */}
      <div style={{ minHeight: "100vh" }}>{children}</div>
    </div>
  );
}
