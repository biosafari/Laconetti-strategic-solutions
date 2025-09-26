from openai import OpenAI, OpenAIError

def simple_chat(client: OpenAI, model: str):
    try:
        r = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are Kimi, an AI assistant created by Moonshot AI."},
                {"role": "user", "content": "Please give a brief self-introduction."},
            ],
            max_tokens=256,   # <-- must be >0
            temperature=0.7,  # <-- not 0.0
            stream=False,
        )
    except OpenAIError as e:
        return print("❌ API error:", e)

    text = r.choices[0].message.content
    print("Agent:", text or "<no content returned>")
