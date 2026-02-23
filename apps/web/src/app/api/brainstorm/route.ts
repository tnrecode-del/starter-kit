import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "No GOOGLE_API_KEY configured" },
        { status: 500 },
      );
    }

    // Convert OpenAI-style messages to Gemini format
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // System instructions are passed separately in Gemini API v1beta
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: "You are an expert AI software architect and context manager. Help the user brainstorm concrete technical requirements, PRDs, and implementation steps for their features. Keep answers concise, actionable, and formatted as markdown lists. Reply in Russian if requested, but use English technical terms.",
              },
            ],
          },
          contents,
        }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("Gemini API error:", data);
      return NextResponse.json(
        { error: "Gemini API returned an error" },
        { status: 500 },
      );
    }

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a response.";

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Brainstorm error", error);
    return NextResponse.json(
      { error: "Failed to connect to AI" },
      { status: 500 },
    );
  }
}
