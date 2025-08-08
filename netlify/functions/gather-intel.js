// This is your secure, server-side Netlify Function.
// It will live in the file: netlify/functions/gather-intel.js

// We use the 'node-fetch' library to make API calls from the backend.
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  // Get the organization name and website from the frontend's request.
  const { orgName, website } = JSON.parse(event.body);

  // Get the secure API key from Netlify's environment variables.
  const apiKey = process.env.GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  // Create a detailed prompt for the AI to get the best possible intel.
  // It prioritizes the provided website for factual accuracy.
  const prompt = `
    Please act as a business intelligence analyst.
    Your task is to gather factual information about the following organization: "${orgName}".
    
    Primary Source of Truth: Use their official website (${website || 'not provided, please find it'}) as the main source.
    Secondary Sources: Use their social media links and recent, reputable news articles.
    
    Gather the following specific information:
    1.  **Mission:** The organization's official mission statement or a concise summary of its purpose.
    2.  **Goals:** A list of 2-3 key strategic goals, objectives, or core values.
    3.  **Recent News:** A summary of the most significant recent news, announcement, or project mentioned on their website or in recent news articles. This must be a factual event, not a general statement.

    Return the information as a valid JSON object with the keys "mission", "goals", and "recentNews". Do not include any text outside of the JSON object.
  `;

  try {
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    
    // Extract the text content from the AI's response.
    const textContent = result.candidates[0].content.parts[0].text;
    
    // Clean up the response to ensure it's valid JSON.
    const jsonString = textContent.match(/```json\s*([\s\S]*?)\s*```/)[1];
    const intel = JSON.parse(jsonString);

    // Send the clean, structured data back to the frontend.
    return {
      statusCode: 200,
      body: JSON.stringify(intel),
    };

  } catch (error) {
    console.error("Error in Netlify function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to gather intelligence." }),
    };
  }
};
