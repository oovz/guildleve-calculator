import { redirect } from "next/navigation";

// For static export, the root / index.html is needed.
// Since we can't detect headers server-side in export, we redirect to default.
export default function RootPage() {
  redirect('/en');
}
