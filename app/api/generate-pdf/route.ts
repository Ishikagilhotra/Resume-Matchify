import { NextRequest, NextResponse } from 'next/server';
import { editResumePDF } from '@/lib/pdf-editor';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const originalPdf = formData.get('originalPdf') as File | null;
        const tailoredResume = formData.get('tailoredResume') as string | null;

        if (!originalPdf || !tailoredResume) {
            return NextResponse.json(
                { error: 'Missing original PDF or tailored resume content' },
                { status: 400 }
            );
        }

        const arrayBuffer = await originalPdf.arrayBuffer();
        const pdfBytes = await editResumePDF(arrayBuffer, tailoredResume);

        // Convert Uint8Array to Buffer for Next.js response
        const buffer = Buffer.from(pdfBytes);

        // Return the PDF as a response
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="tailored-resume.pdf"`,
            },
        });
    } catch (error) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

