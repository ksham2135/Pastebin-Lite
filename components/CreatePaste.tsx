'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePaste() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [ttlSeconds, setTtlSeconds] = useState('');
  const [maxViews, setMaxViews] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body: any = {
        content,
      };

      if (ttlSeconds) {
        body.ttl_seconds = parseInt(ttlSeconds, 10);
      }

      if (maxViews) {
        body.max_views = parseInt(maxViews, 10);
      }

      const response = await fetch('/api/pastes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create paste');
        return;
      }

      router.push(`/p/${data.id}`);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>Create a Paste</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="content">Content *</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={10}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label htmlFor="ttl">TTL (seconds)</label>
            <input
              id="ttl"
              type="number"
              value={ttlSeconds}
              onChange={(e) => setTtlSeconds(e.target.value)}
              min="1"
              placeholder="e.g., 3600"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div>
            <label htmlFor="maxViews">Max Views</label>
            <input
              id="maxViews"
              type="number"
              value={maxViews}
              onChange={(e) => setMaxViews(e.target.value)}
              min="1"
              placeholder="e.g., 10"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
        </div>

        {error && (
          <div style={{ color: '#d32f2f', marginBottom: '1rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !content.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            cursor: loading || !content.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !content.trim() ? 0.6 : 1,
          }}
        >
          {loading ? 'Creating...' : 'Create Paste'}
        </button>
      </form>
    </div>
  );
}
