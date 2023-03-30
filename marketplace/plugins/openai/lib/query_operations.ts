import { OpenAIApi } from 'openai'
import { QueryOptions } from './types'

export async function getCompletion(openai: OpenAIApi, options: QueryOptions): Promise<string> {
    const { prompt, max_tokens, temperature, stop_sequence, suffix } = options
    const { data, status } = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: prompt,
        temperature: typeof temperature === 'string' ? parseFloat(temperature) : temperature || 0,
        max_tokens: typeof max_tokens === 'string' ? parseInt(max_tokens) : max_tokens || 67,
        stop: stop_sequence || null,
        suffix: suffix || null
    })

    if (status !== 200) {
        throw new Error('OpenAI API Error')
    }

    return data.choices[0].text
}


export async function getChatCompletion(openai: OpenAIApi, options: QueryOptions): Promise<string> {
    const { prompt, max_tokens, temperature, stop_sequence } = options
    console.log('response ===> chat', options);
    const { data, status } = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        temperature: typeof temperature === 'string' ? parseFloat(temperature) : temperature || 0,
        max_tokens: typeof max_tokens === 'string' ? parseInt(max_tokens) : max_tokens || 67,
        stop: stop_sequence || null,
        messages: [
            {
                role: "assistant",
                content: prompt
            }
        ]

    })

    if (status !== 200) {
        throw new Error('OpenAI API Error')
    }

    return data.choices[0]['message']['content']
}