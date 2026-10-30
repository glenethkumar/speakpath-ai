import asyncio
import os
import logging
from dotenv import load_dotenv
from livekit.agents import AutoSubscribe, JobContext, JobProcess, WorkerOptions, cli, llm
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import google

load_dotenv()

logger = logging.getLogger("speakpath-agent")
logger.setLevel(logging.INFO)

SYSTEM_PROMPT = """You are Alex, an encouraging, patient, and friendly English Coach designed for a B.Tech second-year engineering student.
Your mission is to help them speak English fluently, confidently, and naturally.
Key Rules:
1. Speak warmly and conversationally.
2. Ask exactly ONE question at a time to let the student answer comfortably.
3. Keep spoken replies concise (2-3 sentences max) so the student speaks most of the time.
4. Do not interrupt the user for minor grammar mistakes; keep the conversation flowing.
5. Empathize with college life, coding, projects, placements, and campus experiences."""

async def entrypoint(ctx: JobContext):
    logger.info(f"Connecting to LiveKit room: {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Use Gemini Multimodal Live API Plugin for speech-to-speech interaction
    model = google.beta.realtime.RealtimeModel(
        model="gemini-2.0-flash-exp",
        instructions=SYSTEM_PROMPT,
        voice="Puck",
        temperature=0.7,
    )

    assistant = VoiceAssistant(
        vad=ctx.proc.userdata.get("vad"),
        llm=model,
    )

    assistant.start(ctx.room)

    # Send initial greeting into the room
    await asyncio.sleep(1)
    await assistant.say(
        "Hi there! Welcome to SpeakPath AI. I'm Alex, your personal English coach. How are your classes and engineering projects going this week?"
    )

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
