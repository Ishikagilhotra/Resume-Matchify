import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function editResumePDF(
  originalPdfBuffer: ArrayBuffer,
  tailoredResume: string
): Promise<Uint8Array> {
  try {
    // Load the original PDF
    const pdfDoc = await PDFDocument.load(originalPdfBuffer);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  // Get fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Remove all existing pages and create new ones
  const pageCount = pdfDoc.getPageCount();
  for (let i = pageCount - 1; i >= 0; i--) {
    pdfDoc.removePage(i);
  }

  // Create new pages with tailored content
  const margin = 50;
  const topMargin = 30; // Reduced top margin to remove excessive white space
  const maxWidth = width - 2 * margin;
  let currentPage = pdfDoc.addPage([width, height]);
  let yPosition = height - topMargin; // Start closer to the top
  const lineHeight = 12;
  const sectionSpacing = 25; // Increased spacing between major sections
  const subsectionSpacing = 15; // Spacing for subsections
  const fontSize = 10.5;
  const headerFontSize = 18; // Larger, more prominent section headers
  const subHeaderFontSize = 14;
  const nameFontSize = 20; // For name at top

  // Parse markdown content
  const lines = tailoredResume.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      // Empty lines - add small spacing
      yPosition -= lineHeight * 0.8;
      continue;
    }

    // Check if we need a new page
    if (yPosition < margin + lineHeight) {
      currentPage = pdfDoc.addPage([width, height]);
      yPosition = height - topMargin;
    }

    // Handle headers with clean formatting and proper spacing
    if (line.startsWith('###')) {
      // Subsection header (e.g., project names, school names)
      yPosition -= subsectionSpacing;
      const text = line.replace(/^###\s*/, '').replace(/\*\*/g, ''); // Remove any ** from headers
      currentPage.drawText(text, {
        x: margin,
        y: yPosition,
        size: subHeaderFontSize,
        font: helveticaBoldFont,
        color: rgb(0, 0, 0), // Black for better readability
      });
      yPosition -= lineHeight * 1.8;
    } else if (line.startsWith('##')) {
      // Major section header (e.g., EDUCATION, TECHNICAL SKILLS)
      yPosition -= sectionSpacing;
      const text = line.replace(/^##\s*/, '').replace(/\*\*/g, '').toUpperCase(); // Uppercase for section headers
      currentPage.drawText(text, {
        x: margin,
        y: yPosition,
        size: headerFontSize,
        font: helveticaBoldFont,
        color: rgb(0, 0, 0), // Black, bold, prominent
      });
      yPosition -= lineHeight * 2.2; // More space after major sections
    } else if (line.startsWith('#')) {
      // Name or main title
      yPosition -= sectionSpacing * 1.5;
      const text = line.replace(/^#\s*/, '').replace(/\*\*/g, '');
      currentPage.drawText(text, {
        x: margin,
        y: yPosition,
        size: nameFontSize,
        font: helveticaBoldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight * 2.5;
    }
    // Handle bullet points (with potential bold text inside)
    else if (line.match(/^[-*]\s+/)) {
      const bulletText = line.replace(/^[-*]\s+/, '');
      const bulletX = margin + 10;
      
      // Draw bullet
      currentPage.drawText('•', {
        x: margin,
        y: yPosition,
        size: fontSize,
        font: helveticaFont,
      });

      // Process bold text within bullet points
      if (bulletText.includes('**')) {
        const parts = bulletText.split(/(\*\*.*?\*\*)/g);
        let xPos = bulletX;
        let lineY = yPosition;
        let needsNewLine = false;

        for (const part of parts) {
          if (part.startsWith('**') && part.endsWith('**')) {
            // Bold text
            const boldText = part.replace(/\*\*/g, '');
            const textWidth = helveticaBoldFont.widthOfTextAtSize(boldText, fontSize);
            
            // Check if we need to wrap
            if (xPos + textWidth > width - margin && xPos > bulletX) {
              lineY -= lineHeight;
              xPos = bulletX;
              if (lineY < margin + lineHeight) {
                currentPage = pdfDoc.addPage([width, height]);
                lineY = height - topMargin;
              }
            }
            
            currentPage.drawText(boldText, {
              x: xPos,
              y: lineY,
              size: fontSize,
              font: helveticaBoldFont,
            });
            xPos += textWidth;
          } else if (part.trim()) {
            // Regular text - handle word wrapping
            const words = part.split(' ');
            for (const word of words) {
              const testText = word;
              const textWidth = helveticaFont.widthOfTextAtSize(testText, fontSize);
              
              // Check if we need to wrap
              if (xPos + textWidth > width - margin && xPos > bulletX) {
                lineY -= lineHeight;
                xPos = bulletX;
                if (lineY < margin + lineHeight) {
                  currentPage = pdfDoc.addPage([width, height]);
                  lineY = height - topMargin;
                }
              }
              
              // Add space before word if not at start of line
              if (xPos > bulletX) {
                const spaceWidth = helveticaFont.widthOfTextAtSize(' ', fontSize);
                currentPage.drawText(' ', {
                  x: xPos,
                  y: lineY,
                  size: fontSize,
                  font: helveticaFont,
                });
                xPos += spaceWidth;
              }
              
              currentPage.drawText(word, {
                x: xPos,
                y: lineY,
                size: fontSize,
                font: helveticaFont,
              });
              xPos += textWidth;
            }
          }
        }
        yPosition = lineY - lineHeight;
      } else {
        // Check if text contains labels ending with colon (e.g., "Programming Languages:", "Tools:")
        // Make labels bold
        const colonIndex = bulletText.indexOf(':');
        if (colonIndex > 0) {
          // Split into label (before colon) and content (after colon)
          const label = bulletText.substring(0, colonIndex + 1); // Include the colon
          const content = bulletText.substring(colonIndex + 1).trim();
          
          let xPos = bulletX;
          let lineY = yPosition;
          
          // Draw label in bold
          const labelWidth = helveticaBoldFont.widthOfTextAtSize(label, fontSize);
          currentPage.drawText(label, {
            x: xPos,
            y: lineY,
            size: fontSize,
            font: helveticaBoldFont,
          });
          xPos += labelWidth;
          
          // Add space after colon if there's content
          if (content) {
            const spaceWidth = helveticaFont.widthOfTextAtSize(' ', fontSize);
            currentPage.drawText(' ', {
              x: xPos,
              y: lineY,
              size: fontSize,
              font: helveticaFont,
            });
            xPos += spaceWidth;
            
            // Draw content in regular font with wrapping
            const words = content.split(' ');
            for (const word of words) {
              const testText = word;
              const textWidth = helveticaFont.widthOfTextAtSize(testText, fontSize);
              
              // Check if we need to wrap
              if (xPos + textWidth > width - margin && xPos > bulletX) {
                lineY -= lineHeight;
                xPos = bulletX;
                if (lineY < margin + lineHeight) {
                  currentPage = pdfDoc.addPage([width, height]);
                  lineY = height - topMargin;
                }
              }
              
              // Add space before word if not at start of line
              if (xPos > bulletX) {
                const spaceWidth = helveticaFont.widthOfTextAtSize(' ', fontSize);
                currentPage.drawText(' ', {
                  x: xPos,
                  y: lineY,
                  size: fontSize,
                  font: helveticaFont,
                });
                xPos += spaceWidth;
              }
              
              currentPage.drawText(word, {
                x: xPos,
                y: lineY,
                size: fontSize,
                font: helveticaFont,
              });
              xPos += textWidth;
            }
          }
          yPosition = lineY - lineHeight;
        } else {
          // No colon, handle normally with wrapping
          const words = bulletText.split(' ');
          let currentLine = '';
          let lineY = yPosition;

          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const textWidth = helveticaFont.widthOfTextAtSize(testLine, fontSize);

            if (textWidth > maxWidth - 20 && currentLine) {
              currentPage.drawText(currentLine, {
                x: bulletX,
                y: lineY,
                size: fontSize,
                font: helveticaFont,
              });
              lineY -= lineHeight;
              currentLine = word;

              if (lineY < margin + lineHeight) {
                currentPage = pdfDoc.addPage([width, height]);
                lineY = height - topMargin;
              }
            } else {
              currentLine = testLine;
            }
          }

          if (currentLine) {
            currentPage.drawText(currentLine, {
              x: bulletX,
              y: lineY,
              size: fontSize,
              font: helveticaFont,
            });
          }

          yPosition = lineY - lineHeight;
        }
      }
    }
    // Handle bold text (**text**)
    else if (line.includes('**')) {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      let xPos = margin;

      for (const part of parts) {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.replace(/\*\*/g, '');
          currentPage.drawText(boldText, {
            x: xPos,
            y: yPosition,
            size: fontSize,
            font: helveticaBoldFont,
          });
          xPos += helveticaBoldFont.widthOfTextAtSize(boldText, fontSize);
        } else if (part.trim()) {
          currentPage.drawText(part, {
            x: xPos,
            y: yPosition,
            size: fontSize,
            font: helveticaFont,
          });
          xPos += helveticaFont.widthOfTextAtSize(part, fontSize);
        }
      }
      yPosition -= lineHeight;
    }
    // Regular text (may contain bold text)
    else {
      // Check if line contains bold text
      if (line.includes('**')) {
        // Process bold text with wrapping
        const parts = line.split(/(\*\*.*?\*\*)/g);
        let xPos = margin;
        let lineY = yPosition;

        for (const part of parts) {
          if (part.startsWith('**') && part.endsWith('**')) {
            // Bold text
            const boldText = part.replace(/\*\*/g, '');
            const textWidth = helveticaBoldFont.widthOfTextAtSize(boldText, fontSize);
            
            // Check if we need to wrap
            if (xPos + textWidth > width - margin && xPos > margin) {
              lineY -= lineHeight;
              xPos = margin;
              if (lineY < margin + lineHeight) {
                currentPage = pdfDoc.addPage([width, height]);
                lineY = height - topMargin;
              }
            }
            
            currentPage.drawText(boldText, {
              x: xPos,
              y: lineY,
              size: fontSize,
              font: helveticaBoldFont,
            });
            xPos += textWidth;
          } else if (part.trim()) {
            // Regular text - handle word wrapping
            const words = part.split(' ');
            for (const word of words) {
              const testText = word;
              const textWidth = helveticaFont.widthOfTextAtSize(testText, fontSize);
              
              // Check if we need to wrap
              if (xPos + textWidth > width - margin && xPos > margin) {
                lineY -= lineHeight;
                xPos = margin;
                if (lineY < margin + lineHeight) {
                  currentPage = pdfDoc.addPage([width, height]);
                  lineY = height - topMargin;
                }
              }
              
              // Add space before word if not at start of line
              if (xPos > margin) {
                const spaceWidth = helveticaFont.widthOfTextAtSize(' ', fontSize);
                currentPage.drawText(' ', {
                  x: xPos,
                  y: lineY,
                  size: fontSize,
                  font: helveticaFont,
                });
                xPos += spaceWidth;
              }
              
              currentPage.drawText(word, {
                x: xPos,
                y: lineY,
                size: fontSize,
                font: helveticaFont,
              });
              xPos += textWidth;
            }
          }
        }
        yPosition = lineY - lineHeight;
      } else {
        // No bold text, handle normally with wrapping
        const words = line.split(' ');
        let currentLine = '';
        let lineY = yPosition;

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = helveticaFont.widthOfTextAtSize(testLine, fontSize);

          if (textWidth > maxWidth && currentLine) {
            currentPage.drawText(currentLine, {
              x: margin,
              y: lineY,
              size: fontSize,
              font: helveticaFont,
            });
            lineY -= lineHeight;
            currentLine = word;

              if (lineY < margin + lineHeight) {
                currentPage = pdfDoc.addPage([width, height]);
                lineY = height - topMargin;
              }
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          currentPage.drawText(currentLine, {
            x: margin,
            y: lineY,
            size: fontSize,
            font: helveticaFont,
          });
        }

        yPosition = lineY - lineHeight;
      }
    }
  }

    // Return the PDF bytes
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error in editResumePDF:', error);
    throw new Error(`Failed to edit PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

