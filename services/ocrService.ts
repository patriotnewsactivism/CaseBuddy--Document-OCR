import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { ExtractedData } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const pdfToImages = async (file: File): Promise<Blob[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images: Blob[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 2;
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
    });
    images.push(blob);
  }
  
  return images;
};

const extractDates = (text: string): string[] => {
  const datePatterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b/gi,
    /\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b/gi,
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
  ];
  
  const dates = new Set<string>();
  datePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    matches?.forEach(m => dates.add(m));
  });
  
  return Array.from(dates);
};

const extractNames = (text: string): string[] => {
  const namePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g;
  const matches = text.match(namePattern) || [];
  const commonWords = new Set(['The', 'This', 'That', 'Dear', 'From', 'Your', 'Dear', 'Sincerely', 'Yours', 'Very', 'Best', 'Regards']);
  
  return Array.from(new Set(matches))
    .filter(name => !commonWords.has(name.split(' ')[0]))
    .slice(0, 10);
};

const extractCaseNumbers = (text: string): string[] => {
  const casePatterns = [
    /\bCase\s*(?:No\.?|Number|#)?\s*[:\s]?\s*[A-Z0-9\-\/]+\b/gi,
    /\bDocket\s*(?:No\.?|Number|#)?\s*[:\s]?\s*[A-Z0-9\-\/]+\b/gi,
    /\b(?:CV|CR|CIV|CRIM|ADM)\s*[-\s]?\s*\d{2,4}[-\s]?\d{1,5}\b/gi,
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  ];
  
  const caseNumbers = new Set<string>();
  casePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    matches?.forEach(m => caseNumbers.add(m.trim()));
  });
  
  return Array.from(caseNumbers);
};

const generateSummary = (text: string): string => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  if (sentences.length === 0) return "No readable content extracted from the document.";
  
  const firstSentences = sentences.slice(0, 3).map(s => s.trim()).join('. ');
  return firstSentences.length > 200 
    ? firstSentences.substring(0, 200) + '...' 
    : firstSentences + '.';
};

export const performOCR = async (file: File): Promise<ExtractedData> => {
  try {
    let imagesToProcess: Blob[] = [];
    
    if (file.type === 'application/pdf') {
      console.log('Converting PDF to images...');
      imagesToProcess = await pdfToImages(file);
    } else {
      imagesToProcess = [file];
    }
    
    let allText = '';
    let totalConfidence = 0;
    
    for (let i = 0; i < imagesToProcess.length; i++) {
      console.log(`Processing page ${i + 1}/${imagesToProcess.length}...`);
      
      const result = await Tesseract.recognize(imagesToProcess[i], 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress (page ${i + 1}): ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      allText += result.data.text + '\n\n';
      totalConfidence += result.data.confidence;
    }
    
    const rawText = allText.trim();
    
    if (!rawText) {
      throw new Error("No text could be extracted from the document.");
    }

    const confidenceScore = Math.round(totalConfidence / imagesToProcess.length);
    
    return {
      rawText,
      summary: generateSummary(rawText),
      entities: {
        dates: extractDates(rawText),
        names: extractNames(rawText),
        caseNumbers: extractCaseNumbers(rawText),
      },
      confidenceScore,
    };

  } catch (error) {
    console.error("OCR Failed:", error);
    throw new Error("Failed to process document. Please ensure the document contains readable text.");
  }
};
