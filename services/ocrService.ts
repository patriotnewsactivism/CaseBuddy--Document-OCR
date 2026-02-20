import Tesseract from 'tesseract.js';
import { ExtractedData } from '../types';

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
    const result = await Tesseract.recognize(file, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    const rawText = result.data.text.trim();
    
    if (!rawText) {
      throw new Error("No text could be extracted from the document.");
    }

    const confidenceScore = Math.round(result.data.confidence);
    
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
