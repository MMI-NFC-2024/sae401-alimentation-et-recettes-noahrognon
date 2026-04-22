import type { APIRoute } from 'astro';

export const prerender = false;

const siteUrl = 'https://nutrivia.noahrognon.fr';

const staticPages = [
	{ path: '/', priority: '1.0', changefreq: 'weekly' },
	{ path: '/recettes', priority: '0.95', changefreq: 'weekly' },
	{ path: '/aliments', priority: '0.85', changefreq: 'weekly' },
	{ path: '/regimes', priority: '0.85', changefreq: 'monthly' },
	{ path: '/professionnels', priority: '0.8', changefreq: 'weekly' },
	{ path: '/communaute', priority: '0.65', changefreq: 'weekly' },
	{ path: '/support', priority: '0.55', changefreq: 'monthly' },
	{ path: '/mentions-legales', priority: '0.2', changefreq: 'yearly' },
	{ path: '/politique-confidentialite', priority: '0.2', changefreq: 'yearly' },
	{ path: '/cgu', priority: '0.2', changefreq: 'yearly' },
	{ path: '/cookies', priority: '0.2', changefreq: 'yearly' },
];

function escapeXml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

export const GET: APIRoute = async () => {
	const lastmod = new Date().toISOString().slice(0, 10);
	const urls = staticPages
		.map(
			(page) => `
	<url>
		<loc>${escapeXml(new URL(page.path, siteUrl).toString())}</loc>
		<lastmod>${lastmod}</lastmod>
		<changefreq>${page.changefreq}</changefreq>
		<priority>${page.priority}</priority>
	</url>`,
		)
		.join('');

	return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
		},
	});
};
