import { getPaste } from "@/lib/redis";
import Link from "next/link";

type PageProps = {
  params: {
    id: string;
  };
};

export default async function PastePage({ params }: PageProps) {
  const paste = await getPaste(params.id);

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
      <h1>Paste: {params.id}</h1>
      <p>
        <strong>Remaining Views:</strong>{' '}
        {paste.viewsLeft >= 0 ? paste.viewsLeft : '∞'}
      </p>

      <p>
        <strong>Expires At:</strong>{' '}
        {new Date(paste.expiresAt).toLocaleString()}
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
