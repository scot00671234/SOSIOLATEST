import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SponsoredAd } from "@shared/schema";

interface SponsoredAdProps {
  ad: SponsoredAd;
}

export default function SponsoredAdComponent({ ad }: SponsoredAdProps) {
  const handleClick = () => {
    if (ad.link) {
      window.open(ad.link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className={`border-2 border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20 transition-all duration-200 ${ad.link ? 'hover:shadow-md cursor-pointer' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            Sponsored
          </Badge>
          {ad.link && (
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        
        <div onClick={ad.link ? handleClick : undefined}>
          <h3 className={`font-semibold text-lg mb-2 ${ad.link ? 'text-primary hover:underline' : 'text-foreground'}`}>
            {ad.title}
          </h3>
          
          {ad.body && (
            <p className="text-foreground mb-2 text-sm leading-relaxed">
              {ad.body}
            </p>
          )}
          
          {ad.link && (
            <p className="text-xs text-muted-foreground truncate">
              {ad.link}
            </p>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-orange-200 dark:border-orange-800">
          <span className="text-xs text-muted-foreground">
            {ad.impressionsServed.toLocaleString()} of {ad.impressionsPaid.toLocaleString()} impressions
          </span>
          <span className="text-xs text-muted-foreground">
            {Math.round(((ad.impressionsPaid - ad.impressionsServed) / ad.impressionsPaid) * 100)}% remaining
          </span>
        </div>
      </CardContent>
    </Card>
  );
}