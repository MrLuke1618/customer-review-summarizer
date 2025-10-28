import { GoogleGenAI, Type } from "@google/genai";
import { Summary, StrategicAnalysis, TrendAnalysis, DeepDiveAnalysis, PersonaComparison } from '../types';

// The 'ai' instance is now created inside each function with the user-provided key.

export async function summarizeReviews(apiKey: string, reviewsText: string, outputLanguage: string, productContext: string): Promise<Summary> {
  const ai = new GoogleGenAI({ apiKey });
  const isAutoDetect = outputLanguage.toLowerCase() === 'auto-detect';

  const prompt = `
    You are a world-class expert in customer feedback analysis for a global company. You have been provided with some background context about the product/service being reviewed. Use this context to better understand the customer feedback.

    --- CONTEXT ---
    ${productContext || "No context provided."}
    --- END CONTEXT ---

    Your task is to analyze a dataset of customer reviews and provide a clear, concise, and insightful summary.

    The data provided is a raw text dump containing multiple customer reviews. From this data, you must perform the following actions:
    1.  **Language Handling**: ${isAutoDetect 
      ? 'First, automatically detect the predominant language of the customer reviews. All subsequent analysis and the final summary must be in this detected language.' 
      : `First, identify the primary language of the reviews. If it is not ${outputLanguage}, mentally translate them before analysis. The final summary must be written in ${outputLanguage}.`}
    2.  **Extract Key Points**:
        - **Pros**: Identify positive points, compliments, and aspects customers liked.
        - **Cons**: Identify negative points, complaints, and areas for improvement.
        - **Common Themes**: Identify recurring topics, features, or issues mentioned across multiple reviews.
    3.  **Perform Sentiment Analysis**: Tally the reviews to determine sentiment. Count how many reviews are clearly positive, negative, and neutral. A neutral review might be one that just states facts or has a balanced mix of mild pros and cons.
    4.  **Generate Actionable Insights**: Based on the common themes and cons, infer 1 to 3 potential root causes for the problems. For each root cause, suggest a concrete, actionable step the company can take to address it.
    5.  **Extract Top Keywords**: Identify the top 10-15 most frequently mentioned nouns or noun phrases that are specific and meaningful (e.g., "battery life", "customer service", "screen quality"). Exclude generic, non-descriptive words like "product", "item", "review", or "thing". For each keyword, provide its frequency count, sorted from most to least frequent.

    Analyze the following customer review data:
    ---
    ${reviewsText}
    ---

    Return the complete summary in a single, structured JSON object. Ensure all string values in the JSON are plain text without any markdown characters (like *, **, _, #). Do not include any introductory text outside the JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pros: {
              type: Type.ARRAY,
              description: "A list of positive points and compliments from the reviews.",
              items: { type: Type.STRING },
            },
            cons: {
              type: Type.ARRAY,
              description: "A list of negative points and complaints from the reviews.",
              items: { type: Type.STRING },
            },
            themes: {
              type: Type.ARRAY,
              description: "A list of recurring topics or common themes mentioned in the reviews.",
              items: { type: Type.STRING },
            },
            sentiment: {
              type: Type.OBJECT,
              description: "A breakdown of review sentiment counts.",
              properties: {
                positive: { type: Type.NUMBER },
                negative: { type: Type.NUMBER },
                neutral: { type: Type.NUMBER },
              },
            },
            insights: {
              type: Type.ARRAY,
              description: "A list of actionable insights, including root causes and suggestions.",
              items: {
                type: Type.OBJECT,
                properties: {
                  cause: { type: Type.STRING, description: "The inferred root cause of an issue." },
                  suggestion: { type: Type.STRING, description: "A suggested actionable step to address the cause." },
                },
              },
            },
            keywords: {
              type: Type.ARRAY,
              description: "A list of the top 10-15 most frequent keywords and their frequencies.",
              items: {
                type: Type.OBJECT,
                properties: {
                  keyword: { type: Type.STRING, description: "The extracted keyword." },
                  frequency: { type: Type.NUMBER, description: "How many times the keyword appeared." },
                },
                required: ["keyword", "frequency"],
              },
            },
          },
          required: ["pros", "cons", "themes", "sentiment", "insights", "keywords"],
        },
      },
    });

    const text = response.text;
    if (!text) {
        throw new Error("The model did not return a valid summary. The response was empty.");
    }
    const jsonText = text.trim();
    const summaryData: Summary = JSON.parse(jsonText);
    return summaryData;
    
  } catch (error) {
    console.error("Error summarizing reviews:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to process reviews. Gemini API error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while summarizing reviews.");
  }
}

export async function getStrategicAnalysis(apiKey: string, summary: Summary, language: string): Promise<StrategicAnalysis> {
  const ai = new GoogleGenAI({ apiKey });
  const isAutoDetect = language.toLowerCase() === 'auto-detect';
  
  const prompt = `
    You are a seasoned data analyst and business strategist. You have been given a summary of customer feedback. Your task is to provide a high-level strategic analysis for a customer service team.

    Based on the following data summary:
    ---
    ${JSON.stringify(summary, null, 2)}
    ---

    Please generate a strategic analysis in ${isAutoDetect ? 'the same language as the provided summary data' : language}. Your analysis should include:
    1.  **Overview**: A brief, high-level summary of the overall customer sentiment and key takeaways.
    2.  **Key Focus Area**: Identify the single most critical theme or problem from the 'cons' and 'themes' that requires immediate attention.
    3.  **Strategic Steps**: Provide 2-3 high-level, strategic next steps for the customer team.
    4.  **Rationale**: For each step, provide a clear, concise rationale explaining *why* it's important and how it addresses the data.

    Return the analysis as a single, structured JSON object. Ensure all string values in the JSON are plain text without any markdown characters (like *, **, _, #). Do not include any introductory text outside the JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro", // Using a more powerful model for strategic reasoning
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: {
              type: Type.STRING,
              description: "A brief, high-level summary of the customer feedback.",
            },
            keyFocusArea: {
              type: Type.STRING,
              description: "The single most critical issue or theme to focus on.",
            },
            steps: {
              type: Type.ARRAY,
              description: "A list of strategic next steps with their rationale.",
              items: {
                type: Type.OBJECT,
                properties: {
                  step: {
                    type: Type.STRING,
                    description: "A concrete strategic step for the team.",
                  },
                  rationale: {
                    type: Type.STRING,
                    description: "The reasoning behind why this step is recommended, based on the data.",
                  },
                },
                required: ["step", "rationale"],
              },
            },
          },
          required: ["overview", "keyFocusArea", "steps"],
        },
      },
    });

    const text = response.text;
    if (!text) {
        throw new Error("The model did not return a valid strategic analysis. The response was empty.");
    }
    const jsonText = text.trim();
    return JSON.parse(jsonText);

  } catch (error) {
    console.error("Error generating strategic analysis:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate strategic analysis. Gemini API error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the strategic analysis.");
  }
}

