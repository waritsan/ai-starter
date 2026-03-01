import { FC, useEffect, useMemo, useRef, useState } from 'react';
import {
    DefaultButton,
    Icon,
    Panel,
    PanelType,
    PrimaryButton,
    Spinner,
    Stack,
    Text,
    TextField
} from '@fluentui/react';
import config from '../config';
import { ChatService } from '../services/chatService';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
    role: ChatRole;
    text: string;
}

const ChatBubble: FC = () => {
    const chatService = useMemo(() => new ChatService(config.api.baseUrl), []);
    const [isOpen, setIsOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        const trimmedPrompt = prompt.trim();
        if (!trimmedPrompt || isSending) {
            return;
        }

        setPrompt('');
        setIsSending(true);
        setMessages((previous) => [...previous, { role: 'user', text: trimmedPrompt }]);

        try {
            const response = await chatService.sendMessage(trimmedPrompt);
            setMessages((previous) => [...previous, { role: 'assistant', text: response.reply }]);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to reach chat API.';
            setMessages((previous) => [...previous, { role: 'assistant', text: message }]);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            <PrimaryButton
                ariaLabel="Open chat"
                iconProps={{ iconName: 'Chat' }}
                onClick={() => setIsOpen(true)}
                styles={{
                    root: {
                        position: 'fixed',
                        right: 16,
                        bottom: 16,
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        minWidth: 52,
                        zIndex: 1000
                    },
                    icon: {
                        fontSize: 20
                    }
                }}
                title="Chat"
            />

            <Panel
                closeButtonAriaLabel="Close"
                hasCloseButton
                headerText="Chat"
                isOpen={isOpen}
                isLightDismiss
                onDismiss={() => setIsOpen(false)}
                type={PanelType.smallFixedFar}
            >
                <Stack tokens={{ childrenGap: 12 }} styles={{ root: { height: '100%' } }}>
                    <Stack.Item grow styles={{ root: { overflowY: 'auto', paddingRight: 4 } }}>
                        <Stack tokens={{ childrenGap: 8 }}>
                            {messages.length === 0 && (
                                <Text variant="small">Ask anything to start a conversation.</Text>
                            )}

                            {messages.map((message, index) => (
                                <Stack
                                    horizontal
                                    key={`${message.role}-${index}`}
                                    tokens={{ childrenGap: 8 }}
                                    verticalAlign="start"
                                >
                                    <Icon iconName={message.role === 'user' ? 'Contact' : 'Robot'} />
                                    <Text>{message.text}</Text>
                                </Stack>
                            ))}

                            {isSending && <Spinner label="Thinking..." />}
                            <div ref={messagesEndRef} />
                        </Stack>
                    </Stack.Item>

                    <Stack.Item>
                        <TextField
                            multiline
                            onChange={(_, value) => setPrompt(value || '')}
                            placeholder="Type your message"
                            rows={3}
                            value={prompt}
                        />
                        <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 8 }} styles={{ root: { marginTop: 8 } }}>
                            <DefaultButton onClick={() => setPrompt('')} text="Clear" />
                            <PrimaryButton
                                disabled={!prompt.trim() || isSending}
                                onClick={sendMessage}
                                text="Send"
                            />
                        </Stack>
                    </Stack.Item>
                </Stack>
            </Panel>
        </>
    );
};

export default ChatBubble;
