import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const slug = req.query.slug as string;
    
    let html = '';
    
    try {
      // Use https in production, fallback to http in dev
      const protocol = req.headers['x-forwarded-proto'] || (req.headers.host?.includes('localhost') ? 'http' : 'https');
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      
      const response = await fetch(`${baseUrl}/index.html`);
      if (response.ok) {
        html = await response.text();
      } else {
        throw new Error(`Failed to fetch index.html: ${response.status}`);
      }
    } catch (e: any) {
      console.error("Could not fetch index.html", e);
      return res.status(500).send('Could not fetch base HTML: ' + e.message);
    }

    if (slug) {
      const prismaModule = await import('./_lib/prisma.js');
      const prisma = prismaModule.prisma;
      
      const frame = await prisma.frame.findUnique({
        where: { slug }
      });

      if (frame) {
        // Replace title
        html = html.replace(/<title>.*?<\/title>/is, `<title>${frame.title} - RCHG Studio</title>`);
        
        // Replace og:title
        html = html.replace(/<meta property="og:title" content="[^"]*" \/?>/is, `<meta property="og:title" content="${frame.title}" />`);
        
        // Replace og:image
        html = html.replace(/<meta property="og:image" content="[^"]*" \/?>/is, `<meta property="og:image" content="${frame.imageUrl}" />`);
        
        // Replace twitter:title
        html = html.replace(/<meta property="twitter:title" content="[^"]*" \/?>/is, `<meta property="twitter:title" content="${frame.title}" />`);
        
        // Replace twitter:image
        html = html.replace(/<meta property="twitter:image" content="[^"]*" \/?>/is, `<meta property="twitter:image" content="${frame.imageUrl}" />`);
      }
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).send(html);
  } catch (error: any) {
    console.error('Frame OG Error:', error);
    return res.status(500).send('Internal Server Error: ' + error.message);
  }
}
