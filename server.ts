import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API endpoint for Gemini AI Chat Assistant with Google Search Grounding
  app.post("/api/chat", async (req: express.Request, res: express.Response) => {
    try {
      const { message, history } = req.body || {};
      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "Message is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is missing. Please configure your API key in Settings > Secrets.",
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Construct contents with chat history if provided
      let contents: any = message;
      if (Array.isArray(history) && history.length > 0) {
        contents = [
          ...history,
          { role: "user", parts: [{ text: message }] },
        ];
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: {
          systemInstruction: `You are Get Cabs AI Assistant, the official 24/7 intelligent travel concierge for Get Cabs Coimbatore (Hotline: 9894020156).
You are equipped with Google Search Data Grounding to deliver live, accurate, up-to-date information across Coimbatore, Tamil Nadu, and South India.

Key Capabilities with Google Search Data:
- Live Weather Updates (e.g. current temperature, rain forecast in Ooty, Kodaikanal, Valparai, Munnar, or Coimbatore).
- Real-time Road & Traffic Conditions (e.g. Nilgiris ghat road status, hairpin bend weather/fog conditions, highway roadwork, forest checkpost timings).
- Airport & Flight Information (e.g. Coimbatore International Airport CJB flight statuses, arrival/departure updates, terminal travel advice).
- Local Events & Temple Darshan Timings (e.g. Isha Yoga Center, Marudhamalai, Madurai Meenakshi, Palani Murugan Temple darshan timings and festival schedules).
- Get Cabs Taxi Bookings & Tariffs (e.g. Local City Rides, Oneway Cabs to Ooty ₹3,500, Pollachi ₹1,600, Palani ₹3,900, Erode ₹3,500, Outstation Round Trips, 10 Hr / 100 KM Day Packages @ ₹3,000, and Airport Transfers).

Formatting Rules:
1. Always format answers using clean, structured HTML tags (such as <strong>, <ul>, <li>, <p>, <br>, and <a href="tel:9894020156">📞 Call 9894020156</a>).
2. Maintain a friendly, helpful, professional, and confident tone.
3. When live search data is retrieved, seamlessly incorporate the findings and highlight recent or live facts.
4. Always conclude with a quick call-to-action for booking a Get Cabs taxi with zero surge pricing and 24/7 hotline 9894020156.`,
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "I'm sorry, I couldn't process your request right now.";

      // Extract search grounding metadata and source links
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const webSearchQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries;
      
      const sources: Array<{ title: string; url: string }> = [];
      const seenUrls = new Set<string>();

      if (Array.isArray(groundingChunks)) {
        groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri && chunk.web?.title) {
            if (!seenUrls.has(chunk.web.uri)) {
              seenUrls.add(chunk.web.uri);
              sources.push({
                title: chunk.web.title,
                url: chunk.web.uri,
              });
            }
          }
        });
      }

      return res.json({
        text,
        sources,
        webSearchQueries: webSearchQueries || [],
      });
    } catch (err: any) {
      console.error("Gemini Chat Error:", err);
      return res.status(500).json({
        error: err?.message || "An error occurred while generating AI response.",
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "Get Cabs Coimbatore AI" });
  });

  // Vite development middleware vs production static server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Get Cabs Express server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
