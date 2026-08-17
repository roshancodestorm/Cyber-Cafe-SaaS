export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="admin-page -m-4 md:-m-6 p-4 md:p-6 min-h-screen"
      style={{ background: "var(--admin-bg)" }}
    >
      {children}
    </div>
  );
}
