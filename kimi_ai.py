import os
from openai import OpenAI, OpenAIError

def simple_chat(client: OpenAI, model_name: str) -> str:
    messages = [
        {"role": "system", "content": "You are Kimi, an AI assistant created by Moonshot AI."},
        {"role": "user", "content": "Please give a brief self-introduction."},
    ]

    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=messages,
            stream=False,
            temperature=0.6,
            max_tokens=256,
        )
    except OpenAIError as exc:
        # catches 400, 401, 404, 429, 500 …
        print("❌  OpenAIError:", exc)
        return ""

    # Safety-check the payload
    if not response.choices:
        print("⚠️  No choices returned")
        return ""

    assistant_text = response.choices[0].message.content
    if assistant_text is None:
        print("⚠️  choices[0].message.content is None")
        return ""

    print(assistant_text)
    return assistant_text


# ------------------------------------------------------------------
# quick sanity run
# ------------------------------------------------------------------
if __name__ == "__main__":
    client = OpenAI(
        api_key=os.getenv("MOONSHOT_API_KEY"),   # put your key here
        base_url="https://api.moonshot.cn/v1",   # or any OpenAI-compat
    )
    simple_chat(client, model_name="moonshot-v1-8k")