export async function generateDraftReply(apiKey: string, complaint: string, language: string, context: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    const isAutoDetect = language.toLowerCase() === 'auto-detect';
    const prompt = `
        You are an empathetic and highly professional customer service agent.
        You have the following background context about the product/service:
        --- CONTEXT ---
        ${context || "No context provided."}
        --- END CONTEXT ---

        A customer has left the following complaint:
        --- COMPLAINT ---
        "${complaint}"
        --- END COMPLAINT ---

        Your task is to draft a concise, helpful, and non-robotic response in ${isAutoDetect ? 'the same language as the complaint' : language}, using the provided context to make your answer more specific and accurate if possible.
        The response should:
        1. Acknowledge the customer's specific problem and validate their frustration.
        2. Apologize for the negative experience.
        3. Briefly suggest a next step for resolution (e.g., "Our support team will reach out," "Here is a link to our help center," or "Could you provide your order number?"). Refer to specific features or policies from the context if relevant.
        4. Do not make promises you can't keep.
        
        Generate only the response text. The response must be plain text and should not contain any markdown formatting (e.g., no asterisks for bolding, no bullet points).
    `;
    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        return response.text ?? "Sorry, I was unable to generate a reply at this time.";
    } catch (error) {
        console.error("Error generating draft reply:", error);
        return "Sorry, I was unable to generate a reply at this time.";
    }
}

