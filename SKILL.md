metadata name: human-map-linker description: Connects Telegram users to their website quiz results via Edge Function (v1 - no direct Supabase)

requires:

http
logic

When a user sends /start {{uuid}}:

Action: Send POST request to {{EDGE_FUNCTION_URL}} Body (JSON): { "sessionId": "{{uuid}}", "telegram_chat_id": "{{sender_id}}" } Headers: Accept application/json

Expected response: JSON with at least { "assigned_archetype": "..." }

On success: Reply: "Identity Verified! 💜 I see you are a {{assigned_archetype}}! I'm searching for another Emo in your territory. What is your Name and Age?"

On error: Reply: "Sorry, I couldn't verify your quiz result. Please try the quiz again on the website."

When the user replies with their details (expecting name and age):

Action: Send POST request to {{EDGE_FUNCTION_URL}} Body (JSON): { "sessionId": "{{uuid}}", "bio_age_gender": "{{message_text}}" }

On success: Reply: "Got it! Your details are saved. I'll notify you here the moment we find a match! Stay tuned. 💜"

On error: Reply: "Something went wrong while saving your details. Please try again."

Notes:

v1: only verification + name/age save via Edge API
Uses TELEGRAM_BOT_TOKEN and EDGE_FUNCTION_URL from env/secrets
