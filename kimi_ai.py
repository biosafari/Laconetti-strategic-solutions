from openai import OpenAI, OpenAIError

def simple_chat(client: OpenAI, model: str):
    try:
        r = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are Kimi, an AI assistant created by Moonshot AI."},
                {"role": "user", "content": "Please give a brief self-introduction."},
            ],
            max_tokens=256,
            temperature=0.7,
            stream=False,
        )
    except OpenAIError as e:
        return print("❌ API error:", e)

    # cope with both chat and legacy response shapes
    msg = r.choices[0].message
    text = msg.content if msg.content is not None else msg.get("text", "")
    print(text or "<empty response>")