export async function askQuestionAboutReviews(apiKey: string, reviewsText: string, question: string, language: string, context: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    const isAutoDetect = language.toLowerCase() === 'auto-detect';
    const prompt = `
        You are a data analyst AI assistant. You have been provided with a dataset of customer reviews and some background context about the product/service. Your job is to answer questions based *only* on the information contained within the reviews and the context. Do not use any external knowledge. If the answer cannot be found, state that clearly. Your answer must be plain text without any markdown formatting (no asterisks, underscores, bullet points, etc.).

        Here is the background context on the product/service:
        --- CONTEXT ---
        ${context || "No context provided."}
        --- END CONTEXT ---
        
        The customer review data is as follows:
        --- REVIEWS ---
        ${reviewsText}
        --- END REVIEWS ---

        Now, please answer this question in ${isAutoDetect ? 'the same language as the question' : language}: "${question}"
    `;
     try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        return response.text ?? "Sorry, I encountered an error trying to answer your question.";
    } catch (error) {
        console.error("Error answering question:", error);
        return "Sorry, I encountered an error trying to answer your question.";
    }
}

export async function generateSuggestedQuestions(apiKey: string, reviewsText: string, context: string): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    You are a data analyst AI. Your task is to help a user explore a dataset of customer reviews by suggesting insightful questions.
    Based on the following product context and raw customer review data, generate 3 to 4 interesting and relevant questions a user might want to ask.

    --- PRODUCT CONTEXT ---
    ${context || "No context provided."}
    --- END CONTEXT ---

    --- CUSTOMER REVIEWS (sample) ---
    ${reviewsText.substring(0, 2000)}...
    --- END REVIEWS ---

    The questions should:
    - Be concise and easy to understand.
    - Go beyond simple keyword searches (e.g., instead of "What about the battery?", ask "What are the biggest complaints regarding battery life?").
    - Be directly answerable from the provided review data.

    Return the result as a single, structured JSON array of strings. Do not include any introductory text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "A list of 3-4 suggested questions to ask about the review data.",
          items: {
            type: Type.STRING
          }
        }
      }
    });
    const text = response.text;
    if (!text) {
        throw new Error("The model did not return any suggested questions. The response was empty.");
    }
    const jsonText = text.trim();
    const questions: string[] = JSON.parse(jsonText);
    return questions;
  } catch (error) {
    console.error("Error generating suggested questions:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate questions. Gemini API error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating suggested questions.");
  }
}

export async function generateSampleReviews(apiKey: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    Generate a realistic-looking sample dataset of 15 customer reviews for a fictional product called "AcoustiMax Pro Headphones".
    The data should be in CSV format with four columns: "Reviewer Name", "Rating (1-5)", "Customer Type", and "Comment".
    For "Customer Type", use values like "New User", "Power User", "Commuter", and "Audiophile".
    Include a mix of positive, negative, and neutral reviews. The comments should be detailed enough to be useful for analysis and reflect the likely priorities of each customer type.
    Do not include any introductory text or explanation, only the raw CSV data including the header row.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const text = response.text;
    if (!text) {
        throw new Error("The model did not return any sample data. The response was empty.");
    }
    return text;
  } catch (error) {
    console.error("Error generating sample reviews:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate sample data. Gemini API error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating sample data.");
  }
}

