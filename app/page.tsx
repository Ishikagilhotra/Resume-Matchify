'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, ArrowRight, Loader2, Copy, Check, X, TrendingUp, AlertCircle, Sparkles, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import type { AnalysisResult } from '@/lib/types';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzeLoading, setIsAnalyzeLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const startAnalysis = async () => {
    if (!file || !jobDescription) return;
    setIsAnalyzeLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobDescription', jobDescription);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || errorData.details || 'Analysis failed');
      }

      const data = await response.json();
      console.log('Analysis result received:', data);
      console.log('Has tailoredResume:', !!data.tailoredResume, 'Length:', data.tailoredResume?.length);
      setResult(data);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
    } finally {
      setIsAnalyzeLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result?.tailoredResume) return;
    try {
      await navigator.clipboard.writeText(result.tailoredResume);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadPDF = async () => {
    // Double check before proceeding
    if (!result?.tailoredResume || !file) {
      console.warn('Download PDF called but missing data:', { 
        hasResult: !!result, 
        hasTailoredResume: !!result?.tailoredResume,
        hasFile: !!file 
      });
      return; // Button should be disabled, but just in case
    }
    setIsGeneratingPDF(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('originalPdf', file);
      formData.append('tailoredResume', result.tailoredResume);

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || errorData.details || 'PDF generation failed');
      }

      // Check if response is actually a PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        const text = await response.text();
        console.error('Unexpected response:', text);
        throw new Error('Server returned non-PDF response');
      }

      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tailored-${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.';
      setError(`PDF Generation Error: ${errorMessage}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setError(null);
    setFile(null);
    setJobDescription('');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8 flex flex-col items-center justify-center font-sans">
      <div className="max-w-6xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            AI Resume Sculptor
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Tailor your resume to any job description in seconds. Optimize for ATS, identify skill gaps, and stand out.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          {/* File Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col h-full"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Upload Resume</h2>
            </div>

            <div
              className={clsx(
                "flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-colors duration-200 cursor-pointer text-center",
                file ? "border-green-500 bg-green-50 dark:bg-green-900/10" : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              )}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
              />

              {file ? (
                <div className="space-y-3">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[250px]">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500">Click to change</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="font-medium text-gray-700 dark:text-gray-200">
                    Click or drag resume PDF here
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Unknown format? Just use PDF.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Job Description Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col h-full"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Job Description</h2>
            </div>

            <textarea
              className="flex-1 w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none min-h-[200px]"
              placeholder="Paste the job requirements, responsibilities, and qualifications here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </motion.div>
        </div>

        {/* Action Bar */}
        {!result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center pt-8"
          >
            <button
              onClick={startAnalysis}
              disabled={!file || !jobDescription.trim() || isAnalyzeLoading}
              className={clsx(
                "flex items-center space-x-3 px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0",
                (!file || !jobDescription.trim() || isAnalyzeLoading)
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
              )}
            >
              {isAnalyzeLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Analyzing Matches...</span>
                </>
              ) : (
                <>
                  <span>Sculpt My Resume</span>
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-800 dark:text-red-200 font-medium">Error</p>
                <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results View */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-6"
            >
              {/* Score and Summary */}
              <div className="grid md:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">ATS Score</h3>
                  </div>
                  <div className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    {result.score}/100
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{result.explanation}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Matching Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.presentSkills.length > 0 ? (
                      result.presentSkills.slice(0, 5).map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">None identified</span>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Missing Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.missingSkills.length > 0 ? (
                      result.missingSkills.slice(0, 5).map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">None identified</span>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Tailored Resume */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tailored Resume</h2>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        console.log('Download button clicked', {
                          hasResult: !!result,
                          resultKeys: result ? Object.keys(result) : [],
                          hasTailoredResume: !!result?.tailoredResume,
                          tailoredResumeType: typeof result?.tailoredResume,
                          tailoredResumeLength: result?.tailoredResume?.length,
                          hasFile: !!file,
                          fileName: file?.name,
                          fullResult: result
                        });
                        downloadPDF();
                      }}
                      disabled={isGeneratingPDF || !result || !result.tailoredResume || !file || result.tailoredResume.trim() === ''}
                      className={clsx(
                        "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium",
                        (isGeneratingPDF || !result || !result.tailoredResume || !file || (result?.tailoredResume?.trim() === ''))
                          ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      )}
                      title={
                        isGeneratingPDF 
                          ? "Generating PDF..." 
                          : !result 
                            ? "Please complete the analysis first" 
                            : !result.tailoredResume || result.tailoredResume.trim() === ''
                              ? "No tailored resume content available. The AI may not have generated it. Please try the analysis again." 
                              : !file 
                                ? "Original file is missing" 
                                : "Download tailored resume PDF"
                      }
                    >
                      {isGeneratingPDF ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Download PDF</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={resetAnalysis}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                      New Analysis
                    </button>
                  </div>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  {result.tailoredResume ? (
                    <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100 font-sans">
                      {result.tailoredResume}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p className="mb-2">Tailored resume content is being generated...</p>
                      <p className="text-sm">If this message persists, the AI may not have generated the content. Please try the analysis again.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
