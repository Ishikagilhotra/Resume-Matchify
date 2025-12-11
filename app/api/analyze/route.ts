import { NextRequest, NextResponse } from 'next/server';
import { parsePdf } from '@/lib/pdf-loader';
import { groq } from '@ai-sdk/groq';
import { generateObject } from 'ai';
import { z } from 'zod';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('resume') as File | null;
        const jobDescription = formData.get('jobDescription') as string | null;

        if (!file || !jobDescription) {
            return NextResponse.json(
                { error: 'Missing resume or job description' },
                { status: 400 }
            );
        }

        console.log("Starting analysis...");
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log("Parsing PDF...");
        let resumeText = "";
        try {
            resumeText = await parsePdf(buffer);
            console.log("PDF Parsed successfully. Text length:", resumeText.length);
        } catch (pdfError) {
            console.error("PDF Parsing failed:", pdfError);
            return NextResponse.json(
                { error: 'PDF Parsing Failed', details: String(pdfError) },
                { status: 500 }
            );
        }

        // Schema for structured output
        const schema = z.object({
            score: z.number().min(0).max(100).describe("ATS Score from 0 to 100 based on match"),
            explanation: z.string().describe("Brief explanation of the score"),
            missingSkills: z.array(z.string()).describe("List of critical skills missing from resume but present in JD"),
            presentSkills: z.array(z.string()).describe("List of matching skills present in both"),
            tailoredResume: z.string().describe("Markdown tailored version of the resume highlighting keywords and improving bullets")
        });

        const result = await generateObject({
            model: groq('meta-llama/llama-4-scout-17b-16e-instruct'),
            system: "You are an expert Resume Sculptor and ATS Optimizer. Your goal is to maximize the candidate's chances by tailoring their resume to the specific job description.",
            prompt: `
      Analyze the following Resume against the Job Description.
      
      RESUME CONTENT:
      ${resumeText}
      
      JOB DESCRIPTION:
      ${jobDescription}
      
      Instructions:
      1. Compare skills and experience.
      2. Provide a match score (0-100).
      3. List missing and matching skills.
      4. CRITICAL: Rewrite the resume content to align with the JD, effectively using keywords.
      
      STRICT RULES FOR TAILORED RESUME:
      - PRESERVE THE EXACT STRUCTURE AND SECTIONS from the original resume - use ONLY the sections that exist in the original
      - DO NOT add any new sections that don't exist in the original (e.g., if there's no "Experience" section, DO NOT add one)
      - DO NOT add a "Summary" section if it doesn't exist in the original
      - Keep the EXACT same section order as the original resume
      - When adding missing skills, integrate them into the EXISTING Technical Skills section - do NOT create a separate "Missing Skills" section
      - Add missing skills naturally alongside existing skills in the same format and style
      - Enhance existing bullet points in Projects section with relevant keywords from the job description
      - Maintain the same formatting style (use ** for bold text in markdown)
      - The tailoredResume field MUST contain the complete rewritten resume in markdown format with ONLY the sections from the original resume
      - Make it a complete, professional resume ready to use, following the original template exactly
      `,
            schema: schema,
        });

        const responseData = result.object;
        
        // Validate that tailoredResume exists and is not empty
        if (!responseData.tailoredResume || responseData.tailoredResume.trim() === '') {
            console.warn('Warning: tailoredResume is empty or missing from AI response');
            console.log('Full response object keys:', Object.keys(responseData));
        }
        
        return NextResponse.json(responseData);

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
