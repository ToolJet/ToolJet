/* eslint-disable prettier/prettier */
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';

interface QueryOptions {
    text?: string;
    url?: string;
    email?: string;
    file?: string; 
    resume?: string;
    language?: string;
    requested_service?: string;
}

interface SourceOptions {
    apiKey: string;
}

const POLLING_INTERVAL = 3000; // 2 seconds
const MAX_RETRIES = 30; // Maximum number of status checks

export async function getValidatedEmail(queryOptions: QueryOptions, sourceOptions: SourceOptions): Promise<string> {
    const { email } = queryOptions;
    const { apiKey } = sourceOptions;
    try {
        const response = await axios.post('https://api.apyhub.com/validate/email/dns', {
            email: email
        }, {
            headers: {
                'apy-token': apiKey,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error validating email:', error);
        throw error;
    }
}

export async function getSummarizedContent(queryOptions: QueryOptions, sourceOptions: SourceOptions): Promise<string> {
    const { text, url } = queryOptions;
    const { apiKey } = sourceOptions;

    try {
        let response;
        if (text) {
            response = await axios.post('https://api.apyhub.com/ai/summarize-text', {
                text: text
            }, {
                headers: {
                    'apy-token': apiKey,
                    'Content-Type': 'application/json'
                }
            });
        } else if (url) {
            response = await axios.post('https://api.apyhub.com/ai/summarize-url', {
                url: url
            }, {
                headers: {
                    'apy-token': apiKey,
                    'Content-Type': 'application/json'
                }
            });
        } else {
            throw new Error('Either text or url must be provided');
        }

        return response.data;
    } catch (error) {
        console.error('Error summarizing content:', error);
        throw error;
    }
}


interface JobResponse {
    status_url: string;
    job_id: string;
}

interface JobStatusResponse {
    data: {
        attributes: {
            status: string;
            result: any;
        }
    }
}



export function base64ToPdfFile(base64String: string, filename: string): string {
    try {
        const base64Data = base64String.includes(',')
            ? base64String.split(',')[1]
            : base64String;

        const pdfBuffer = Buffer.from(base64Data, 'base64');
        const filePath = path.join(__dirname, filename);
        fs.writeFileSync(filePath, pdfBuffer);

        return filePath;
    } catch (error) {
        console.error('Error creating PDF file:', error);
        throw new Error('Failed to create PDF file from Base64 string');
    }
}

async function submitResumeJob(options: QueryOptions, sourceOptions: SourceOptions): Promise<JobResponse> {

    const formData = new FormData();
    const pdfFilePath = base64ToPdfFile(options.resume, 'resume.pdf');
    formData.append('file', fs.createReadStream(pdfFilePath));
    formData.append('language', options.language);

    try {
        const response = await axios.post(
            'https://api.apyhub.com/sharpapi/api/v1/hr/parse_resume',
            formData,
            {
                headers: {
                    'apy-token': sourceOptions.apiKey,
                    ...formData.getHeaders(),
                    'content-type': `multipart/form-data; boundary=${formData.getBoundary()}`
                }
            }
        );
        console.log('Job submitted successfully, response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error submitting resume job:', error.response?.data || error);
        throw error;
    }
}

async function checkJobStatus(jobId: string, apiKey: string): Promise<JobStatusResponse> {
    try {
        console.log('Starting resume parsing process');
        const response = await axios.get(
            `https://api.apyhub.com/sharpapi/api/v1/hr/parse_resume/job/status/${jobId}`,
            {
                headers: {
                    'apy-token': apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error checking job status:', error);
        throw error;
    }
}

export async function getParsedResume(queryOptions: QueryOptions, sourceOptions: SourceOptions): Promise<any> {
    try {
        // Submit job
        console.log('Starting resume parsing process');
        const jobResponse = await submitResumeJob(queryOptions, sourceOptions);
        let retries = 0;

        // Poll for results
        while (retries < MAX_RETRIES) {
            console.log(`Polling attempt ${retries + 1}/${MAX_RETRIES}`);
            const statusResponse = await checkJobStatus(jobResponse.job_id, sourceOptions.apiKey);
            console.log('Status response:', statusResponse.data.attributes.status);
            if (statusResponse.data.attributes.status === 'success') {
                console.log('Parsing completed successfully');
                return statusResponse.data.attributes.result;
            }

            if (statusResponse.data.attributes.status === 'failed') {
                throw new Error('Resume parsing failed');
            }

            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
            retries++;
        }

        throw new Error('Job timeout: Maximum retries exceeded');
    } catch (error) {
        console.error('Error in resume parsing:', error);
        throw error;
    }
}


interface TranslationOptions {
    content: string;
    language: string;
    voicetone: string;
}

interface TranslationJobResponse {
    status_url: string;
    job_id: string;
}

interface TranslationStatusResponse {
    data: {
        attributes: {
            status: string;
            result: {
                content: string;
                to_language: string;
                from_language: string;
            }
        }
    }
}

async function submitTranslationJob(options: TranslationOptions, sourceOptions: SourceOptions): Promise<TranslationJobResponse> {
    console.log('Starting translation job submission...', { content: options.content, language: options.language });
    try {
        const response = await axios.post(
            'https://api.apyhub.com/sharpapi/api/v1/content/translate',
            {
                content: options.content,
                language: options.language,
                voice_tone: options.voicetone
            },
            {
                headers: {
                    'apy-token': sourceOptions.apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Translation job submitted successfully', { jobId: response.data.job_id });
        return response.data;
    } catch (error) {
        console.error('Error submitting translation job:', error);
        throw error;
    }
}

async function checkTranslationStatus(jobId: string, apiKey: string): Promise<TranslationStatusResponse> {
    console.log('Checking translation status...', { jobId });
    try {
        const response = await axios.get(
            `https://api.apyhub.com/sharpapi/api/v1/content/translate/job/status/${jobId}`,
            {
                headers: {
                    'apy-token': apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Status check response:', {
            jobId,
            status: response.data.data.attributes.status
        });
        return response.data;
    } catch (error) {
        console.error('Error checking translation status:', error);
        throw error;
    }
}

export async function getTranslatedContent(queryOptions: TranslationOptions, sourceOptions: SourceOptions): Promise<any> {
    console.log('Starting translation process...', { options: queryOptions });

    try {
        const jobResponse = await submitTranslationJob(queryOptions, sourceOptions);
        let retries = 0;

        while (retries < MAX_RETRIES) {
            console.log(`Polling attempt ${retries + 1}/${MAX_RETRIES}`);
            const statusResponse = await checkTranslationStatus(jobResponse.job_id, sourceOptions.apiKey);

            if (statusResponse.data.attributes.status === 'success') {
                console.log('Translation completed successfully', statusResponse.data.attributes.result.content);
                return statusResponse.data.attributes.result;
            }

            if (statusResponse.data.attributes.status === 'failed') {
                console.error('Translation job failed');
                return 'Translation failed';
            }

            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
            retries++;
        }

        console.error('Translation timeout reached');
        return 'Job timeout: Maximum retries exceeded';
    } catch (error) {
        console.error('Translation process error:', error);
        return `Error: ${error.message || 'Unknown error occurred'}`;
    }
}

// Add these interfaces
interface ProofreadOptions {
    content: string;
}

interface ProofreadJobResponse {
    status_url: string;
    job_id: string;
}

interface ProofreadStatusResponse {
    data: {
        attributes: {
            status: string;
            result: string;
        }
    }
}

// Add these functions
async function submitProofreadJob(options: ProofreadOptions, sourceOptions: SourceOptions): Promise<ProofreadJobResponse> {
    console.log('Starting proofreading job submission...', { content: options.content });
    try {
        const response = await axios.post(
            'https://api.apyhub.com/sharpapi/api/v1/content/proofread',
            {
                content: options.content
            },
            {
                headers: {
                    'apy-token': sourceOptions.apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Proofreading job submitted successfully', { jobId: response.data.job_id });
        return response.data;
    } catch (error) {
        console.error('Error submitting proofreading job:', error);
        throw error;
    }
}

async function checkProofreadStatus(jobId: string, apiKey: string): Promise<ProofreadStatusResponse> {
    console.log('Checking proofreading status...', { jobId });
    try {
        const response = await axios.get(
            `https://api.apyhub.com/sharpapi/api/v1/content/proofread/job/status/${jobId}`,
            {
                headers: {
                    'apy-token': apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Status check response:', {
            jobId,
            status: response.data.data.attributes.status
        });
        return response.data;
    } catch (error) {
        console.error('Error checking proofreading status:', error);
        throw error;
    }
}

export async function getProofreadContent(queryOptions: ProofreadOptions, sourceOptions: SourceOptions): Promise<any> {
    console.log('Starting proofreading process...', { options: queryOptions });

    try {
        const jobResponse = await submitProofreadJob(queryOptions, sourceOptions);
        let retries = 0;

        while (retries < MAX_RETRIES) {
            console.log(`Polling attempt ${retries + 1}/${MAX_RETRIES}`);
            const statusResponse = await checkProofreadStatus(jobResponse.job_id, sourceOptions.apiKey);

            if (statusResponse.data.attributes.status === 'success') {
                console.log('Proofreading completed successfully');
                return statusResponse.data.attributes.result;
            }

            if (statusResponse.data.attributes.status === 'failed') {
                console.error('Proofreading job failed');
                return 'Proofreading failed';
            }

            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
            retries++;
        }

        console.error('Proofreading timeout reached');
        return 'Job timeout: Maximum retries exceeded';
    } catch (error) {
        console.error('Proofreading process error:', error);
        return `Error: ${error.message || 'Unknown error occurred'}`;
    }
}

// Add these interfaces
interface ParaphraseOptions {
    content: string;
    max_length?: number;
    language?: string;
    voice_tone?: string;
    context?: string;
}

interface ParaphraseJobResponse {
    status_url: string;
    job_id: string;
}

interface ParaphraseStatusResponse {
    data: {
        attributes: {
            status: string;
            type: string;
            result: {
                paraphrase: string;
            }
        }
    }
}

async function submitParaphraseJob(options: ParaphraseOptions, sourceOptions: SourceOptions): Promise<ParaphraseJobResponse> {
    console.log('Starting paraphrase job submission...', { content: options.content });
    try {
        const response = await axios.post(
            'https://api.apyhub.com/sharpapi/api/v1/content/paraphrase',
            {
                content: options.content,
                max_length: options.max_length || 500,
                language: options.language || 'English',
                voice_tone: options.voice_tone,
                context: options.context
            },
            {
                headers: {
                    'apy-token': sourceOptions.apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Paraphrase job submitted successfully', { jobId: response.data.job_id });
        return response.data;
    } catch (error) {
        console.error('Error submitting paraphrase job:', error);
        throw error;
    }
}

async function checkParaphraseStatus(jobId: string, apiKey: string): Promise<ParaphraseStatusResponse> {
    console.log('Checking paraphrase status...', { jobId });
    try {
        const response = await axios.get(
            `https://api.apyhub.com/sharpapi/api/v1/content/paraphrase/job/status/${jobId}`,
            {
                headers: {
                    'apy-token': apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error checking paraphrase status:', error);
        throw error;
    }
}

export async function getParaphrasedContent(queryOptions: ParaphraseOptions, sourceOptions: SourceOptions): Promise<any> {
    console.log('Starting paraphrase process...', { options: queryOptions });

    try {
        const jobResponse = await submitParaphraseJob(queryOptions, sourceOptions);
        let retries = 0;

        while (retries < MAX_RETRIES) {
            console.log(`Polling attempt ${retries + 1}/${MAX_RETRIES}`);
            const statusResponse = await checkParaphraseStatus(jobResponse.job_id, sourceOptions.apiKey);

            if (statusResponse.data.attributes.status === 'success') {
                console.log('Paraphrase completed successfully');
                return statusResponse.data.attributes.result;
            }

            if (statusResponse.data.attributes.status === 'failed') {
                console.error('Paraphrase job failed');
                return 'Paraphrase failed';
            }

            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
            retries++;
        }

        console.error('Paraphrase timeout reached');
        return 'Job timeout: Maximum retries exceeded';
    } catch (error) {
        console.error('Paraphrase process error:', error);
        return `Error: ${error.message || 'Unknown error occurred'}`;
    }
}

// Add these interfaces
interface SeoTagsOptions {
    content: string;
    voice_tone?: string;
    language?: string;
}

interface SeoTagsJobResponse {
    status_url: string;
    job_id: string;
}

interface SeoTagsStatusResponse {
    data: {
        attributes: {
            status: string;
            type: string;
            result: {
                meta_tags: {
                    title: string;
                    author: string;
                    'og:url': string;
                    'og:type': string;
                    keywords: string;
                    'og:image': string;
                    'og:title': string;
                    description: string;
                    'og:site_name': string;
                    'twitter:card': string;
                    'twitter:image': string;
                    'twitter:title': string;
                    'og:description': string;
                    'twitter:creator': string;
                    'twitter:description': string;
                }
            }
        }
    }
}

async function submitSeoTagsJob(options: SeoTagsOptions, sourceOptions: SourceOptions): Promise<SeoTagsJobResponse> {
    console.log('Starting SEO tags generation job...', { content: options.content });
    try {
        const response = await axios.post(
            'https://api.apyhub.com/sharpapi/api/v1/seo/generate_tags',
            {
                content: options.content,
                voice_tone: options.voice_tone || 'joyous',
                language: options.language || 'English'
            },
            {
                headers: {
                    'apy-token': sourceOptions.apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('SEO tags generation job submitted successfully', { jobId: response.data.job_id });
        return response.data;
    } catch (error) {
        console.error('Error submitting SEO tags generation job:', error);
        throw error;
    }
}

async function checkSeoTagsStatus(jobId: string, apiKey: string): Promise<SeoTagsStatusResponse> {
    console.log('Checking SEO tags generation status...', { jobId });
    try {
        const response = await axios.get(
            `https://api.apyhub.com/sharpapi/api/v1/seo/generate_tags/job/status/${jobId}`,
            {
                headers: {
                    'apy-token': apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error checking SEO tags generation status:', error);
        throw error;
    }
}

export async function getSeoTags(queryOptions: SeoTagsOptions, sourceOptions: SourceOptions): Promise<any> {
    console.log('Starting SEO tags generation process...', { options: queryOptions });

    try {
        const jobResponse = await submitSeoTagsJob(queryOptions, sourceOptions);
        let retries = 0;

        while (retries < MAX_RETRIES) {
            console.log(`Polling attempt ${retries + 1}/${MAX_RETRIES}`);
            const statusResponse = await checkSeoTagsStatus(jobResponse.job_id, sourceOptions.apiKey);

            if (statusResponse.data.attributes.status === 'success') {
                console.log('SEO tags generation completed successfully');
                return statusResponse.data.attributes.result;
            }

            if (statusResponse.data.attributes.status === 'failed') {
                console.error('SEO tags generation job failed');
                return 'SEO tags generation failed';
            }

            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
            retries++;
        }

        console.error('SEO tags generation timeout reached');
        return 'Job timeout: Maximum retries exceeded';
    } catch (error) {
        console.error('SEO tags generation process error:', error);
        return `Error: ${error.message || 'Unknown error occurred'}`;
    }
}

// Add these interfaces after the existing interfaces
interface DocumentExtractionOptions {
    url?: string;
    file?: string;
}

interface DocumentExtractionResponse {
    data: {
        [key: string]: {
            content: string;
        }
    }
}

// Add these new functions before the exports
async function extractDocumentFromUrl(options: DocumentExtractionOptions, sourceOptions: SourceOptions): Promise<DocumentExtractionResponse> {
    try {
        const response = await axios.post(
            'https://api.apyhub.com/ai/document/extract/read/url',
            {
                url: options.url,
                requested_service: "apyhub"
            },
            {
                headers: {
                    'apy-token': sourceOptions.apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error extracting document from URL:', error);
        throw error;
    }
}

async function extractDocumentFromFile(options: DocumentExtractionOptions, sourceOptions: SourceOptions): Promise<DocumentExtractionResponse> {
   console.log('Extracting document from file...');
    try {
        const formData = new FormData();
        const pdfFilePath = base64ToPdfFile(options.file, 'document.pdf');
        console.log('PDF file path:', pdfFilePath);
        formData.append('file', fs.createReadStream(pdfFilePath));
        formData.append('requested_service', "apyhub");

        const response = await axios.post(
            'https://api.apyhub.com/ai/document/extract/read/file',
            formData,
            {
                headers: {
                    'apy-token': sourceOptions.apiKey,
                    ...formData.getHeaders()
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error extracting document from file:', error);
        throw error;
    }
}

// Add this new export function
export async function getDocumentExtraction(queryOptions: DocumentExtractionOptions, sourceOptions: SourceOptions): Promise<any> {
    console.log('Starting document extraction process...', { options: queryOptions });
    const { file, url } = queryOptions;
    try {
        let response;
        if (url) {
            response = await extractDocumentFromUrl(queryOptions, sourceOptions);
        } else if (file) {
            response = await extractDocumentFromFile(queryOptions, sourceOptions);
        } else {
            throw new Error('Either URL or file must be provided');
        }
        return response.data;
    } catch (error) {
        console.error('Document extraction process error:', error);
        throw error;
    }
}