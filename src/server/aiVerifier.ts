/**
 * CredSense AI - AI Context Verification Engine
 * Masked-only context verification using Gemini 3.7 Flash or Deterministic Local Heuristics
 */

import { GoogleGenAI, Type } from '@google/genai';
import { AIClassification } from '../types';

export interface VerificationResult {
  classification: AIClassification;
  confidence: number;
  reason: string;
  contextAnalysis: string;
  recommendedAction: string;
  detectionMethod: string;
  mode: 'gemini' | 'local';
}

interface VerificationInput {
  secretType: string;
  detector?: string;
  maskedSecret: string;
  variableName: string;
  filePath: string;
  lineNumber: number;
  maskedContext: string;
  entropyScore: number;
}

// Deterministic Local Heuristic Fallback Engine
export function runLocalVerification(input: VerificationInput): VerificationResult {
  const pathLower = input.filePath.toLowerCase();
  const contextLower = input.maskedContext.toLowerCase();
  const varLower = input.variableName.toLowerCase();
  const maskedLower = input.maskedSecret.toLowerCase();

  // Known test/demo/example indicators in path or file
  const isTestPath =
    pathLower.includes('test') ||
    pathLower.includes('spec') ||
    pathLower.includes('mock') ||
    pathLower.includes('fixture') ||
    pathLower.includes('dummy') ||
    pathLower.includes('cypress');

  const isExamplePath =
    pathLower.includes('example') ||
    pathLower.includes('.env.example') ||
    pathLower.includes('.env.sample') ||
    pathLower.includes('.env.template') ||
    pathLower.includes('sample') ||
    pathLower.includes('demo') ||
    pathLower.includes('docs/') ||
    pathLower.includes('readme');

  const hasDemoKeywords =
    contextLower.includes('example') ||
    contextLower.includes('demo') ||
    contextLower.includes('dummy') ||
    contextLower.includes('sample') ||
    contextLower.includes('fake') ||
    contextLower.includes('test_') ||
    contextLower.includes('placeholder') ||
    contextLower.includes('not_real') ||
    varLower.includes('demo') ||
    varLower.includes('test') ||
    varLower.includes('example') ||
    varLower.includes('sample');

  const isKnownDummyPattern =
    maskedLower.includes('iosfodnn7example') ||
    maskedLower.includes('not_real') ||
    maskedLower.includes('123456') ||
    maskedLower.includes('demo_') ||
    maskedLower.includes('changeme') ||
    maskedLower.includes('password123');

  // Classification logic
  if (isKnownDummyPattern || isExamplePath || pathLower.endsWith('.example')) {
    return {
      classification: 'EXAMPLE',
      confidence: 0.95,
      reason: `The file is an example configuration or documentation file and the credential follows a known demonstration template pattern.`,
      contextAnalysis: 'Example / Documentation Template',
      recommendedAction: 'Keep as sample placeholder; verify no real credentials replace it in production.',
      detectionMethod: 'Regex Pattern + Shannon Entropy',
      mode: 'local',
    };
  }

  if (isTestPath || hasDemoKeywords) {
    return {
      classification: 'TEST',
      confidence: 0.92,
      reason: `Credential candidate is used inside test fixtures, mock suites, or accompanied by explicit test keyword markers.`,
      contextAnalysis: 'Test Suite / Mock Fixture',
      recommendedAction: 'Ensure mocked token cannot grant access to live cloud environments.',
      detectionMethod: 'Regex Pattern + Shannon Entropy',
      mode: 'local',
    };
  }

  if (input.entropyScore < 2.5) {
    return {
      classification: 'FALSE_POSITIVE',
      confidence: 0.88,
      reason: `Entropy score (${input.entropyScore}) is below realistic cryptographic credential thresholds, likely a repetitive non-secret identifier.`,
      contextAnalysis: 'Low-Entropy Placeholder',
      recommendedAction: 'Dismiss alert or add to secret scanner exclusion list if confirmed non-sensitive.',
      detectionMethod: 'Regex Pattern + Shannon Entropy',
      mode: 'local',
    };
  }

  // Active production-like code files (.env, config, server, client, controllers)
  const isProductionConfigFile =
    pathLower.endsWith('.env') ||
    pathLower.endsWith('.env.local') ||
    pathLower.endsWith('.env.production') ||
    pathLower.includes('config') ||
    pathLower.includes('secret') ||
    pathLower.includes('auth') ||
    pathLower.includes('api') ||
    pathLower.includes('prod');

  if (isProductionConfigFile && input.entropyScore >= 3.4) {
    return {
      classification: 'REAL',
      confidence: 0.96,
      reason: `High-confidence credential pattern (${input.entropyScore} entropy) found in a non-example configuration or production source file.`,
      contextAnalysis: 'Production Configuration',
      recommendedAction: 'Immediately rotate credential, check audit logs, and purge from Git history.',
      detectionMethod: 'Regex Pattern + Shannon Entropy',
      mode: 'local',
    };
  }

  return {
    classification: 'UNKNOWN',
    confidence: 0.65,
    reason: `Credential found in code file (${input.filePath}); requires manual inspection to confirm authenticity.`,
    contextAnalysis: 'General Source Code Context',
    recommendedAction: 'Inspect code context and verify whether token is active in external service.',
    detectionMethod: 'Regex Pattern + Shannon Entropy',
    mode: 'local',
  };
}

