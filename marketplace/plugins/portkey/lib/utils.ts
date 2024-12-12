export function safeParseJSON(json: string, fallback: any): any {
    try {
        return JSON.parse(json);
    } catch (e) {
        return fallback;
    }
}