export async function getTrendAnalysis(apiKey: string, startSummary: Summary, endSummary: Summary, startLabel: string, endLabel: string, language: string): Promise<TrendAnalysis> {
    const ai = new GoogleGenAI({ apiKey });
    const isAutoDetect = language.toLowerCase() === 'auto-detect';
    const prompt = `
        You are an expert business analyst specializing in customer feedback trends. You have been provided with two summaries of customer feedback from two different time periods or sources.

        The first summary, labeled "${startLabel}", is as follows:
        --- START SUMMARY ---
        ${JSON.stringify(startSummary, null, 2)}
        --- END START SUMMARY ---

        The second summary, labeled "${endLabel}", is as follows:
        --- END SUMMARY ---
        ${JSON.stringify(endSummary, null, 2)}
        --- END END SUMMARY ---

        Your task is to perform a comparative trend analysis in ${isAutoDetect ? 'the same language as the provided summaries' : language}. Your output must be a structured JSON object.

        Please perform the following analysis:
        1.  **Narrative Summary**: Write a concise, high-level summary (2-3 sentences) that describes the key changes in customer feedback between "${startLabel}" and "${endLabel}". Mention shifts in sentiment and any notable new or disappearing themes.
        2.  **New Issues**: Identify specific "cons" or negative "themes" that appear in the "${endLabel}" summary but are NOT present in the "${startLabel}" summary. These are emerging problems.
        3.  **Resolved Issues**: Identify specific "cons" or negative "themes" from the "${startLabel}" summary that are NO LONGER present in the "${endLabel}" summary. These are problems that appear to have been fixed.
        4.  **Persistent Themes**: Identify recurring "themes" (positive or negative) that are present and significant in BOTH summaries.

        Return the complete analysis as a single, structured JSON object. Ensure all string values in the JSON are plain text without any markdown characters.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro", // Use a more powerful model for comparative reasoning
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: {
                            type: Type.STRING,
                            description: "A brief narrative summary of the key trends and changes between the two reports."
                        },
                        newIssues: {
                            type: Type.ARRAY,
                            description: `Negative themes or cons that appeared in the second report ("${endLabel}") but not the first ("${startLabel}").`,
                            items: { type: Type.STRING }
                        },
                        resolvedIssues: {
                            type: Type.ARRAY,
                            description: `Negative themes from the first report ("${startLabel}") that are no longer present in the second ("${endLabel}").`,
                            items: { type: Type.STRING }
                        },
                        persistentThemes: {
                            type: Type.ARRAY,
                            description: "Common themes that are present in both reports.",
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["summary", "newIssues", "resolvedIssues", "persistentThemes"]
                }
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("The model did not return a valid trend analysis. The response was empty.");
        }
        const jsonText = text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error generating trend analysis:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate trend analysis. Gemini API error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the trend analysis.");
    }
}

export async function getDeepDiveAnalysis(apiKey: string, reviewsText: string, topic: string, language: string, context: string): Promise<DeepDiveAnalysis> {
    const ai = new GoogleGenAI({ apiKey });
    const isAutoDetect = language.toLowerCase() === 'auto-detect';
    const prompt = `
        You are a data analysis AI. You have been given a dataset of customer reviews, background product context, and a specific topic (a keyword or theme). Your task is to perform a deep-dive analysis on that specific topic based *only* on the provided reviews.

        --- PRODUCT CONTEXT ---
        ${context || "No context provided."}
        --- END CONTEXT ---

        --- CUSTOMER REVIEWS ---
        ${reviewsText}
        --- END REVIEWS ---

        The topic to analyze is: "${topic}"

        Perform the following actions and return the result as a single, structured JSON object in ${isAutoDetect ? 'the same language as the reviews' : language}:
        1.  **Extract Relevant Snippets**: Find and list all direct quotes or sentences from the reviews that explicitly mention or are clearly about the topic "${topic}".
        2.  **Generate a Mini-Summary**: Write a concise, 1-2 sentence summary of what customers are saying about "${topic}" based *only* on the extracted snippets.
        3.  **Perform Sentiment Analysis**: Based *only* on the extracted snippets, count how many are positive, negative, and neutral in their sentiment towards "${topic}".

        Ensure all string values in the JSON are plain text without any markdown characters.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: {
                            type: Type.STRING,
                            description: `A concise summary of customer feedback about the topic: ${topic}.`
                        },
                        snippets: {
                            type: Type.ARRAY,
                            description: `A list of direct quotes from reviews that mention the topic: ${topic}.`,
                            items: { type: Type.STRING }
                        },
                        sentiment: {
                            type: Type.OBJECT,
                            description: `A sentiment breakdown for only the snippets related to the topic: ${topic}.`,
                            properties: {
                                positive: { type: Type.NUMBER },
                                negative: { type: Type.NUMBER },
                                neutral: { type: Type.NUMBER },
                            },
                            required: ["positive", "negative", "neutral"]
                        }
                    },
                    required: ["summary", "snippets", "sentiment"]
                }
            }
        });
        const text = response.text;
        if (!text) {
            throw new Error("The model did not return a valid deep dive analysis. The response was empty.");
        }
        const jsonText = text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating deep dive analysis:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate deep dive analysis. Gemini API error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the deep dive analysis.");
    }
}

