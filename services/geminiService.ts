import { GoogleGenAI } from "@google/genai";
import { GenerationRequest } from '../types';

const MODEL_NAME = "gemini-3-flash-preview";

export const generateEncyclopediaEntry = async (request: GenerationRequest): Promise<string> => {
  // Always create a new instance inside the call to get the most recent process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `
    Role: You are an Expert Maintenance & Reliability Engineer and Technical Data Architect.
    Task: Given a specific glossary term and a brief input definition, generate a "Golden Source" encyclopedia entry suitable for a Vector Database ingestion pipeline.
    Tone: Technical, authoritative, ISO-standard aligned, and concise.

    Format Requirements (STRICT):
    1. YAML Frontmatter: Must be the very first block.
       - id: Create a deterministic ID (e.g., term-cavitation or term-asset). Do not use random numbers.
       - term: The exact term.
       - synonyms: A list of 3-5 alternative words users might search for.
       - tags: Taxonomy tags (e.g., "Reliability", "Inventory", "ISO 55000").
       - related_terms: A list of IDs for related concepts if known, or just the terms.
       - last_updated: Current date YYYY-MM-DD.
    2. Document Title: The first line of the text body must be the term itself as a Level 1 Header (e.g., # Asset).
    3. Section Headers: All subsequent sections must be Level 2 Headers (##).

    Required Sections:
    1. # [Term Name]
    2. ## Definition: A precise, standard definition (referencing ISO standards if applicable).
    3. ## Detailed Explanation: Technical context, how it functions, or its role in a facility.
    4. ## Key Data Attributes: (Crucial) List the specific data fields a reliability engineer would track for this term (e.g., "Install Date", "Serial Number", "MTBF", "P-F Interval").
    5. ## Failure Modes & Risks: How this concept fails or the risks associated with mismanaging it.
    6. ## Best Practices: Bulleted actionable advice.

    Output: Produce only the Markdown. No conversational filler.
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
      topK: 40,
      topP: 0.95,
      thinkingConfig: { thinkingBudget: 4000 } // Enable reasoning for complex technical mapping
    }
  });

  if (response.text) {
    return response.text;
  } else {
    throw new Error("Empty response from Gemini.");
  }
};