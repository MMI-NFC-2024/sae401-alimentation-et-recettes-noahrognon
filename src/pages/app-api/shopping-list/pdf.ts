import type { APIRoute } from 'astro';
import { getShoppingList } from '../../../lib/pocketbase';

export const prerender = false;

function getBearerToken(request: Request) {
	const authHeader = request.headers.get('Authorization') ?? '';
	const match = authHeader.match(/^Bearer\s+(.+)$/i);
	return match?.[1] ?? '';
}

function sanitizePdfText(value: string) {
	return String(value)
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[()\\]/g, '')
		.replace(/[^\x20-\x7E]/g, ' ');
}

function buildPdf(lines: string[]) {
	const contentLines = ['BT', '/F1 12 Tf', '40 800 Td', '16 TL'];
	lines.forEach((line, index) => {
		if (index === 0) {
			contentLines.push(`(${sanitizePdfText(line)}) Tj`);
		} else {
			contentLines.push('T*');
			contentLines.push(`(${sanitizePdfText(line)}) Tj`);
		}
	});
	contentLines.push('ET');
	const stream = contentLines.join('\n');

	const objects = [
		'1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
		'2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
		'3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
		'4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
		`5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
	];

	let pdf = '%PDF-1.4\n';
	const offsets = [0];
	for (const object of objects) {
		offsets.push(pdf.length);
		pdf += `${object}\n`;
	}

	const xrefPosition = pdf.length;
	pdf += `xref\n0 ${objects.length + 1}\n`;
	pdf += '0000000000 65535 f \n';
	for (let index = 1; index < offsets.length; index += 1) {
		pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
	}
	pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;
	return new TextEncoder().encode(pdf);
}

export const GET: APIRoute = async ({ request, url }) => {
	try {
		const userToken = getBearerToken(request);
		if (!userToken) {
			return new Response('Session utilisateur manquante.', { status: 401 });
		}

		const date = url.searchParams.get('date') ?? undefined;
		const shoppingList = await getShoppingList(userToken, date);
		const lines = [
			`Liste de courses - ${shoppingList.week.label}`,
			'',
			...shoppingList.groups.flatMap((group) => [
				`${group.category} (${group.checkedCount}/${group.totalCount})`,
				...group.items.map((item) => `${item.isChecked ? '[x]' : '[ ]'} ${item.nom} - ${item.displayQuantity}`),
				'',
			]),
		];

		const pdfBytes = buildPdf(lines);
		return new Response(pdfBytes, {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="liste-courses-${shoppingList.week.start}.pdf"`,
			},
		});
	} catch {
		return new Response('Impossible de générer le PDF.', { status: 500 });
	}
};
