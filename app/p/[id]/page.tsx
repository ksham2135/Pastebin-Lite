import { getPaste } from "@/lib/redis";
import Link from "next/link";

// Force dynamic rendering since we're reading from external service
export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PastePage({ params }: PageProps) {
  const { id } = await params;
  const paste = await getPaste(id);

  if (!paste) {
    return (
      <main style={{ padding: "2rem" }}>
        <h2>Paste not found</h2>
        <Link href="/">← Create New Paste</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Paste: {id}</h1>
      <p>
        <strong>Remaining Views:</strong>{' '}
        {paste.remaining_views !== null ? paste.remaining_views : '∞'}
      </p>

      <p>
        <strong>Expires At:</strong>{' '}
        {paste.expires_at ? new Date(paste.expires_at).toLocaleString() : 'Never'}
      </p>

      <pre
        style={{
          background: "#f5f5f5",
          padding: "1rem",
          marginTop: "1rem",
          whiteSpace: "pre-wrap",
        }}
      >
        {paste.content}
      </pre>

      <br />
      <Link href="/">← Create New Paste</Link>
    </main>
  );
}
