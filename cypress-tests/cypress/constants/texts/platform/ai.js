export const aiText = {
  // LLM Key Page
  llmKeyCardTitle: "LLM key",
  llmKeySaveSuccess: "LLM key updated successfully",
  llmKeySaveError: "Something went wrong while saving the LLM key",

  // Upgrade tooltip (uses substring to avoid smart quote mismatch)
  upgradeTooltip: "Upgrade your plan to access this feature",

  // API Key Required — Anthropic
  apiKeyRequiredMessage:
    "An Anthropic API key is required for AI features. Connect your key or contact admin about using ToolJet's default key.",
  connectApiKeyButton: "Connect your API key",
  learnMoreButton: "Learn more",

  // API Key Required — Gemini
  geminiKeyRequiredMessage:
    "Your Google service account credentials are not configured. Connect your credentials or contact your admin.",
  geminiConnectButton: "Connect your credentials",
  geminiInvalidKeyMessage:
    "The Google service account credentials you added are invalid. Please update your credentials.",
  geminiChangeKeyButton: "Change your credentials",

  // Copilot panel error messages
  anthropicMissingCopilotError: "ANTHROPIC_API_KEY is not configured.",
  anthropicInvalidCopilotError:
    "Invalid ANTHROPIC_API_KEY provided, please check your credentials.",
  geminiMissingCopilotError: "GEMINI_API_KEY is not configured.",
  geminiInvalidCopilotError:
    "Invalid GEMINI_API_KEY provided, please check your credentials.",
};
