import { Helmet } from 'react-helmet-async';

const SITE = 'DexaGo — HRD Admin';

export function PageMeta({ title, description }: { title?: string; description?: string }) {
  const full = title ? `${title} · ${SITE}` : SITE;
  return (
    <Helmet>
      <title>{full}</title>
      {description ? <meta name="description" content={description} /> : null}
      <meta property="og:title" content={full} />
      {description ? <meta property="og:description" content={description} /> : null}
    </Helmet>
  );
}
