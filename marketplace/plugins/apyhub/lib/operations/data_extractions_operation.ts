/* eslint-disable prettier/prettier */

import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import { base64ToPdfFile } from '../query_operations';
import { DocumentDataExtractionOptions, DocumentDataExtractionResponse, PdfExtractOptions, PdfExtractResponse, SourceOptions, TranslationOptions, TranslationResponse, WebpageExtractOptions, WebpageExtractResponse } from '../types';


async function translateDocumentFromUrl(options: TranslationOptions, sourceOptions: SourceOptions): Promise<TranslationResponse> {
    try {
        const response = await axios.post(
            `https://api.apyhub.com/translate/url?transliteration=${options.transliteration || false}`,
            {
                url: options.url,
                language: options.language
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
        console.error('Error translating document from URL:', error);
        throw error;
    }
}

async function translateDocumentFromFile(options: TranslationOptions, sourceOptions: SourceOptions): Promise<TranslationResponse> {
    try {
        const formData = new FormData();
        const fileType = options.file_type || 'pdf';
        const documentPath = base64ToPdfFile(options.file, `document-${Date.now()}.${fileType}`);
        console.log('Document path:', documentPath);
        
        // Append required form fields
        formData.append('file', fs.createReadStream(documentPath));
        formData.append('language', options.language);

        // Construct URL with query parameters
        const url = new URL('https://api.apyhub.com/translate/file');
        url.searchParams.append('file_type', fileType);
        url.searchParams.append('transliteration', String(options.transliteration || false));

        const response = await axios.post(
            url.toString(),
            formData,
            {
                headers: {
                    'apy-token': sourceOptions.apiKey,
                    ...formData.getHeaders()
                }
            }
        );

        // Clean up temporary file
        fs.unlinkSync(documentPath);
        return response.data;
    } catch (error) {
        console.error('Error translating document from file:', error);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        throw error;
    }
}

async function extractWebpageText(options: WebpageExtractOptions, sourceOptions: SourceOptions): Promise<WebpageExtractResponse> {
    try {
        const url = new URL('https://api.apyhub.com/extract/text/webpage');
        url.searchParams.append('url', options.url);
        url.searchParams.append('preserve_paragraphs', String(options.preserve_paragraphs || true));

        const response = await axios.get(url.toString(), {
            headers: {
                'apy-token': sourceOptions.apiKey,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error extracting text from webpage:', error);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        throw error;
    }
}

async function extractPdfTextFromUrl(options: PdfExtractOptions, sourceOptions: SourceOptions): Promise<PdfExtractResponse> {
    try {
        const response = await axios.post(
            'https://api.apyhub.com/extract/text/pdf-url',
            {
                url: options.url
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
        console.error('Error extracting Text from PDF URL:', error);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
    }
}

async function extractPdfTextFromFile(options: PdfExtractOptions, sourceOptions: SourceOptions): Promise<PdfExtractResponse> {
    try {
        const formData = new FormData();
        const pdfPath = base64ToPdfFile(options.file, `pdf-${Date.now()}.pdf`);
        
        formData.append('file', fs.createReadStream(pdfPath));

        const response = await axios.post(
            'https://api.apyhub.com/extract/text/pdf-file',
            formData,
            {
                headers: {
                    'apy-token': sourceOptions.apiKey,
                    ...formData.getHeaders()
                }
            }
        );

        // Clean up temporary file
        fs.unlinkSync(pdfPath);
        return response.data;
    } catch (error) {
        console.error('Error extracting text from PDF file:', error);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        throw error;
    }
}

async function extractDocumentDataFromUrl(options: DocumentDataExtractionOptions, sourceOptions: SourceOptions): Promise<DocumentDataExtractionResponse> {
    try {
        const response = await axios.post(
            'https://api.apyhub.com/ai/document/extract/document/url',
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
        console.error('Error extracting document data from URL:', error);
        throw error;
    }
}

async function extractDocumentDataFromFile(options: DocumentDataExtractionOptions, sourceOptions: SourceOptions): Promise<DocumentDataExtractionResponse> {
    try {
        const formData = new FormData();
        const documentPath = base64ToPdfFile(options.file, `document-${Date.now()}.pdf`);
        
        formData.append('file', fs.createReadStream(documentPath));
        formData.append('requested_service', "apyhub");

        const response = await axios.post(
            'https://api.apyhub.com/ai/document/extract/document/file',
            formData,
            {
                headers: {
                    'apy-token': sourceOptions.apiKey,
                    ...formData.getHeaders()
                }
            }
        );

        // Clean up temporary file
        fs.unlinkSync(documentPath);
        return response.data;
    } catch (error) {
        console.error('Error extracting document data from file:', error);
        throw error;
    }
}

export async function translateDocument(queryOptions: TranslationOptions, sourceOptions: SourceOptions): Promise<TranslationResponse> {
    console.log('Starting document translation process...', { options: queryOptions });

    const { file, url } = queryOptions;

    try {
        let result: TranslationResponse;
        if (url) {
            console.log('URL provided for translation');
            result =  await translateDocumentFromUrl(queryOptions, sourceOptions);
            return result;
        } else if (file) {
            console.log('File provided for translation');
            result = await translateDocumentFromFile(queryOptions, sourceOptions);
            return result;
        } else {
            throw new Error('Either URL or file must be provided');
        }
    } catch (error) {
        console.error('Document translation process error:', error);
        throw error;
    }
}

export async function getWebpageText(queryOptions: WebpageExtractOptions, sourceOptions: SourceOptions): Promise<string> {
    console.log('Starting webpage text extraction...', { options: queryOptions });

    try {
        const result = await extractWebpageText(queryOptions, sourceOptions);
        return result.data;
    } catch (error) {
        console.error('Webpage text extraction error:', error);
        throw error;
    }
}

export async function getPdfText(queryOptions: PdfExtractOptions, sourceOptions: SourceOptions): Promise<string> {
    console.log('Starting PDF text extraction...', { options: queryOptions });

    try {
        let result: PdfExtractResponse;
        
        if (queryOptions.url) {
            console.log('URL provided for PDF extraction');
            result = await extractPdfTextFromUrl(queryOptions, sourceOptions);
        } else if (queryOptions.file) {
            console.log('File provided for PDF extraction');
            result = await extractPdfTextFromFile(queryOptions, sourceOptions);
        } else {
            throw new Error('Either URL or file must be provided');
        }

        return result.data;
    } catch (error) {
        console.error('PDF text extraction error:', error);
        throw error;
    }
}

export async function getDocumentData(queryOptions: DocumentDataExtractionOptions, sourceOptions: SourceOptions): Promise<any> {
    console.log('Starting document data extraction process...', { options: queryOptions });

    try {
        let result;
        if (queryOptions.url) {
            console.log('Extracting document data from URL');
            result = await extractDocumentDataFromUrl(queryOptions, sourceOptions);
        } else if (queryOptions.file) {
            console.log('Extracting document data from file');
            result = await extractDocumentDataFromFile(queryOptions, sourceOptions);
        } else {
            throw new Error('Either URL or file must be provided');
        }

        return result.data;
    } catch (error) {
        console.error('Document data extraction error:', error);
        throw error;
    }
}

