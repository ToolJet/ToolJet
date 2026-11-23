import { v4 as uuidv4 } from 'uuid';
import { decodePromptCookie } from '@/_helpers/utils';
// The module itself, not the @ee/modules/CodeMode barrel, which imports the dashboard back.
import * as buildModeChooser from '@ee/modules/CodeMode/modules/AiBuilder/components/BuildModeChooser';

// Without the enterprise module the server picks, and it builds visually.
const buildModeWithoutAsking = buildModeChooser.buildModeWithoutAsking ?? (async () => undefined);

// The app the Apps dashboard creates from a prompt brought from the ToolJet website (the tj_ai_prompt cookie).
// On Cloud every website prompt lands here, not on /home, so it takes the same build mode /home gives.
export const websitePromptApp = async (promptCookie) => ({
  name: `Untitled App: ${uuidv4()}`,
  prompt: decodePromptCookie(promptCookie),
  buildMode: await buildModeWithoutAsking(),
});
