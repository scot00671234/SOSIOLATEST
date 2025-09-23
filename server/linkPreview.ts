import ogs from 'open-graph-scraper';
import urlRegex from 'url-regex';

export interface LinkPreview {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
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
    return urlRegex({ exact: true }).test(urlToTest);
  } catch {
    return false;
  }
}