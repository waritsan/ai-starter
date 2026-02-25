from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from openai import AzureOpenAI


def generate_chat_completion(
    endpoint: str,
    deployment: str,
    api_version: str,
    user_prompt: str,
    system_prompt: str = "You are a helpful assistant.",
    max_tokens: int = 300,
    temperature: float = 0.2,
) -> str:
    token_provider = get_bearer_token_provider(
        DefaultAzureCredential(),
        "https://cognitiveservices.azure.com/.default",
    )

    client = AzureOpenAI(
        azure_endpoint=endpoint,
        azure_ad_token_provider=token_provider,
        api_version=api_version,
    )

    completion = client.chat.completions.create(
        model=deployment,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=max_tokens,
        temperature=temperature,
    )

    content = completion.choices[0].message.content
    return content or ""
