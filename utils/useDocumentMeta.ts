import { useEffect } from 'react';

const SITE_NAME = 'HEADZ Hair Fixing App';
const SITE_ORIGIN = 'https://headz.international';
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/logo.png`;

export interface DocumentMeta {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function setNamedMeta(name: string, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('name', name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setPropertyMeta(property: string, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(href: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

const ROUTE_JSON_LD_ID = 'route-json-ld';

function setRouteJsonLd(data: DocumentMeta['jsonLd']): void {
  document.querySelectorAll(`script[data-id="${ROUTE_JSON_LD_ID}"]`).forEach((el) => el.remove());

  if (!data) return;

  const items = Array.isArray(data) ? data : [data];
  for (const item of items) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-id', ROUTE_JSON_LD_ID);
    script.textContent = JSON.stringify(item);
    document.head.appendChild(script);
  }
}

export function useDocumentMeta(meta: DocumentMeta): void {
  const { title, description, path, ogImage, ogType, jsonLd } = meta;

  useEffect(() => {
    const url = `${SITE_ORIGIN}${path}`;
    const image = ogImage ?? DEFAULT_OG_IMAGE;
    const type = ogType ?? 'website';

    document.title = title;
    setNamedMeta('description', description);
    setCanonical(url);

    setPropertyMeta('og:site_name', SITE_NAME);
    setPropertyMeta('og:type', type);
    setPropertyMeta('og:url', url);
    setPropertyMeta('og:title', title);
    setPropertyMeta('og:description', description);
    setPropertyMeta('og:image', image);

    setNamedMeta('twitter:card', 'summary_large_image');
    setNamedMeta('twitter:title', title);
    setNamedMeta('twitter:description', description);
    setNamedMeta('twitter:image', image);

    setRouteJsonLd(jsonLd);
  }, [title, description, path, ogImage, ogType, jsonLd]);
}
