// server/scripts/env-utils.ts

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { filePathForEnvVars } from './database-config-utils'; // Assuming this utility is also needed

// A reusable function to load process.env merged with local .env file content
export const loadEnvironmentVariables = (nodeEnv: string): Record<string, any> => {
    let envData: Record<string, any> = { ...process.env };
    const envVarsFilePath = filePathForEnvVars(nodeEnv);

    if (fs.existsSync(envVarsFilePath)) {
        try {
            const envFileContent = fs.readFileSync(envVarsFilePath, 'utf-8');
            const parsedEnvVars = dotenv.parse(envFileContent);
            envData = { ...envData, ...parsedEnvVars };
        } catch (error) {
            console.error('Error reading or parsing .env file for migrations:', error);
        }
    }
    return envData;
};

