// AI features are disabled as per user request.
// These stubs exist to prevent build errors if referenced elsewhere.

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string | null> => {
  return null;
};

export const analyzePortfolio = async (holdings: any[], totalValue: number): Promise<string | null> => {
  return null;
};

export const parseTransactionAI = async (input: string, categories: string[]) => {
  return null;
};