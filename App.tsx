import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Summary, ChatMessage, StrategicAnalysis, Keyword, ReviewData, TrendAnalysis, DeepDiveAnalysis, PersonaComparison } from './types';
import { summarizeReviews, generateSampleReviews, askQuestionAboutReviews, getStrategicAnalysis, getTrendAnalysis, getDeepDiveAnalysis, getPersonaComparison, generateSuggestedQuestions, suggestSegmentColumn } from './services/geminiService';
import { SummaryCard } from './components/SummaryCard';
import { InsightsCard } from './components/InsightsCard';
import { TrendChart } from './components/TrendChart';
import { Chatbot } from './components/Chatbot';
import { DashboardMetrics } from './components/DashboardMetrics';
import { StrategicAnalysisCard } from './components/StrategicAnalysisCard';
import { HelpModal } from './components/HelpModal';
import { KeywordsCard } from './components/KeywordsCard';
import { TrendAnalysisReport } from './components/TrendAnalysisReport';
import { DeepDiveModal } from './components/DeepDiveModal';
import { PersonaComparisonReport } from './components/PersonaComparisonReport';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ThumbsUpIcon, ThumbsDownIcon, LightBulbIcon, SparklesIcon, UploadCloudIcon, MagicWandIcon, DownloadIcon, CopyIcon, CheckIcon, WrenchIcon, ChatBubbleIcon, TargetIcon, QuestionMarkCircleIcon, CompareIcon, TrashIcon, InfoIcon } from './components/Icons';

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 5;
const MAX_TEXT_LENGTH_PER_SOURCE = 500000;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const REVIEW_COLUMN_NAME = "Comment"; // Assumption based on template
const API_KEY_STORAGE_KEY = 'gemini-api-key';

const getFormattedDate = (): string => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

