import {
  indexHtml,
  apiReferenceHtml,
  architectureHtml,
  x402Html,
  stylesCss,
} from './docs-content';

const docsPages: Record<string, {content: string; type: string}> = {
  '/docs': { content: indexHtml, type: 'text/html' },
  '/docs/': { content: indexHtml, type: 'text/html' },
  '/docs/index.html': { content: indexHtml, type: 'text/html' },
  '/docs/api-reference.html': { content: apiReferenceHtml, type: 'text/html' },
  '/docs/architecture.html': { content: architectureHtml, type: 'text/html' },
  '/docs/x402.html': { content: x402Html, type: 'text/html' },
  '/docs/styles.css': { content: stylesCss, type: 'text/css' },
};

export async function handleDocs(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    let path = url.pathname;

    // Normalize path
    if (path.endsWith('/') && path !== '/docs/') {
      path = path.slice(0, -1);
    }

    const page = docsPages[path];
    if (!page) {
      return new Response('Page not found', { status: 404 });
    }

    return new Response(page.content, {
      status: 200,
      headers: {
        'Content-Type': page.type + '; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    return new Response(`Error serving docs: ${error.message}`, { status: 500 });
  }
}
