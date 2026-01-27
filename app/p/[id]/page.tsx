import { NextRequest } from 'next/server';
import { getPasteAndIncrement, pasteToResponse } from '@/lib/paste';

/**
 * GET /p/:id
 * 
 * View a paste in HTML format (increments view count).
 */
export default async function ViewPaste({
  params,
  request,
}: {
  params: Promise<{ id: string }>;
  request: NextRequest;
}) {
  const { id } = await params;

  let paste;
  try {
    paste = await getPasteAndIncrement(id, request);
  } catch (error) {
    console.error('Error retrieving paste:', error);
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <h1>Error</h1>
        <p>An unexpected error occurred while retrieving the paste.</p>
      </div>
    );
  }

  if (!paste) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <h1>Paste Not Found</h1>
        <p>This paste does not exist, has expired, or exceeded its view limit.</p>
      </div>
    );
  }

  const response = pasteToResponse(paste);

  // Escape HTML to prevent XSS
  const escapedContent = paste.content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1>Paste: {id}</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', color: '#666' }}>
          {response.remaining_views !== null && (
            <div>
              <strong>Remaining Views:</strong> {response.remaining_views}
            </div>
          )}
          {response.expires_at !== null && (
            <div>
              <strong>Expires At:</strong> {new Date(response.expires_at).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
        <code>{escapedContent}</code>
      </pre>

      <div style={{ marginTop: '2rem' }}>
        <a href="/" style={{ color: '#1976d2', textDecoration: 'none' }}>
          ← Create New Paste
        </a>
      </div>
    </div>
  );
}
