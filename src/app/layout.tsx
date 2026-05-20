// Minimal root layout. Each route group ((frontend), (payload)) declares its own
// <html>/<body>. Do not add html/body here or Payload's admin will nest tags.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
