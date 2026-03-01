import axios, { AxiosError, AxiosInstance } from 'axios';

export interface ChatResponse {
    reply: string;
    deployment: string;
}

interface ChatErrorPayload {
    detail?: string;
}

export class ChatService {
    private client: AxiosInstance;

    public constructor(baseUrl: string) {
        this.client = axios.create({
            baseURL: baseUrl
        });
    }

    public async sendMessage(prompt: string): Promise<ChatResponse> {
        try {
            const response = await this.client.post<ChatResponse>('/ai/chat', { prompt });
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ChatErrorPayload>;
            const message = axiosError.response?.data?.detail || 'Unable to reach chat API.';
            throw new Error(message);
        }
    }
}
