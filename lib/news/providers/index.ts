import { GdeltProvider } from "@/lib/news/providers/GdeltProvider";
import { GoogleNewsRssProvider } from "@/lib/news/providers/GoogleNewsRssProvider";
import { PublicPageProvider } from "@/lib/news/providers/PublicPageProvider";
import { RssProvider } from "@/lib/news/providers/RssProvider";
import { SourceCoverageProvider } from "@/lib/news/providers/SourceCoverageProvider";
import { SitemapProvider } from "@/lib/news/providers/SitemapProvider";
import { TruthSocialProvider } from "@/lib/news/providers/TruthSocialProvider";
import type { NewsProvider } from "@/lib/news/providers/types";

export function getNewsProviders(): NewsProvider[] {
  return [
    new TruthSocialProvider(),
    new RssProvider(),
    new SitemapProvider(),
    new PublicPageProvider(),
    new GoogleNewsRssProvider(),
    new SourceCoverageProvider(),
    new GdeltProvider()
  ];
}