// Simple CSV parser to handle quotes
const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
};

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [reviewSources, setReviewSources] = useState<ReviewData[]>([]);
  const [globalProductContext, setGlobalProductContext] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<Summary[] | null>(null);
  const [strategicAnalyses, setStrategicAnalyses] = useState<StrategicAnalysis[] | null>(null);
  const [trendAnalysisResult, setTrendAnalysisResult] = useState<TrendAnalysis | null>(null);
  const [personaComparisonResult, setPersonaComparisonResult] = useState<PersonaComparison | null>(null);
  const [selectedReportIndex, setSelectedReportIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTrendLoading, setIsTrendLoading] = useState<boolean>(false);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'paste' | 'upload' | 'gsheet'>('paste');
  const [gSheetUrl, setGSheetUrl] =useState<string>('');
  const [gSheetStatus, setGSheetStatus] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadState, setUploadState] = useState<'idle' | 'processing' | 'success'>('idle');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [outputLanguage, setOutputLanguage] = useState<string>('Auto-detect');
  const [segmentColumn, setSegmentColumn] = useState<string>('');
  const [isSuggestingColumn, setIsSuggestingColumn] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [comparisonIndices, setComparisonIndices] = useState<number[]>([]);
  const [isDeepDiveModalOpen, setIsDeepDiveModalOpen] = useState<boolean>(false);
  const [deepDiveTopic, setDeepDiveTopic] = useState<string | null>(null);
  const [deepDiveResult, setDeepDiveResult] = useState<DeepDiveAnalysis | null>(null);
  const [isDeepDiveLoading, setIsDeepDiveLoading] = useState<boolean>(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
    setIsApiKeyModalOpen(false);
  };
  
  const handleSummarize = useCallback(async () => {
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }
    if (reviewSources.length === 0 || reviewSources.every(s => !s.content.trim())) {
      setError("Please provide some review data before summarizing.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setStrategicAnalyses(null);
    setTrendAnalysisResult(null);
    setPersonaComparisonResult(null);
    setChatHistory([]);
    setSelectedReportIndex(0);
    setIsCompareMode(false);
    setComparisonIndices([]);

    try {
      let sourcesForAnalysis = reviewSources;

      // Persona Analysis logic
      if (segmentColumn.trim()) {
        const sourceForPersonas = reviewSources[0]; // Use the first data source for persona analysis
        if (!sourceForPersonas) throw new Error("No data source available for persona analysis.");
        
        const lines = sourceForPersonas.content.trim().split('\n');
        const headerLine = lines.shift();
        if (!headerLine) throw new Error("CSV data is empty or missing a header.");

        const headers = parseCsvLine(headerLine);
        const segmentIndex = headers.findIndex(h => h.trim() === segmentColumn.trim());
        const reviewIndex = headers.findIndex(h => h.trim() === REVIEW_COLUMN_NAME);

        if (segmentIndex === -1) throw new Error(`Segment column "${segmentColumn}" not found in the data header.`);
        if (reviewIndex === -1) throw new Error(`Review column "${REVIEW_COLUMN_NAME}" not found in the data header.`);

        const groupedReviews = new Map<string, string[]>();
        for (const line of lines) {
            const values = parseCsvLine(line);
            const segment = values[segmentIndex]?.trim();
            const review = values[reviewIndex]?.trim();
            if (segment && review) {
                if (!groupedReviews.has(segment)) {
                    groupedReviews.set(segment, []);
                }
                groupedReviews.get(segment)!.push(review);
            }
        }
        
        if (groupedReviews.size === 0) throw new Error("No personas or reviews could be extracted. Check your column name and data format.");

        sourcesForAnalysis = Array.from(groupedReviews.entries()).map(([segment, reviews]) => ({
            label: segment,
            content: reviews.join('\n'),
            reportDate: sourceForPersonas.reportDate
        }));
        // IMPORTANT: Update reviewSources to reflect the personas for UI rendering
        setReviewSources(sourcesForAnalysis);
      }

      const summaries = await Promise.all(
        sourcesForAnalysis.map(source => summarizeReviews(apiKey, source.content, outputLanguage, globalProductContext))
      );
      setAnalysisResult(summaries);

      if (summaries.length > 0) {
        const strategies = await Promise.all(
          summaries.map(summary => getStrategicAnalysis(apiKey, summary, outputLanguage))
        );
        setStrategicAnalyses(strategies);
      }
      
      // If persona analysis was run, also get the comparison
      if (segmentColumn.trim() && summaries.length > 1) {
          const summariesForComparison = sourcesForAnalysis.map((source, index) => ({
              segment: source.label,
              summary: summaries[index]
          }));
          const personaComparison = await getPersonaComparison(apiKey, summariesForComparison, outputLanguage);
          setPersonaComparisonResult(personaComparison);
      }

    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, reviewSources, outputLanguage, segmentColumn, globalProductContext]);
  
  const handleAiSuggest = useCallback(async () => {
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }
    setIsSuggesting(true);
    setError(null);
    try {
      const sampleData = await generateSampleReviews(apiKey);
      setGlobalProductContext('AcoustiMax Pro Headphones: Wireless, noise-cancelling, 20-hour battery life.');
      setReviewSources([{ label: 'Sample Headphones Data', content: sampleData.trim(), reportDate: 'Q4 2024' }]);
      setActiveTab('paste');
      setSegmentColumn('Customer Type'); // Pre-fill for the sample data
    } catch (e: any) {
      setError(e.message || "Failed to generate sample data.");
    } finally {
      setIsSuggesting(false);
    }
  }, [apiKey]);
  
  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploadState('processing');

    if (files.length > MAX_FILES) {
        setError(`You can upload a maximum of ${MAX_FILES} files at a time.`);
        setUploadState('idle');
        return;
    }
    
    const oversizedFiles = Array.from(files).filter(file => file.size > MAX_FILE_SIZE_BYTES);
    if (oversizedFiles.length > 0) {
        setError(`The following files are too large (max ${MAX_FILE_SIZE_MB}MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
        setUploadState('idle');
        return;
    }

    const readPromises = Array.from(files).map(file => new Promise<ReviewData>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) throw new Error("File is empty or could not be read.");
          let textContent = '';
          if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
            textContent = data as string;
          } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const XLSX = (window as any).XLSX;
            if (!XLSX) {
                throw new Error("XLSX library not found. Could not parse Excel file.");
            }
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            textContent = XLSX.utils.sheet_to_csv(worksheet);
          } else {
              reject(new Error(`Unsupported file type: ${file.name}. Please use CSV, XLSX, or TXT.`));
              return;
          }
          resolve({ label: file.name, content: textContent, reportDate: '' });
        } catch (err: any) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error(`Error reading ${file.name}.`));

      if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.readAsArrayBuffer(file);
      } else {
        setError(`Unsupported file type: ${file.name}. Please use CSV, XLSX, or TXT.`);
      }
    }));

    Promise.all(readPromises)
      .then(sources => {
        setReviewSources(sources);
        setUploadState('success');
        setTimeout(() => {
          setActiveTab('paste');
          setUploadState('idle');
        }, 1500);
      })
      .catch(err => {
        setError(err.message || "An error occurred while processing files.");
        setUploadState('idle');
      });
  };

  const handleGSheetFetch = useCallback(async () => {
    if (!gSheetUrl.trim()) {
      setGSheetStatus({ loading: false, error: 'Please enter a Google Sheet URL.' });
      return;
    }
    setGSheetStatus({ loading: true, error: null });
    setError(null);

    try {
      const regex = /spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
      const matches = gSheetUrl.match(regex);
      if (!matches || !matches[1]) throw new Error('Invalid Google Sheet URL format.');
      
      const sheetId = matches[1];
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error(`Fetch failed. Ensure the sheet is published to the web.`);
      
      const textContent = await response.text();

      if (textContent.length > MAX_TEXT_LENGTH_PER_SOURCE) {
        throw new Error(`Sheet data is too large. The limit is ${MAX_TEXT_LENGTH_PER_SOURCE.toLocaleString()} characters.`);
      }

      setReviewSources([{ label: 'Google Sheet', content: textContent, reportDate: '' }]);
      setGSheetStatus({ loading: false, error: null });
      setActiveTab('paste');
    } catch (err: any) {
      setGSheetStatus({ loading: false, error: err.message || 'An unexpected error occurred.' });
    }
  }, [gSheetUrl]);
  
  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Reviewer Name,Rating (1-5),Customer Type,Comment\n"
      + 'John Doe,5,Power User,"I absolutely love these headphones! The noise cancelling is top-tier."\n'
      + 'Jane Smith,2,New User,"Disappointed with the battery life. The setup was also confusing."\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "review_template_with_persona.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySummary = useCallback((reportIndex: number) => {
    if (!analysisResult || analysisResult.length === 0) return;
    const summaryToCopy = analysisResult[reportIndex];

    const formatSection = (title: string, items: string[]) => {
      if (!items || items.length === 0) return '';
      return `**${title}:**\n${items.map(item => `- ${item}`).join('\n')}\n\n`;
    };

    const formatKeywords = (keywords: Keyword[]) => {
      if (!keywords || keywords.length === 0) return '';
      return `**Top Keywords:**\n${keywords.map(k => `- ${k.keyword} (${k.frequency} mentions)`).join('\n')}\n\n`;
    };

    const summaryText = `**Customer Review Summary for ${reviewSources[reportIndex].label}**\n\n` +
      formatSection('Pros', summaryToCopy.pros) +
      formatSection('Cons', summaryToCopy.cons) +
      formatSection('Common Themes', summaryToCopy.themes) +
      formatKeywords(summaryToCopy.keywords);

    navigator.clipboard.writeText(summaryText.trim()).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  }, [analysisResult, reviewSources]);

  const getReportData = useCallback((reportIndex: number) => {
    if (!analysisResult || !strategicAnalyses) return null;
    const summary = analysisResult[reportIndex];
    const strategy = strategicAnalyses[reportIndex];

    return {
      title: `CUSTOMER INSIGHTS AI - ANALYSIS REPORT for ${reviewSources[reportIndex].label}`,
      date: new Date().toLocaleString(),
      strategicAnalysis: strategy,
      sentiment: summary.sentiment,
      pros: summary.pros,
      cons: summary.cons,
      themes: summary.themes,
      insights: summary.insights,
      keywords: summary.keywords,
    };
  }, [analysisResult, strategicAnalyses, reviewSources]);

  const handleExportReportTXT = useCallback((reportIndex: number) => {
    const data = getReportData(reportIndex);
    if (!data) return;

    let reportContent = `${data.title}\n`;
    reportContent += `=========================================\n`;
    reportContent += `Date: ${data.date}\n\n`;

    reportContent += `--- STRATEGIC ANALYSIS ---\n`;
    reportContent += `Overview: ${data.strategicAnalysis.overview}\n`;
    reportContent += `Key Focus Area: ${data.strategicAnalysis.keyFocusArea}\n\n`;
    data.strategicAnalysis.steps.forEach((step, i) => {
        reportContent += `Strategic Step ${i + 1}: ${step.step}\n`;
        reportContent += `Rationale: ${step.rationale}\n\n`;
    });

    reportContent += `--- SENTIMENT BREAKDOWN ---\n`;
    reportContent += `Positive: ${data.sentiment.positive}\n`;
    reportContent += `Negative: ${data.sentiment.negative}\n`;
    reportContent += `Neutral: ${data.sentiment.neutral}\n\n`;

    const formatSection = (title: string, items: string[]) => {
      let section = `--- ${title.toUpperCase()} ---\n`;
      section += (items?.length > 0 ? items.map(item => `- ${item}`).join('\n') : "No items found.") + '\n\n';
      return section;
    };

    reportContent += formatSection('Pros', data.pros);
    reportContent += formatSection('Cons', data.cons);
    reportContent += formatSection('Common Themes', data.themes);

    reportContent += `--- TOP KEYWORDS ---\n`;
    if (data.keywords?.length > 0) {
      data.keywords.forEach(k => {
        reportContent += `- ${k.keyword} (${k.frequency} mentions)\n`;
      });
      reportContent += `\n`;
    } else {
      reportContent += `No keywords extracted.\n\n`;
    }

    reportContent += `--- ACTIONABLE INSIGHTS (ROOT CAUSE ANALYSIS) ---\n`;
    if (data.insights?.length > 0) {
      data.insights.forEach(insight => {
        reportContent += `Cause: ${insight.cause}\n`;
        reportContent += `Suggestion: ${insight.suggestion}\n\n`;
      });
    } else {
      reportContent += `No specific insights generated.\n`;
    }

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Customer_Insights_Report_${getFormattedDate()}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [getReportData]);

  const handleExportReportPDF = useCallback((reportIndex: number) => {
    const data = getReportData(reportIndex);
    if (!data) return;

    const jspdf = (window as any).jspdf;
    if (!jspdf) {
        setError("PDF generation library (jsPDF) not found.");
        return;
    }
    const { jsPDF } = jspdf;
    const doc = new jsPDF();

    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - margin * 2;
    let y = margin;

    const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = margin;
        }
    };
    
    const addText = (text: string, size: number, isBold: boolean = false, spacing: number = 7) => {
        doc.setFontSize(size);
        doc.setFont(undefined, isBold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text, usableWidth);
        checkPageBreak(lines.length * (size / 2));
        doc.text(lines, margin, y);
        y += (lines.length * (size / 2)) + spacing;
    };
    
    const addList = (items: string[]) => {
        items.forEach(item => addText(`- ${item}`, 10, false, 3));
        y += 5;
    };

    addText(data.title, 18, true, 5);
    addText(`Date: ${data.date}`, 8, false, 10);
    
    addText("STRATEGIC ANALYSIS", 14, true, 4);
    addText(`Overview: ${data.strategicAnalysis.overview}`, 10);
    addText(`Key Focus Area: ${data.strategicAnalysis.keyFocusArea}`, 10);
    data.strategicAnalysis.steps.forEach((step, i) => {
        addText(`Step ${i + 1}: ${step.step}`, 10, true, 2);
        addText(`Rationale: ${step.rationale}`, 10);
    });

    addText("SENTIMENT BREAKDOWN", 14, true, 4);
    addText(`Positive: ${data.sentiment.positive}, Negative: ${data.sentiment.negative}, Neutral: ${data.sentiment.neutral}`, 10);

    const sections: {title: string, items: string[]}[] = [
        { title: "PROS", items: data.pros },
        { title: "CONS", items: data.cons },
        { title: "COMMON THEMES", items: data.themes },
    ];
    sections.forEach(sec => {
        addText(sec.title, 14, true, 4);
        sec.items.length > 0 ? addList(sec.items) : addText("No items found.", 10, false, 7);
    });

    addText("TOP KEYWORDS", 14, true, 4);
    if (data.keywords?.length > 0) {
        addList(data.keywords.map(k => `${k.keyword} (${k.frequency} mentions)`));
    } else {
        addText("No keywords extracted.", 10);
    }

    addText("ACTIONABLE INSIGHTS", 14, true, 4);
    if (data.insights?.length > 0) {
        data.insights.forEach(insight => {
            addText(`Cause: ${insight.cause}`, 10, true, 2);
            addText(`Suggestion: ${insight.suggestion}`, 10);
        });
    } else {
        addText("No specific insights generated.", 10);
    }

    doc.save(`Customer_Insights_Report_${getFormattedDate()}.pdf`);
}, [getReportData]);

const handleExportReportDOCX = useCallback((reportIndex: number) => {
    const data = getReportData(reportIndex);
    if (!data) return;
    
    const docx = (window as any).docx;
    if (!docx) {
        setError("DOCX generation library (docx) not found.");
        return;
    }
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;

    const createList = (items: string[]) => {
        if (!items || items.length === 0) {
            return [new Paragraph({ text: "No items found." })];
        }
        return items.map(item => new Paragraph({ text: item, bullet: { level: 0 } }));
    };
    
    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({ text: data.title, heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `Date: ${data.date}`, style: "IntenseQuote" }),
                
                new Paragraph({ text: "STRATEGIC ANALYSIS", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ children: [new TextRun({ text: "Overview: ", bold: true }), new TextRun(data.strategicAnalysis.overview)]}),
                new Paragraph({ children: [new TextRun({ text: "Key Focus Area: ", bold: true }), new TextRun(data.strategicAnalysis.keyFocusArea)]}),
                ...data.strategicAnalysis.steps.flatMap((step, i) => [
                    new Paragraph({ children: [new TextRun({ text: `Step ${i + 1}: `, bold: true }), new TextRun(step.step)]}),
                    new Paragraph({ children: [new TextRun({ text: "Rationale: ", italics: true }), new TextRun(step.rationale)]}),
                ]),
                new Paragraph({ text: "" }),
                
                new Paragraph({ text: "SENTIMENT BREAKDOWN", heading: HeadingLevel.HEADING_2 }),
                new Paragraph(`Positive: ${data.sentiment.positive}, Negative: ${data.sentiment.negative}, Neutral: ${data.sentiment.neutral}`),
                new Paragraph({ text: "" }),
                
                new Paragraph({ text: "PROS", heading: HeadingLevel.HEADING_2 }),
                ...createList(data.pros),
                new Paragraph({ text: "" }),

                new Paragraph({ text: "CONS", heading: HeadingLevel.HEADING_2 }),
                ...createList(data.cons),
                new Paragraph({ text: "" }),

                new Paragraph({ text: "COMMON THEMES", heading: HeadingLevel.HEADING_2 }),
                ...createList(data.themes),
                new Paragraph({ text: "" }),
                
                new Paragraph({ text: "TOP KEYWORDS", heading: HeadingLevel.HEADING_2 }),
                ...createList(data.keywords?.map(k => `${k.keyword} (${k.frequency} mentions)`)),
                new Paragraph({ text: "" }),

                new Paragraph({ text: "ACTIONABLE INSIGHTS", heading: HeadingLevel.HEADING_2 }),
                ...(data.insights?.length > 0 ? data.insights.flatMap(insight => [
                    new Paragraph({ children: [new TextRun({ text: "Cause: ", bold: true }), new TextRun(insight.cause)]}),
                    new Paragraph({ children: [new TextRun({ text: "Suggestion: ", bold: true }), new TextRun(insight.suggestion)]}),
                ]) : [new Paragraph("No specific insights generated.")]),
            ],
        }],
    });

    Packer.toBlob(doc).then((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Customer_Insights_Report_${getFormattedDate()}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

}, [getReportData]);
  
  const handleSendMessage = useCallback(async (message: string) => {
    if (!analysisResult || !apiKey) return;

    const newUserMessage: ChatMessage = { id: Date.now(), sender: 'user', text: message };
    setChatHistory(prev => [...prev, newUserMessage]);
    setIsChatLoading(true);

    try {
        const currentReviews = reviewSources[selectedReportIndex].content;
        const aiResponseText = await askQuestionAboutReviews(apiKey, currentReviews, message, outputLanguage, globalProductContext);
        const newAiMessage: ChatMessage = { id: Date.now() + 1, sender: 'ai', text: aiResponseText };
        setChatHistory(prev => [...prev, newAiMessage]);
    } catch (e: any) {
        const errorMessage: ChatMessage = { id: Date.now() + 1, sender: 'ai', text: `Sorry, I encountered an error: ${e.message}` };
        setChatHistory(prev => [...prev, errorMessage]);
    } finally {
        setIsChatLoading(false);
    }
  }, [apiKey, reviewSources, outputLanguage, selectedReportIndex, analysisResult, globalProductContext]);

  const handleGenerateSuggestedQuestions = useCallback(async (): Promise<string[]> => {
    if (!analysisResult || !apiKey) return [];
    
    setIsGeneratingQuestions(true);
    try {
        const currentReviews = reviewSources[selectedReportIndex].content;
        const questions = await generateSuggestedQuestions(apiKey, currentReviews, globalProductContext);
        return questions;
    } catch (e: any) {
        console.error("Failed to generate suggested questions:", e);
        throw e;
    } finally {
        setIsGeneratingQuestions(false);
    }
  }, [apiKey, analysisResult, selectedReportIndex, reviewSources, globalProductContext]);
  
  const handleComparisonSelect = (index: number) => {
    setComparisonIndices(prev => {
        if (prev.includes(index)) {
            return prev.filter(i => i !== index);
        }
        if (prev.length < 2) {
            return [...prev, index];
        }
        return prev; // Don't add more than 2
    });
  };

  const handleRunTrendAnalysis = useCallback(async () => {
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }
    if (comparisonIndices.length !== 2 || !analysisResult) {
        setError("Please select exactly two reports to analyze trends.");
        return;
    }
    setIsTrendLoading(true);
    setError(null);
    setTrendAnalysisResult(null);

    try {
        const [startIndex, endIndex] = comparisonIndices.sort((a, b) => a - b);
        const startSummary = analysisResult[startIndex];
        const endSummary = analysisResult[endIndex];
        const startLabel = reviewSources[startIndex]?.label || `Report ${startIndex + 1}`;
        const endLabel = reviewSources[endIndex]?.label || `Report ${endIndex + 1}`;

        const trendResult = await getTrendAnalysis(apiKey, startSummary, endSummary, startLabel, endLabel, outputLanguage);
        setTrendAnalysisResult(trendResult);
        setIsCompareMode(false); // Exit selection mode to show the report
    } catch (e: any) {
        setError(e.message || "An unexpected error occurred during trend analysis.");
    } finally {
        setIsTrendLoading(false);
    }
  }, [apiKey, comparisonIndices, analysisResult, reviewSources, outputLanguage]);

  const handleSuggestSegmentColumn = useCallback(async () => {
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }
    if (reviewSources.length !== 1) {
      setError("Column suggestion requires exactly one CSV data source.");
      return;
    }
    
    setIsSuggestingColumn(true);
    setError(null);
    try {
      const sourceContent = reviewSources[0].content;
      const header = sourceContent.split('\n')[0].trim();
      if (!header) {
        throw new Error("Could not find a header row in the data source.");
      }
      
      const suggestedColumn = await suggestSegmentColumn(apiKey, header);
      if (suggestedColumn) {
        setSegmentColumn(suggestedColumn);
      } else {
        setError("AI could not confidently suggest a segment column from the header.");
      }

    } catch (e: any) {
      setError(e.message || "Failed to suggest a column.");
    } finally {
      setIsSuggestingColumn(false);
    }
  }, [apiKey, reviewSources]);

  const handleReviewSourceChange = (index: number, field: keyof ReviewData, value: string) => {
    const newSources = [...reviewSources];
    const sourceToUpdate = { ...newSources[index] };

    if (field === 'content' && value.length > MAX_TEXT_LENGTH_PER_SOURCE) {
        setError(`Each source cannot exceed ${MAX_TEXT_LENGTH_PER_SOURCE.toLocaleString()} characters.`);
        sourceToUpdate.content = value.substring(0, MAX_TEXT_LENGTH_PER_SOURCE);
    } else {
        (sourceToUpdate as any)[field] = value;
    }
    
    newSources[index] = sourceToUpdate;
    setReviewSources(newSources);
  };

  const addReviewSource = () => {
    if (reviewSources.length >= MAX_FILES) {
        setError(`You can have a maximum of ${MAX_FILES} data sources.`);
        return;
    }
    setReviewSources([...reviewSources, { label: `Pasted Source ${reviewSources.length + 1}`, content: '', reportDate: '' }]);
  };

  const removeReviewSource = (indexToRemove: number) => {
    setReviewSources(reviewSources.filter((_, index) => index !== indexToRemove));
  };

  const handleDeepDive = useCallback(async (topic: string) => {
    if (!analysisResult || !apiKey) return;

    setDeepDiveTopic(topic);
    setIsDeepDiveModalOpen(true);
    setIsDeepDiveLoading(true);
    setDeepDiveResult(null);
    setError(null);

    try {
        const currentReviews = reviewSources[selectedReportIndex].content;
        const result = await getDeepDiveAnalysis(apiKey, currentReviews, topic, outputLanguage, globalProductContext);
        setDeepDiveResult(result);
    } catch (e: any) {
        setError(`Failed to analyze "${topic}": ${e.message}`);
        // Keep the modal open but show an error state
        setDeepDiveResult(null);
    } finally {
        setIsDeepDiveLoading(false);
    }
  }, [apiKey, analysisResult, selectedReportIndex, reviewSources, outputLanguage, globalProductContext]);


  const ReportActions: React.FC<{ reportIndex: number }> = ({ reportIndex }) => {
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
      }, []);

    return (
        <div className="flex justify-end space-x-3">
            <button onClick={() => handleCopySummary(reportIndex)} disabled={isCopied} className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm transition-colors ${isCopied ? 'bg-emerald-600 text-white' : 'text-slate-600 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'}`}>
              {isCopied ? <CheckIcon className="w-5 h-5 mr-2" /> : <CopyIcon className="w-5 h-5 mr-2" />}
              {isCopied ? 'Copied!' : 'Copy Summary'}
            </button>
            <div ref={exportMenuRef} className="relative inline-block text-left">
              <div>
                  <button onClick={() => setIsExportMenuOpen(prev => !prev)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-500 hover:bg-purple-600">
                      <DownloadIcon className="w-5 h-5 mr-2" />
                      Export Report
                       <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                  </button>
              </div>
              {isExportMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-slate-700 ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                          <button onClick={() => { handleExportReportPDF(reportIndex); setIsExportMenuOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600" role="menuitem">Export as PDF</button>
                          <button onClick={() => { handleExportReportDOCX(reportIndex); setIsExportMenuOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600" role="menuitem">Export as DOCX</button>
                          <button onClick={() => { handleExportReportTXT(reportIndex); setIsExportMenuOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600" role="menuitem">Export as TXT</button>
                      </div>
                  </div>
              )}
            </div>
        </div>
    );
  };

  const renderSummary = () => {
    if (isLoading || isTrendLoading) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px] bg-slate-100 dark:bg-slate-800/50 rounded-lg p-6">
          <div className="text-center">
            <svg className="animate-spin mx-auto h-12 w-12 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">{isTrendLoading ? "Analyzing Trends..." : "Generating Insights..."}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">The AI is performing a deep analysis. This may take a moment.</p>
          </div>
        </div>
      );
    }

    if (trendAnalysisResult && comparisonIndices.length === 2) {
        const trendChartData = comparisonIndices.map(index => ({
            label: reviewSources[index]?.label || `Data ${index + 1}`,
            summary: analysisResult![index],
        }));
        return (
            <TrendAnalysisReport
                analysis={trendAnalysisResult}
                trendChartData={trendChartData}
                startReportLabel={reviewSources[comparisonIndices[0]]?.label}
                endReportLabel={reviewSources[comparisonIndices[1]]?.label}
                onClose={() => {
                    setTrendAnalysisResult(null);
                    setComparisonIndices([]);
                }}
            />
        );
    }
    
    if (analysisResult && analysisResult.length > 0 && strategicAnalyses && strategicAnalyses.length > 0) {
      if (isCompareMode) {
          // Trend Analysis Selection view
          return (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                  <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Select Two Reports for Trend Analysis</h3>
                      <button onClick={() => { setIsCompareMode(false); setComparisonIndices([]); }} className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">Cancel</button>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">You have selected {comparisonIndices.length} of 2 reports.</p>
                  <div className="mt-4 space-y-2">
                      {reviewSources.map((source, index) => (
                          <label key={index} htmlFor={`compare-${index}`} className={`flex items-center p-3 rounded-lg border-2 transition-colors cursor-pointer ${comparisonIndices.includes(index) ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                              <input
                                  type="checkbox"
                                  id={`compare-${index}`}
                                  checked={comparisonIndices.includes(index)}
                                  disabled={comparisonIndices.length >= 2 && !comparisonIndices.includes(index)}
                                  onChange={() => handleComparisonSelect(index)}
                                  className="h-5 w-5 rounded border-slate-300 text-purple-500 focus:ring-purple-500 disabled:opacity-50"
                              />
                              <span className="ml-3 font-medium text-slate-700 dark:text-slate-200 truncate">{source.label}</span>
                          </label>
                      ))}
                  </div>
                  <div className="mt-6">
                    <button 
                        onClick={handleRunTrendAnalysis}
                        disabled={comparisonIndices.length !== 2}
                        className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-500 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-400 disabled:cursor-not-allowed"
                    >
                        Generate Trend Analysis
                    </button>
                  </div>
              </div>
          );
      }

      // Single View Mode
      const currentSummary = analysisResult[selectedReportIndex];
      const currentStrategy = strategicAnalyses[selectedReportIndex];
      const trendData = analysisResult.map((summary, index) => ({
          label: reviewSources[index]?.label || `Data ${index + 1}`,
          summary,
      }));

      return (
        <div className="space-y-6">
            {personaComparisonResult && <PersonaComparisonReport comparison={personaComparisonResult} />}
            <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-md">
                <div className="flex flex-wrap gap-2 justify-between items-center">
                    <nav className="flex flex-wrap gap-x-1 gap-y-1" aria-label="Result Tabs">
                        {reviewSources.map((source, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedReportIndex(index)}
                                className={`text-center px-3 py-2 text-sm font-medium rounded-lg transition-colors truncate ${selectedReportIndex === index
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                                }`}
                                title={source.label}
                            >
                                {source.label}
                            </button>
                        ))}
                    </nav>
                     {analysisResult.length > 1 && !personaComparisonResult && (
                        <button onClick={() => setIsCompareMode(true)} className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-purple-500 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50">
                            <CompareIcon className="w-5 h-5" />
                            <span>Analyze Trends</span>
                        </button>
                     )}
                </div>
            </div>
            <ReportActions reportIndex={selectedReportIndex} />
            <StrategicAnalysisCard 
                analysis={currentStrategy} 
                icon={<TargetIcon />}
                iconBgColor="bg-purple-100 dark:bg-purple-900/50"
                iconTextColor="text-purple-500 dark:text-purple-400"
            />
            <DashboardMetrics summary={currentSummary} />
            <KeywordsCard keywords={currentSummary.keywords} onKeywordClick={handleDeepDive} />
            {analysisResult.length > 1 && !personaComparisonResult && <TrendChart data={trendData} />}
            <InsightsCard 
                insights={currentSummary.insights}
                icon={<WrenchIcon/>}
                iconBgColor="bg-sky-100 dark:bg-sky-900/50"
                iconTextColor="text-sky-600 dark:text-sky-400"
            />
            <SummaryCard 
                title="Pros" 
                items={currentSummary.pros} 
                icon={<ThumbsUpIcon />} 
                iconBgColor="bg-emerald-100 dark:bg-emerald-900/50" 
                iconTextColor="text-emerald-600 dark:text-emerald-400"
                language={outputLanguage}
                context={globalProductContext}
                apiKey={apiKey || ''}
            />
            <SummaryCard 
                title="Cons" 
                items={currentSummary.cons} 
                icon={<ThumbsDownIcon />} 
                iconBgColor="bg-rose-100 dark:bg-rose-900/50" 
                iconTextColor="text-rose-600 dark:text-rose-400"
                language={outputLanguage}
                context={globalProductContext}
                apiKey={apiKey || ''}
            />
            <SummaryCard 
                title="Common Themes" 
                items={currentSummary.themes} 
                icon={<LightBulbIcon />} 
                iconBgColor="bg-amber-100 dark:bg-amber-900/50" 
                iconTextColor="text-amber-600 dark:text-amber-400"
                language={outputLanguage}
                context={globalProductContext}
                apiKey={apiKey || ''}
                onItemClick={handleDeepDive}
            />
        </div>
      );
    }
    return (
        <div className="flex items-center justify-center h-full min-h-[400px] bg-slate-100 dark:bg-slate-800/50 rounded-lg p-6">
            <div className="text-center">
                <SparklesIcon className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500" />
                <h3 className="mt-2 text-lg font-medium text-slate-800 dark:text-slate-200">Your analysis will appear here</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Provide some data and click "Analyze" to get started.</p>
            </div>
        </div>
    );
  };
  
  const renderInputContent = () => {
    switch (activeTab) {
      case 'upload':
        const renderDropzoneContent = () => {
          switch (uploadState) {
            case 'processing':
              return (
                <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600">
                  <svg className="animate-spin h-12 w-12 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">Processing files...</p>
                </div>
              );
            case 'success':
              return (
                <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500">
                  <CheckIcon className="w-16 h-16 text-emerald-500 mb-2" />
                  <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-200">Upload Successful!</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Your data is ready.</p>
                </div>
              );
            case 'idle':
            default:
              return (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFileChange(e.dataTransfer.files); }}
                  className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                    isDragOver 
                    ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/40 ring-4 ring-offset-2 dark:ring-offset-slate-800 ring-purple-300/50' 
                    : 'border-slate-300 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <UploadCloudIcon className="w-12 h-12 text-slate-400 mb-4" />
                  <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">Drop files here or click to upload</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Max {MAX_FILES} files, {MAX_FILE_SIZE_MB}MB each. Supports CSV, TXT, XLSX.</p>
                </div>
              );
          }
        };

        return (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e.target.files)}
              className="hidden"
              accept=".csv,.txt,.xlsx,.xls"
              multiple
            />
            {renderDropzoneContent()}
             <div className="text-center">
              <button onClick={handleDownloadTemplate} className="inline-flex items-center text-sm font-medium text-purple-500 dark:text-purple-400 hover:underline">
                <DownloadIcon className="w-4 h-4 mr-2" />
                Download CSV Template
              </button>
            </div>
          </div>
        );
      case 'gsheet':
        return (
          <div className="space-y-4">
             <div className="flex justify-between items-baseline">
                <label htmlFor="gsheet-url" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Google Sheet URL</label>
                 <button onClick={handleDownloadTemplate} type="button" className="inline-flex items-center text-xs font-medium text-purple-500 dark:text-purple-400 hover:underline">
                    <DownloadIcon className="w-3 h-3 mr-1.5" />
                    Download Template
                </button>
            </div>
            <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="url"
                  id="gsheet-url"
                  value={gSheetUrl}
                  onChange={(e) => setGSheetUrl(e.target.value)}
                  className="flex-1 block w-full rounded-md p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 p-3 rounded-md space-y-1">
              <p><strong>Note:</strong> Your sheet must be public via <code className="font-mono text-purple-500 dark:text-purple-400">File &gt; Share &gt; Publish to web</code>.</p>
              <p>To ensure performance, the app will only process the first <strong>{MAX_TEXT_LENGTH_PER_SOURCE.toLocaleString()}</strong> characters of data from the sheet.</p>
            </div>
            <button onClick={handleGSheetFetch} disabled={gSheetStatus.loading} className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-500 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-400">
              {gSheetStatus.loading ? 'Fetching...' : 'Fetch & Set as Data Source'}
            </button>
            {gSheetStatus.error && <p className="text-sm text-red-600 dark:text-red-400">{gSheetStatus.error}</p>}
          </div>
        );
      case 'paste':
      default:
        return (
          <div className="space-y-4">
              {reviewSources.map((source, index) => (
                  <div key={index} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 relative group">
                      <div className="flex justify-between items-center mb-3">
                          <label htmlFor={`source-label-${index}`} className="sr-only">Source Label</label>
                          <input
                              id={`source-label-${index}`}
                              type="text"
                              value={source.label}
                              onChange={(e) => handleReviewSourceChange(index, 'label', e.target.value)}
                              className="text-md font-semibold bg-transparent focus:outline-none focus:ring-1 focus:ring-purple-500 rounded-sm p-1 -m-1 text-slate-800 dark:text-slate-100"
                          />
                          <button
                              onClick={() => removeReviewSource(index)}
                              className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove source"
                          >
                              <TrashIcon className="w-5 h-5" />
                          </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                           <label htmlFor={`paste-textarea-${index}`} className="sr-only">Paste Review Data for {source.label}</label>
                            <textarea
                                id={`paste-textarea-${index}`}
                                value={source.content}
                                onChange={(e) => handleReviewSourceChange(index, 'content', e.target.value)}
                                placeholder="Paste raw text here. This can be from a CSV, a document, or even a list of YouTube comments."
                                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out text-sm min-h-40 resize-y"
                            />
                            <div className="text-right text-xs text-slate-500 dark:text-slate-400 mt-1 pr-1">
                                {source.content.length.toLocaleString()} / {MAX_TEXT_LENGTH_PER_SOURCE.toLocaleString()}
                            </div>
                        </div>
                        <div>
                           <label htmlFor={`report-date-${index}`} className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                               Report Date/Period
                           </label>
                           <input
                               id={`report-date-${index}`}
                               type="text"
                               value={source.reportDate || ''}
                               onChange={(e) => handleReviewSourceChange(index, 'reportDate', e.target.value)}
                               placeholder="e.g., Q3 2024"
                               className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm"
                           />
                         </div>
                      </div>
                  </div>
              ))}
              {reviewSources.length < MAX_FILES && (
                  <button
                      onClick={addReviewSource}
                      className="w-full flex justify-center items-center px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:border-purple-500 hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
                  >
                      + Add Another Source
                  </button>
              )}
               {reviewSources.length === 0 && (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                      <p>You have no data sources loaded.</p>
                      <p className="mt-1">Use a tab above, or <button onClick={addReviewSource} className="font-semibold text-purple-500 dark:text-purple-400 hover:underline">add a source</button> to paste text directly.</p>
                  </div>
              )}
          </div>
      );
    }
  };

  const hasData = reviewSources.length > 0 && reviewSources.some(s => s.content.trim());

  const TABS = [
    { id: 'paste', label: 'Paste Text' },
    { id: 'upload', label: 'Upload File(s)' },
    { id: 'gsheet', label: 'Google Sheet' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans p-4 sm:p-6 lg:p-8">
      <ApiKeyModal isOpen={isApiKeyModalOpen} onSave={handleSaveApiKey} />
      <div className="w-full max-w-7xl mx-auto">
        <header className="flex flex-col items-center justify-center text-center mb-10 gap-4">
            <div className="flex items-center justify-center space-x-3">
              <SparklesIcon className="w-8 h-8 text-purple-500"/>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Customer Insights AI</h1>
                <p className="mt-1 text-slate-600 dark:text-slate-400">Transform feedback into actionable insights.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-2">
                <button 
                    onClick={() => setIsApiKeyModalOpen(true)} 
                    className="flex-shrink-0 flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" 
                    title="Manage API Key"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.94 2.1c.14-.33.5-.54.89-.54s.75.21.89.54l.43 1.01.03.06c.35.81.98 1.45 1.79 1.79l.06.03 1.01.43c.33.14.54.5.54.89s-.21.75-.54.89l-1.01.43-.06.03c-.81.35-1.45.98-1.79 1.79l-.03.06-.43 1.01c-.14.33-.5.54-.89-.54s-.75-.21-.89-.54l-.43-1.01-.03-.06c-.35-.81-.98-1.45-1.79-1.79l-.06-.03-1.01-.43c-.33-.14-.54-.5-.54-.89s.21.75.54-.89l1.01-.43.06-.03c.81-.35 1.45-.98 1.79-1.79l.03-.06.43-1.01zM21 12.49c.29-.12.48-.4.48-.73s-.19-.61-.48-.73l-1.22-.52-.06-.03c-.52-.22-1-.59-1.35-1.04l-.05-.07-.6-1.05c-.12-.21-.34-.35-.58-.35s-.46.14-.58.35l-.6 1.05-.05.07c-.35.45-.83.82-1.35-1.04l-.06.03-1.22.52c-.29.12-.48.4-.48.73s.19.61.48.73l1.22.52.06.03c.52.22 1 .59 1.35 1.04l.05.07.6 1.05c.12.21.34-.35.58-.35s.46-.14-.58-.35l.6-1.05.05-.07c.35-.45.83-.82-1.35-1.04l.06-.03 1.22-.52zM12.5 13.99l-1.5 3c-.15.3-.47.5-.82.5s-.67-.2-.82-.5l-1.5-3c-.15-.3-.15-.65 0-.95l1.5-3c.15-.3.47-.5.82-.5s.67.2.82.5l1.5 3c.15.3.15.65 0 .95z"/></svg>
                    <span>Manage API Key</span>
                </button>
                <button 
                    onClick={() => setIsHelpOpen(true)} 
                    className="flex-shrink-0 flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" 
                    title="Help"
                >
                    <QuestionMarkCircleIcon className="w-5 h-5" />
                    <span>Help</span>
                </button>
            </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="lg:sticky lg:top-8 space-y-6">
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">1. Provide Review Data & Context</h2>
                    <div className="mb-6 border-b border-slate-200 dark:border-slate-700 pb-6">
                        <label htmlFor="global-context" className="flex items-center space-x-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                            <InfoIcon className="w-4 h-4" />
                            <span>Global Product Context (Optional)</span>
                        </label>
                        <textarea
                            id="global-context"
                            value={globalProductContext}
                            onChange={(e) => setGlobalProductContext(e.target.value)}
                            placeholder="Provide background info on your product to improve analysis accuracy, e.g., 'AcoustiMax Pro Headphones: Wireless, noise-cancelling, 20-hour battery life.'"
                            className="mt-2 w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out text-sm min-h-24 resize-y"
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This context will be applied to all data sources in this analysis session.</p>
                    </div>
                    <div className="border-b border-slate-200 dark:border-slate-700">
                      <nav className="-mb-px flex flex-wrap items-center gap-x-2 gap-y-1" aria-label="Tabs">
                          {TABS.map((tab, index) => (
                              <React.Fragment key={tab.id}>
                                  {index > 0 && <span className="text-slate-300 dark:text-slate-600">|</span>}
                                  <button
                                      onClick={() => setActiveTab(tab.id as any)}
                                      className={`px-3 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === tab.id
                                          ? 'border-slate-200 dark:border-slate-700 border-b-0 text-purple-500 dark:text-purple-400 bg-white dark:bg-slate-800'
                                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                      }`}
                                      style={activeTab === tab.id ? { marginBottom: '-1px' } : {}}
                                  >
                                      {tab.label}
                                  </button>
                              </React.Fragment>
                          ))}
                      </nav>
                    </div>
                    <div className="mt-6">{renderInputContent()}</div>
                 </div>
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg space-y-4">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">2. Configure & Analyze</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="language-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Analysis Language</label>
                            <select id="language-select" value={outputLanguage} onChange={(e) => setOutputLanguage(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 dark:bg-slate-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md">
                                <option>Auto-detect</option>
                                <option>English</option>
                                <option>Spanish</option>
                                <option>French</option>
                                <option>German</option>
                                <option>Japanese</option>
                                <option>Chinese</option>
                                <option>Vietnamese</option>
                                <option>Portuguese</option>
                                <option>Russian</option>
                                <option>Arabic</option>
                                <option>Hindi</option>
                                <option>Italian</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="segment-column" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Persona/Segment Column <span className="text-xs text-slate-400">(Optional)</span></label>
                            <div className="relative mt-1">
                                <input
                                    type="text"
                                    id="segment-column"
                                    value={segmentColumn}
                                    onChange={(e) => setSegmentColumn(e.target.value)}
                                    placeholder="e.g., Customer Type"
                                    className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 dark:bg-slate-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                    <button
                                        type="button"
                                        onClick={handleSuggestSegmentColumn}
                                        disabled={isSuggestingColumn || reviewSources.length !== 1}
                                        className="p-1.5 text-purple-500 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Suggest column from data header"
                                    >
                                        {isSuggestingColumn ? (
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <MagicWandIcon className="w-5 h-5" />
                                        )}
                                        <span className="sr-only">Suggest Column</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                     <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 p-2 rounded-md">
                        <strong>For Persona Analysis:</strong> Provide a single CSV data source and enter the exact column name containing your segments. The review text must be in a column named "Comment".
                     </p>
                    <div className="flex items-center space-x-3 pt-2">
                        <button
                          onClick={handleSummarize}
                          disabled={isLoading || isSuggesting || !hasData}
                          className="flex-grow w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-500 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-400 disabled:cursor-not-allowed"
                        >
                          {isLoading ? 'Analyzing...' : `Analyze ${reviewSources.length} Source(s)`}
                        </button>
                        <button
                            onClick={handleAiSuggest}
                            disabled={isLoading || isSuggesting}
                            title="Generate sample data with personas"
                            aria-label="Generate sample review data with personas"
                            className="p-3 inline-flex justify-center items-center border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        >
                             <MagicWandIcon className={`h-6 w-6 text-purple-500 ${isSuggesting ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
                 </div>
            </div>
            <div className="results-section space-y-4">
              {renderSummary()}
            </div>
        </main>

        <footer className="text-center mt-12 py-4 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex justify-center items-center space-x-6 mb-4">
            <a href="https://www.youtube.com/@luke1618gamer" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-purple-500 transition-colors" title="YouTube">
              YouTube
            </a>
            <a href="https://www.tiktok.com/@hoangcao2704" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-purple-500 transition-colors" title="TikTok">
              TikTok
            </a>
            <a href="https://www.linkedin.com/in/hoangminhcao" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-purple-500 transition-colors" title="LinkedIn">
              LinkedIn
            </a>
          </div>
          © 2025 Developed by MrLuke1618. All rights reserved.
        </footer>

        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

        <DeepDiveModal 
            isOpen={isDeepDiveModalOpen}
            onClose={() => setIsDeepDiveModalOpen(false)}
            topic={deepDiveTopic}
            analysis={deepDiveResult}
            isLoading={isDeepDiveLoading}
        />

        {!isLoading && analysisResult && !isCompareMode && (
            <>
                <button 
                  onClick={() => setIsChatOpen(true)} 
                  className="fixed bottom-8 right-8 bg-purple-500 text-white p-4 rounded-full shadow-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-transform hover:scale-110"
                  aria-label="Open chat to ask about your data"
                >
                    <ChatBubbleIcon className="w-8 h-8"/>
                </button>
                <Chatbot 
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    messages={chatHistory}
                    onSendMessage={handleSendMessage}
                    isLoading={isChatLoading}
                    title={`Ask about ${reviewSources[selectedReportIndex]?.label || 'Your Data'}`}
                    onGenerateQuestions={handleGenerateSuggestedQuestions}
                    isGeneratingQuestions={isGeneratingQuestions}
                />
            </>
        )}
      </div>
    </div>
  );
};

export default App;