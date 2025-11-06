import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Allowed hostnames for security (avoid open proxy)
const ALLOWED_HOSTS = new Set([
  'drive.google.com',
  'docs.google.com',
  'googleusercontent.com', // redirects often land here
  'content.googleapis.com',
]);

function isAllowed(url: URL) {
  return (
    (url.protocol === 'http:' || url.protocol === 'https:') &&
    ([...ALLOWED_HOSTS].some(h => url.hostname === h || url.hostname.endsWith(`.${h}`)))
  );
}

function toDirectDriveUrl(src: string): string {
  try {
    const url = new URL(src);
    // Convert /file/d/{id}/view to direct uc download
    if (url.hostname.includes('drive.google.com') || url.hostname.includes('docs.google.com')) {
      const match1 = url.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      const match2 = url.search.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      const id = (match1 && match1[1]) || (match2 && match2[1]);
      if (id) {
        return `https://drive.google.com/uc?export=download&id=${id}`;
      }
    }
  } catch {}
  return src;
}

export async function GET(request: Request) {
  try {
    const reqUrl = new URL(request.url);
    const srcParam = reqUrl.searchParams.get('src');
    if (!srcParam) {
      return NextResponse.json({ error: 'Missing src parameter' }, { status: 400 });
    }

    // Normalize Google Drive file links to direct form
    const normalizedSrc = toDirectDriveUrl(srcParam);

    let target: URL;
    try {
      target = new URL(normalizedSrc);
    } catch {
      return NextResponse.json({ error: 'Invalid src URL' }, { status: 400 });
    }

    if (!isAllowed(target)) {
      return NextResponse.json({ error: 'Host not allowed' }, { status: 400 });
    }

    const clientRange = request.headers.get('range');
    const isDrive = target.hostname.includes('drive.google.com') || target.hostname.includes('docs.google.com');

    // Build headers for first attempt. For Drive, avoid Range on first request
    const baseHeaders: HeadersInit = {
      'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0',
      'Referer': 'https://drive.google.com/',
      'Accept': '*/*',
    };

    const firstHeaders: HeadersInit = { ...baseHeaders };
    if (!isDrive && clientRange) firstHeaders['Range'] = clientRange;

    // First attempt
    let finalUrl: URL = target;
    let res = await fetch(target, {
      headers: firstHeaders,
      redirect: 'follow',
    });

    // Google Drive confirm flow handling
    const ct0 = res.headers.get('content-type') || '';
    if (
      isDrive &&
      ct0.includes('text/html') &&
      (target.pathname.startsWith('/uc') || target.pathname.startsWith('/file'))
    ) {
      try {
        const html = await res.text();
        // capture cookies to reuse in confirm request
        let cookieHeader = '';
        try {
          const raw = (res.headers as any).raw?.();
          const setCookies: string[] | undefined = raw ? raw['set-cookie'] : undefined;
          const merged = setCookies && setCookies.length ? setCookies : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie') as string] : []);
          if (merged && merged.length) {
            const pairs = merged.map(v => v.split(';')[0]).filter(Boolean);
            cookieHeader = pairs.join('; ');
          }
        } catch {}
        // Try to extract both confirm token and id from HTML links
        let confirm: string | null = null;
        let id: string | null = null;
        const hrefMatch = html.match(/href=\"[^\"]*confirm=([0-9A-Za-z_-]+)[^\"]*id=([0-9A-Za-z_-]+)/);
        if (hrefMatch) {
          confirm = hrefMatch[1];
          id = hrefMatch[2];
        } else {
          const confirmMatch = html.match(/confirm=([0-9A-Za-z_-]+)/);
          const idMatch = html.match(/id=([0-9A-Za-z_-]+)/) || target.search.match(/id=([0-9A-Za-z_-]+)/);
          confirm = confirmMatch ? confirmMatch[1] : null;
          id = idMatch ? (Array.isArray(idMatch) ? idMatch[1] : null) : null;
        }

        if (confirm && id) {
          const confirmUrl = new URL('https://drive.google.com/uc');
          confirmUrl.searchParams.set('export', 'download');
          confirmUrl.searchParams.set('id', id);
          confirmUrl.searchParams.set('confirm', confirm);
          finalUrl = confirmUrl;
          // Now fetch the actual binary; if client asked for Range, use it here
          const secondHeaders: HeadersInit = { ...baseHeaders };
          if (clientRange) secondHeaders['Range'] = clientRange;
          if (cookieHeader) (secondHeaders as any)['Cookie'] = cookieHeader;
          res = await fetch(confirmUrl, {
            headers: secondHeaders,
            redirect: 'follow',
          });
        }
      } catch {
        // Fall through
      }
    }

    // If Drive and client requested Range but we didn't use it yet (e.g., first response already binary),
    // re-fetch with Range to support seeking correctly
    const ctAfter = res.headers.get('content-type') || '';
    const isBinary = ctAfter.startsWith('audio/') || ctAfter === 'application/octet-stream' || ctAfter.includes('video/mp4');
    if (isDrive && clientRange && isBinary) {
      // Ensure we use the most up-to-date URL (finalUrl)
      const rangedHeaders: HeadersInit = { ...baseHeaders, Range: clientRange };
      // Try to preserve cookies if we had them
      try {
        const raw = (res.headers as any).raw?.();
        const setCookies: string[] | undefined = raw ? raw['set-cookie'] : undefined;
        const merged = setCookies && setCookies.length ? setCookies : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie') as string] : []);
        if (merged && merged.length) {
          const pairs = merged.map(v => v.split(';')[0]).filter(Boolean);
          (rangedHeaders as any)['Cookie'] = pairs.join('; ');
        }
      } catch {}
      res = await fetch(finalUrl, { headers: rangedHeaders, redirect: 'follow' });
    }

    // Prepare response headers (whitelist only what the client needs)
    const outHeaders = new Headers();
    const passthrough = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
      'last-modified',
    ];
    for (const h of passthrough) {
      const v = res.headers.get(h);
      if (v) outHeaders.set(h, v);
    }
    // Ensure Accept-Ranges for seek UI
    if (!outHeaders.has('accept-ranges')) outHeaders.set('accept-ranges', 'bytes');
    // Avoid caches interfering with Range streaming
    outHeaders.set('cache-control', 'no-store');

    // Improve content-type for common Drive downloads when it is octet-stream
    const cd = res.headers.get('content-disposition') || '';
    const ct = outHeaders.get('content-type') || '';
    const filenameMatch = cd.match(/filename\*=UTF-8''([^;\r\n]+)|filename=\"?([^;\r\n\"]+)/);
    const filename = filenameMatch ? (filenameMatch[1] || filenameMatch[2]) : '';
    if ((!ct || ct === 'application/octet-stream') && filename) {
      const lower = filename.toLowerCase();
      if (lower.endsWith('.m4a') || lower.endsWith('.mp4')) {
        outHeaders.set('content-type', 'audio/mp4');
      } else if (lower.endsWith('.mp3')) {
        outHeaders.set('content-type', 'audio/mpeg');
      } else if (lower.endsWith('.wav')) {
        outHeaders.set('content-type', 'audio/wav');
      } else if (lower.endsWith('.ogg')) {
        outHeaders.set('content-type', 'audio/ogg');
      } else if (lower.endsWith('.aac')) {
        outHeaders.set('content-type', 'audio/aac');
      }
    }

    // Stream body through
    return new NextResponse(res.body, {
      status: res.status,
      headers: outHeaders,
    });
  } catch (err) {
    console.error('Audio proxy error:', err);
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}
