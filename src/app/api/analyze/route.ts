import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    const apiKey = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6Keg6579exU02mp1PzWibI_dGzcBd-A7dpTBVmzmjvXTQ';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    // Extract base64 data and mime type
    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1];

    const prompt = `You are a civic issue analyzer for a community reporting app. 
    Analyze this image for civic/infrastructure problems (e.g., pothole, broken sidewalk, graffiti, trash overflow, blocked drain, broken street light). 
    
    Respond STRICTLY with a valid JSON object (no markdown formatting, no backticks) containing:
    - "issue": A short 1-3 word title of the civic issue. If no civic issue is found (e.g., it's a selfie, a cat, an indoor room, or a normal street with no damage), return "No Issue Found".
    - "confidence": A number from 0 to 100 representing your confidence. (If "No Issue Found", set to 0).
    - "description": A short 1-sentence description of what you see.`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    
    // Clean up response in case model returns markdown code block
    const jsonStr = responseText.replace(/```json\n?|```/g, '').trim();
    const data = JSON.parse(jsonStr);

    return NextResponse.json(data);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({ 
      issue: 'Analysis Failed', 
      confidence: 0, 
      description: 'An error occurred while analyzing the image.',
      error: true 
    }, { status: 500 });
  }
}
