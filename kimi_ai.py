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
