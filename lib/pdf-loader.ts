import PDFParser from 'pdf2json';

export function parsePdf(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1); // 1 = text content only

        // @ts-ignore
        pdfParser.on("pdfParser_dataError", (errData: any) => {
            console.error(errData.parserError);
            reject(errData.parserError);
        });

        // @ts-ignore
        pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
            // pdf2json returns URL-encoded text in v1.x, but let's check structure
            // Actually, with option 1 (text), dataReady returns raw text content usually in 'formImage'
            // But the Cleanest way is to use getRawTextContent() if available or extract from Pages

            try {
                // pdf2json output structure is complex. simpler way:
                const rawText = pdfParser.getRawTextContent();
                resolve(rawText);
            } catch (e) {
                // Fallback for different versions
                try {
                    let text = "";
                    // @ts-ignore
                    pdfData.Pages.forEach((page: any) => {
                        // @ts-ignore
                        page.Texts.forEach((t: any) => {
                            // @ts-ignore
                            t.R.forEach((r: any) => {
                                text += decodeURIComponent(r.T) + " ";
                            });
                        });
                        text += "\n";
                    });
                    resolve(text);
                } catch (err) {
                    reject(err);
                }
            }
        });

        pdfParser.parseBuffer(buffer);
    });
}