export async function getPersonaComparison(apiKey: string, summaries: { segment: string; summary: Summary }[], language: string): Promise<PersonaComparison> {
    const ai = new GoogleGenAI({ apiKey });
    const isAutoDetect = language.toLowerCase() === 'auto-detect';
    const prompt = `
        You are a market research analyst AI. You have been given several summaries of customer feedback, each corresponding to a different customer segment (persona). Your task is to perform a comparative analysis to highlight the unique differences between these segments.

        Here are the feedback summaries for each segment:
        --- DATA ---
        ${JSON.stringify(summaries, null, 2)}
        --- END DATA ---

        Please perform the following analysis in ${isAutoDetect ? 'the same language as the provided summaries' : language} and return the result as a single, structured JSON object:
        1.  **Overall Overview**: Write a brief, high-level overview (2-3 sentences) summarizing the most significant differences or similarities in feedback across all the customer segments.
        2.  **Segment-Specific Differentiators**: For each individual segment, analyze its summary (pros, cons, themes) in comparison to all other segments. Identify 2-3 key points of feedback that are either unique to this segment or significantly more prominent than in others. These should be the most defining characteristics of their experience.

        The goal is to understand what makes each customer segment distinct. Focus on contrast and uniqueness. Do not just list their pros and cons; explain what makes them different from the others.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        overview: {
                            type: Type.STRING,
                            description: "A brief, high-level summary comparing all customer segments."
                        },
                        segmentComparisons: {
                            type: Type.ARRAY,
                            description: "A list of analyses for each segment, highlighting their unique feedback.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    segment: {
                                        type: Type.STRING,
                                        description: "The name of the customer segment."
                                    },
                                    keyDifferentiators: {
                                        type: Type.ARRAY,
                                        description: "A list of 2-3 key feedback points that are unique or most prominent for this segment compared to others.",
                                        items: { type: Type.STRING }
                                    }
                                },
                                required: ["segment", "keyDifferentiators"]
                            }
                        }
                    },
                    required: ["overview", "segmentComparisons"]
                }
            }
        });
        const text = response.text;
        if (!text) {
            throw new Error("The model did not return a valid persona comparison. The response was empty.");
        }
        const jsonText = text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating persona comparison:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate persona comparison. Gemini API error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the persona comparison.");
    }
}

export async function suggestSegmentColumn(apiKey: string, csvHeader: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    Based on the following CSV header row, identify the single column name that most likely represents a customer segment, persona, or user type (e.g., "Customer Type", "User Segment", "Subscription Plan", "Region").

    Return ONLY the column name as a plain string, without any explanation, quotes, or punctuation. If no such column is obvious, return an empty string.

    Header:
    ---
    ${csvHeader}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    // Trim and remove potential quotes from the response
    return response.text?.trim().replace(/^"|"$/g, '') ?? "";
  } catch (error) {
    console.error("Error suggesting segment column:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to suggest column. Gemini API error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while suggesting a column.");
  }
}