// AI Context Verifier using Gemini with Resilient Multi-tier Fallback
export async function verifySecretWithAI(input: VerificationInput): Promise<VerificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // If no API key or empty placeholder, run local fallback immediately
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return runLocalVerification(input);
  }

  const prompt = `You are a senior cybersecurity engineer evaluating a detected secret candidate in source code.
CRITICAL PRIVACY MANDATE: The secret value has been safely masked (${input.maskedSecret}). Do NOT try to guess or hallucinate the raw secret.

Evaluate the surrounding context to classify whether this credential candidate is:
- "REAL": Appears to be an authentic, production-grade hardcoded credential requiring immediate revocation.
- "TEST": Intentionally used inside unit tests, automated integration tests, or mock test fixtures.
- "EXAMPLE": Included in documentation, .env.example, tutorials, or placeholder samples.
- "FALSE_POSITIVE": Not an actual secret (e.g. low-entropy placeholder, regex match on non-secret identifier or format string).
- "UNKNOWN": Ambiguous context where authenticity cannot be reliably determined.

FINDING METADATA:
- Secret Type: ${input.secretType}
- Target Variable/Key: ${input.variableName}
- File Path: ${input.filePath}
- Line Number: ${input.lineNumber}
- Shannon Entropy Score: ${input.entropyScore}

SURROUNDING CODE CONTEXT (Masked):
\`\`\`
${input.maskedContext}
\`\`\`

Provide your classification, confidence (0.0 to 1.0), a concise 1-2 sentence technical reason, contextAnalysis description (e.g., "Production Configuration", "Test Suite / Mock Fixture", "Example Template", "Low Entropy Placeholder"), and recommended_action.`;

  const modelsToTry = ['gemini-3.7-flash', 'gemini-flash-latest'];

  for (const model of modelsToTry) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
          timeout: 5000, // 5 second timeout per call to prevent stalls
        },
      });

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              classification: {
                type: Type.STRING,
                enum: ['REAL', 'TEST', 'EXAMPLE', 'FALSE_POSITIVE', 'UNKNOWN'],
                description: 'Classification of the detected secret',
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Confidence score between 0.0 and 1.0',
              },
              reason: {
                type: Type.STRING,
                description: 'Short technical rationale explaining the classification based on context',
              },
              context_analysis: {
                type: Type.STRING,
                description: 'Context category e.g. Production Configuration, Test Suite, Example Template',
              },
              recommended_action: {
                type: Type.STRING,
                description: 'Immediate recommendation for the engineer',
              },
            },
            required: ['classification', 'confidence', 'reason'],
          },
        },
      });

      const jsonText = response.text?.trim();
      if (jsonText) {
        const parsed = JSON.parse(jsonText);
        const validClassifications: AIClassification[] = ['REAL', 'TEST', 'EXAMPLE', 'FALSE_POSITIVE', 'UNKNOWN'];
        const classification: AIClassification = validClassifications.includes(parsed.classification)
          ? parsed.classification
          : 'UNKNOWN';

        return {
          classification,
          confidence: Math.max(0.1, Math.min(1.0, Number(parsed.confidence) || 0.85)),
          reason: parsed.reason || 'Classified via Gemini AI contextual analysis.',
          contextAnalysis: parsed.context_analysis || (classification === 'REAL' ? 'Production Configuration' : classification === 'TEST' ? 'Test Suite' : classification === 'EXAMPLE' ? 'Example Template' : 'Code Context'),
          recommendedAction: parsed.recommended_action || (classification === 'REAL' ? 'Rotate exposed credential and purge from history.' : 'Review and confirm non-sensitive usage.'),
          detectionMethod: 'Regex Pattern + Shannon Entropy',
          mode: 'gemini',
        };
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isTemporary = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand') || errMsg.includes('429') || errMsg.includes('timeout');
      
      if (isTemporary && model !== modelsToTry[modelsToTry.length - 1]) {
        continue;
      }
      
      // Clean, single-line log and graceful fallback
      console.log(`[AI Verifier] Notice for model ${model}: ${isTemporary ? 'Cloud service high demand/timeout' : 'API notice'}. Activating deterministic local heuristic verification engine.`);
      break;
    }
  }

  // Graceful local heuristic fallback
  const localResult = runLocalVerification(input);
  return localResult;
}
