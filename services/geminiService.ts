import { GoogleGenAI } from "@google/genai";
import { GenerationRequest } from '../types';

// Upgraded to Pro for complex technical reasoning tasks
const MODEL_NAME = "gemini-3-pro-preview";

export const generateEncyclopediaEntry = async (request: GenerationRequest): Promise<string> => {
  // Create a fresh instance for every call to ensure the latest injected API key is used
  // We check multiple possible locations for the injected API key
  const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) 
    ? process.env.API_KEY 
    : (globalThis as any).process?.env?.API_KEY;
    
  const ai = new GoogleGenAI({ apiKey: apiKey || "" });

  const systemInstruction = `
    Role: You are an Expert Maintenance & Reliability Engineer and Technical Data Architect.
    Task: Given a specific glossary term and a brief input definition, generate a "Golden Source" encyclopedia entry suitable for a Vector Database ingestion pipeline.
    Tone: Technical, authoritative, ISO-standard aligned, and concise.

    Format Requirements (STRICT):
    1. YAML Frontmatter: Must be the very first block.
       - id: Create a deterministic ID (e.g., term-cavitation or term-asset).
       - term: The exact term.
       - synonyms: A list of 3-5 alternative words.
       - tags: Taxonomy tags (e.g., "Reliability", "Inventory", "ISO 55000").
       - related_terms: A list of IDs/terms.
       - last_updated: Current date YYYY-MM-DD.
    2. Document Title: The first line of the text body must be the term itself as a Level 1 Header (# [Term]).
    3. Section Headers: Level 2 Headers (##).

    Required Sections:
    1. # [Term Name]
    2. ## Definition: Precise standard definition.
    3. ## Detailed Explanation: Technical context and function.
    4. ## Key Data Attributes: Specific data fields to track (e.g., MTBF, P-F Interval).
    5. ## Failure Modes & Risks: How it fails/risks.
    6. ## Best Practices: Bulleted advice.

    Output: Produce only Markdown.
  `;

  const prompt = `
    Term: ${request.term}
    Draft Definition: ${request.draftDefinition}
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.3,
      topK: 64,
      topP: 0.95,
      // Max budget for gemini-3-pro-preview to ensure deep reliability reasoning
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });

  if (response.text) {
    return response.text;
  } else {
    throw new Error("No response generated from the technical architecture engine.");
  }
};