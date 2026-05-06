/**
 * POST /api/upload — Proxy multipart form uploads to provider upload endpoints.
 * Phase 9: Build upload API route
 *
 * Accepts multipart/form-data with:
 *   - file: the uploaded image file
 *   - provider: 'openai' | 'google' | 'replicate' | 'muapi'
 *
 * API key is read from:
 *   - Header `x-api-key` (preferred — stored client-side in localStorage)
 *   - Falls back to the Authorization header as a bearer token
 */
import { NextResponse } from 'next/server';
import type { ProviderName } from '@/lib/providers/types';

export const runtime = 'nodejs';

const PROVIDER_ENDPOINTS: Record<ProviderName, string> = {
  openai: 'https://api.openai.com/v1/images/uploads',
  google: 'https://storage.googleapis.com/upload/storage/v1/b/{bucket}/o',
  replicate: 'https://api.replicate.com/v0/files/upload',
  muapi: 'https://api.muapi.ai/v1/upload',
};

export async function POST(request: Request) {
  try {
    // Parse multipart form data
    const formData = await request.formData();

    // Extract file
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Extract provider
    const provider = formData.get('provider') as ProviderName | null;
    if (!provider || !['openai', 'google', 'replicate', 'muapi'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid or missing provider. Must be one of: openai, google, replicate, muapi' },
        { status: 400 }
      );
    }

    // Read API key from headers
    const apiKey = (request.headers.get('x-api-key')
      ?? request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')) as string | null;

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key provided' }, { status: 401 });
    }

    // Build provider-specific request
    let url: string;
    let fetchOptions: RequestInit;

    switch (provider) {
      case 'openai': {
        // OpenAI images/uploads endpoint
        url = PROVIDER_ENDPOINTS.openai;
        const openaiFormData = new FormData();
        openaiFormData.append('file', file);
        openaiFormData.append('purpose', 'images');

        fetchOptions = {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          body: openaiFormData,
        };
        break;
      }

      case 'google': {
        // Google Cloud Storage multipart upload
        // Bucket must be provided in FormData as 'bucket', or use env var as fallback
        const bucket = (formData.get('bucket') as string | null)
          ?? process.env.GOOGLE_STORAGE_BUCKET
          ?? 'dark-factory-uploads';

        url = `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?uploadType=multipart`;

        // GCS multipart: metadata + file in multipart/related body
        // Build multipart manually to include the JSON metadata part
        const boundary = `----FormBoundary${Date.now()}`;
        const objectName = file.name || `upload_${Date.now()}`;
        const metadataJson = JSON.stringify({ name: objectName, contentType: file.type });
        const metadataBytes = new TextEncoder().encode(metadataJson);
        const fileBytes = await file.arrayBuffer();

        // Multipart body: metadata part followed by file data
        const body = new Uint8Array(
          metadataBytes.length + 2 + boundary.length + 2 + fileBytes.byteLength
        );
        let offset = 0;
        // Metadata part header
        body.set(new TextEncoder().encode(`--${boundary}\r\n`), offset);
        offset += boundary.length + 2;
        body.set(new TextEncoder().encode(`Content-Type: application/json; charset=utf-8\r\n\r\n`), offset);
        offset += 46;
        body.set(metadataBytes, offset);
        offset += metadataBytes.length;
        body.set(new TextEncoder().encode(`\r\n--${boundary}\r\n`), offset);
        offset += boundary.length + 4;
        // File part header
        body.set(new TextEncoder().encode(`Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`), offset);
        offset += file.type.length + 35;
        body.set(new Uint8Array(fileBytes), offset);

        fetchOptions = {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: body.buffer,
        };
        break;
      }

      case 'replicate': {
        // Replicate file upload
        url = PROVIDER_ENDPOINTS.replicate;
        const replicateFormData = new FormData();
        replicateFormData.append('file', file);

        fetchOptions = {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          body: replicateFormData,
        };
        break;
      }

      case 'muapi': {
        // Muapi upload
        url = PROVIDER_ENDPOINTS.muapi;
        const muapiFormData = new FormData();
        muapiFormData.append('file', file);

        fetchOptions = {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          body: muapiFormData,
        };
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
    }

    // Forward request to provider
    const response = await fetch(url, fetchOptions);

    // Read response body
    const contentType = response.headers.get('Content-Type') || '';
    let result: Record<string, unknown>;

    if (contentType.includes('application/json')) {
      result = await response.json() as Record<string, unknown>;
    } else {
      const text = await response.text();
      result = { raw: text };
    }

    // Add status info
    result._status = response.status;
    result._provider = provider;

    if (!response.ok) {
      return NextResponse.json(
        { error: result.error ?? result.message ?? `Upload failed with status ${response.status}`, details: result },
        { status: 502 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
