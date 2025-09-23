// Dynamic import to prevent Node.js 18 boot crash
// import ogs from 'open-graph-scraper';
import urlRegex from 'url-regex';
import { URL } from 'url';

export interface LinkPreview {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
}

function isValidPublicUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Block localhost and loopback
    if (['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname)) {
      return false;
    }
    
    // Block private IP ranges and special addresses
    const hostname = parsedUrl.hostname;
    
    // IPv4 private ranges and special addresses
    const privatePatterns = [
      /^10\./,                    // 10.0.0.0/8
      /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
      /^192\.168\./,              // 192.168.0.0/16
      /^169\.254\./,              // Link-local (AWS metadata)
      /^0\./,                     // 0.0.0.0/8
      /^224\./,                   // Multicast
      /^fe80:/i,                  // IPv6 link-local
      /^fc00:/i,                  // IPv6 unique local
      /^ff00:/i,                  // IPv6 multicast
    ];
    
    return !privatePatterns.some(pattern => pattern.test(hostname));
  } catch {
    return false;
  }
}

function isYouTubeUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    return (
      (hostname === 'youtube.com' || hostname === 'www.youtube.com') && parsedUrl.pathname === '/watch' && parsedUrl.searchParams.has('v')
    ) || 
    (hostname === 'youtu.be' && parsedUrl.pathname.length > 1);
  } catch {
    return false;
  }
}

async function extractYouTubePreview(url: string): Promise<LinkPreview | null> {
  try {
    // Use YouTube's oEmbed API for better video-specific data
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(oEmbedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreview/1.0)'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as any;
    
    return {
      url,
      title: data.title,
      description: `Watch "${data.title}" on YouTube`,
      image: data.thumbnail_url,
      siteName: 'YouTube',
    };
  } catch (error) {
    console.error('Error extracting YouTube preview:', error);
    return null;
  }
}

export async function extractLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    // Validate URL format
    if (!urlRegex({ exact: true }).test(url)) {
      // If it doesn't have a protocol, add https://
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
    }

    // Validate again after adding protocol
    if (!urlRegex({ exact: true }).test(url)) {
      return null;
    }

    // SSRF Protection: Block private/internal URLs
    if (!isValidPublicUrl(url)) {
      console.warn('Blocked potentially dangerous URL:', url);
      return null;
    }

    // Check if this is a YouTube URL and handle it specifically
    if (isYouTubeUrl(url)) {
      const youtubePreview = await extractYouTubePreview(url);
      if (youtubePreview) {
        return youtubePreview;
      }
      // If YouTube-specific extraction fails, fall back to generic scraping
    }

    // Dynamic import for Node.js 18 compatibility
    const { default: ogs } = await import('open-graph-scraper');
    const { result } = await ogs({
      url,
      timeout: 5000,
    });

    // Extract the most relevant data
    const preview: LinkPreview = {
      url,
      title: result.ogTitle || result.twitterTitle || result.dcTitle,
      description: result.ogDescription || result.twitterDescription || result.dcDescription,
      image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url,
      siteName: result.ogSiteName || result.twitterSite || extractDomainName(url),
    };

    // Clean up description length
    if (preview.description && preview.description.length > 200) {
      preview.description = preview.description.substring(0, 197) + '...';
    }

    return preview;
  } catch (error) {
    console.error('Error extracting link preview:', error);
    return null;
  }
}

function extractDomainName(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, '');
  } catch {
    return 'External Link';
  }
}

export function isValidUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    // Add protocol if missing
    const urlToTest = url.startsWith('http') ? url : 'https://' + url;
    new URL(urlToTest);
    return urlRegex({ exact: true }).test(urlToTest) && isValidPublicUrl(urlToTest);
  } catch {
    return false;
  }
}