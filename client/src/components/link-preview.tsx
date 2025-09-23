import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface LinkPreviewProps {
  link: string;
  linkTitle?: string | null;
  linkDescription?: string | null;
  linkImage?: string | null;
  linkSiteName?: string | null;
  compact?: boolean;
}

export default function LinkPreview({ 
  link, 
  linkTitle, 
  linkDescription, 
  linkImage, 
  linkSiteName,
  compact = false 
}: LinkPreviewProps) {
  if (!link) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card 
      className="mt-3 hover:bg-muted/30 transition-colors cursor-pointer border-border/50"
      onClick={handleClick}
      data-testid="link-preview"
    >
      <CardContent className="p-0">
        <div className={`flex ${compact ? 'flex-row' : linkImage ? 'flex-col sm:flex-row' : 'flex-row'}`}>
          {/* Image */}
          {linkImage && (
            <div className={`${compact ? 'w-32 h-24 sm:w-36 sm:h-28 flex-shrink-0 overflow-hidden rounded-l-lg' : 'w-full sm:w-56 md:w-72 lg:w-80 flex-shrink-0'}`}>
              {compact ? (
                <img
                  src={linkImage}
                  alt={linkTitle || 'Link preview'}
                  className="w-full h-full object-cover rounded-l-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  data-testid="link-image"
                />
              ) : (
                <div className="overflow-hidden sm:rounded-l-lg sm:rounded-tr-none rounded-t-lg">
                  <AspectRatio ratio={16/9} className="bg-muted">
                    <img
                      src={linkImage}
                      alt={linkTitle || 'Link preview'}
                      className="w-full h-full object-cover rounded-lg transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                      data-testid="link-image"
                    />
                  </AspectRatio>
                </div>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className={`${compact ? 'p-3 min-w-0 flex-1' : 'p-3 flex-1'} ${linkImage ? '' : 'border-l-2 border-primary/20'}`}>
            {/* Site name */}
            {linkSiteName && (
              <div className="text-xs text-muted-foreground mb-1" data-testid="link-site-name">
                {linkSiteName}
              </div>
            )}
            
            {/* Title */}
            <h4 className={`font-medium text-foreground ${compact ? 'text-sm line-clamp-1' : 'text-sm sm:text-base line-clamp-2'} mb-1`} data-testid="link-title">
              {linkTitle || new URL(link).hostname}
            </h4>
            
            {/* Description */}
            {linkDescription && (
              <p className={`text-muted-foreground ${compact ? 'text-xs line-clamp-1' : 'text-xs sm:text-sm line-clamp-2'} mb-2`} data-testid="link-description">
                {linkDescription}
              </p>
            )}
            
            {/* URL */}
            <div className="flex items-center text-xs text-muted-foreground">
              <ExternalLink className="h-3 w-3 mr-1" />
              <span className="truncate" data-testid="link-url">
                {new URL(link).hostname}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}