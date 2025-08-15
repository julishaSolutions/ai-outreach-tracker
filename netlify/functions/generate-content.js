// This is your new secure, server-side Netlify Function.
// It will live in the file: netlify/functions/generate-content.js

const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  // Get all the necessary data from the frontend's request.
  const { contact, action, kb, intel, tone } = JSON.parse(event.body);
  
  // Securely access your API key.
  const apiKey = process.env.GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  // This is the same detailed prompt you had before, now running securely on the backend.
  let prompt = `Act as a professional outreach strategist. Your task is to generate content for a specific outreach action. Critically analyze all the provided information to create a winning, unique, and highly tailored piece of content.

    **My Information (from Knowledge Base):**
    - My Name: ${kb.myName}
    - My Role: ${kb.myRole}
    - My Project/Solution: ${kb.solutionDetails}
    - My Website: ${kb.myWebsite}

    **Target Contact Information:**
    - Contact Name: ${contact.contactName}
    - Contact Title: ${contact.title}
    - Organization: ${contact.organization}
    - Website: ${contact.website || 'Not provided'}
    - LinkedIn: ${contact.linkedin || 'Not provided'}

    **Intelligence Gathered on the Organization:**
    - Mission: ${intel.mission}
    - Strategic Goals: ${Array.isArray(intel.goals) ? intel.goals.join(', ') : intel.goals}
    - Recent News/Activity: ${intel.recentNews}

    **Your Task:**
    Generate the content for the following action: "${action}"
    The desired tone is: "${tone}"

    **Instructions for "${action}":**
  `;

  switch(action) {
    case 'Introductory Email':
        prompt += `
        - This is the first contact. The goal is to spark interest and secure a brief meeting.
        - Keep it concise and impactful.
        - Start with a personalized opening that connects my project to their mission or recent activity.
        - Briefly introduce my project, highlighting the single most relevant benefit to their organization based on their goals.
        - End with a clear, low-friction call to action (e.g., a 15-minute call).
        - The output must be a valid JSON object with two keys: "subject" and "body". The body should be the full email text.`;
        break;
    case 'Proposal':
        prompt += `
        - This is a formal proposal. It should be comprehensive, detailed, and professional.
        - Structure it with clear headings (e.g., Introduction, Understanding the Need, Proposed Solution, Projected Impact, Partnership Framework, Next Steps).
        - Directly reference their mission, goals, and recent news to show this is a tailored, not generic, proposal.
        - The output must be a valid JSON object with two keys: "subject" and "body". The body should be the full proposal text in Markdown format.`;
        break;
    case 'Pitch Deck':
        prompt += `
        - This is an outline for a winning pitch deck. It should be concise, professional, and easy to consume.
        - Structure it as a series of slides (e.g., "Slide 1: Title", "Slide 2: The Problem", etc.).
        - The output must be a valid JSON object with two keys: "subject" and "body". The subject should be a title for the deck, and the body should be the full outline in Markdown format.`;
        break;
    case 'Follow-up Email':
        prompt += `
        - This is a brief, friendly, and professional follow-up to a previous communication.
        - Keep it very short and to the point.
        - The output must be a valid JSON object with two keys: "subject" and "body". The body should be the full email text.`;
        break;
  }

  try {
    const payload = { contents: [{ parts: [{ text: prompt }] }] };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    const textContent = result.candidates[0].content.parts[0].text;
    const jsonString = textContent.match(/```json\s*([\s\S]*?)\s*```/)[1];
    const parsedJson = JSON.parse(jsonString);

    return {
      statusCode: 200,
      body: JSON.stringify(parsedJson),
    };
  } catch (error) {
    console.error("Error in generate-content function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate content." }),
    };
  }
};
