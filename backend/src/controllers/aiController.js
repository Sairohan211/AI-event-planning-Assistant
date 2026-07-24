import { GoogleGenerativeAI } from '@google/generative-ai';
import db from '../db.js';
import crypto from 'crypto';

// Helper to get Gemini Client or return null
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    console.warn('GEMINI_API_KEY is not configured. Falling back to Mock Generative AI Engine.');
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

// Robust helper to extract and parse JSON from Gemini's response
const parseGeminiJson = (text) => {
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    // Try to extract from Markdown fences
    const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch (innerErr) {
        console.error('Failed to parse matched JSON block:', innerErr);
      }
    }
    // Clean up typical JSON syntax issues
    let cleaned = text.trim();
    if (cleaned.startsWith('`')) cleaned = cleaned.replace(/`/g, '');
    try {
      return JSON.parse(cleaned);
    } catch (finalErr) {
      console.error('Fallback JSON parsing failed. Text content was:', text);
      throw new Error('Failed to parse Gemini response as JSON: ' + finalErr.message);
    }
  }
};

// Generates complete event plan and timeline, brief, budget, vendor questions, guest templates, backup plans.
export const generateEventPlan = async (req, res) => {
  const { eventId } = req.params;
  try {
    // Retrieve event details
    const eventResult = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    const event = eventResult.rows[0];

    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const client = getGeminiClient();

    let generatedData = null;

    if (client) {
      const model = client.getGenerativeModel({ model: modelName });
      
      const prompt = `
        You are an elite AI Event Planner. Generate a comprehensive event plan, timeline, brief, budget suggestions, communications, and contingencies.
        All currency amounts, budget allocations, and pricing metrics MUST be calculated in Indian Rupees (INR, ₹).
        Here are the event requirements:
        - Title: "${event.title}"
        - Type: "${event.type}"
        - Objective: "${event.objective}"
        - Date/Time: "${event.date}"
        - Venue: "${event.venue}"
        - Capacity: ${event.capacity} people
        - Budget: ₹${event.budget} INR
        - Target Audience: "${event.audience}"

        Return a single JSON object. Ensure it has EXACTLY the following keys and structure:
        {
          "concept": "A detailed 1-2 paragraph description of the event theme, vibe, branding, and concept brief.",
          "timeline": [
            { "time": "e.g., 08:00 AM", "activity": "Activity description", "responsible": "Organizer/Staff role" }
          ],
          "budget_allocation": [
            { "category": "Catering", "percentage": 40, "amount": 4000, "details": "Food & Beverage description" }
          ],
          "vendor_messages": [
            { "category": "AV/Lighting", "draft_message": "Draft email message to vendors inquiring about service specs and quotes." }
          ],
          "guest_messages": {
            "invitation": "Draft email invitation to send to guests.",
            "reminder": "Draft reminder email to send before the event."
          },
          "risks_contingencies": [
            { "risk": "Description of the risk (e.g. Bad weather)", "impact": "High/Medium/Low", "backup_plan": "Specific contingency steps." }
          ]
        }
        Do not output any introductory or concluding text, only the raw JSON.
      `;

      console.log(`Calling Gemini API (${modelName}) to generate event plan...`);
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      });
      const responseText = response.response.text();
      generatedData = parseGeminiJson(responseText);
    } else {
      // MOCK FALLBACK DATA
      console.log('Generating mock event planning data...');
      const defaultBudget = event.budget || 5000;
      generatedData = {
        concept: `The event "${event.title}" is conceptualized as an engaging, high-end ${event.type} tailored specifically for ${event.audience || 'our key stakeholders'}. The core design theme blends elegance with efficiency at the ${event.venue || 'designated venue'}, optimizing attendee flow and interaction to achieve the core objective: ${event.objective || 'Facilitating networking and sharing insights'}.`,
        timeline: [
          { time: "09:00 AM", activity: "Setup & AV checks at the venue", responsible: "Lead Coordinator" },
          { time: "10:00 AM", activity: "Guest Check-in & Morning Coffee", responsible: "Registrar Team" },
          { time: "10:30 AM", activity: "Opening Welcome Keynote & Objectives Briefing", responsible: "Event MC" },
          { time: "12:00 PM", activity: "Catered Lunch & Structured Networking Session", responsible: "Catering Supervisor" },
          { time: "02:00 PM", activity: "Keynote presentation & Panel Discussions", responsible: "Facilitators" },
          { time: "04:00 PM", activity: "Closing remarks & Questionnaire feedback", responsible: "Event Director" },
          { time: "05:00 PM", activity: "Tear-down & Vendor check-out", responsible: "Logistics Team" }
        ],
        budget_allocation: [
          { category: "Venue & Permits", percentage: 25, amount: Math.round(defaultBudget * 0.25), details: "Rental fee, security deposit, and clean-up compliance." },
          { category: "Catering (Food & Drinks)", percentage: 35, amount: Math.round(defaultBudget * 0.35), details: "Morning coffee, lunch buffet, soft drinks, and dietary alternatives." },
          { category: "Audio-Visual & Decor", percentage: 20, amount: Math.round(defaultBudget * 0.20), details: "Microphones, screen projection, staging, and floral arrangements." },
          { category: "Logistics & Staffing", percentage: 10, amount: Math.round(defaultBudget * 0.10), details: "Hostesses, technical support, and registration desks." },
          { category: "Contingency Fund", percentage: 10, amount: Math.round(defaultBudget * 0.10), details: "Reserved for unexpected costs or minor last-minute adjustments." }
        ],
        vendor_messages: [
          { category: "Catering", draft_message: `Dear Catering Partner,\n\nWe are looking to secure a full lunch buffet for our upcoming event "${event.title}" on ${event.date} at ${event.venue || 'the venue'}. We expect around ${event.capacity || 50} attendees, including some with gluten-free and vegetarian dietary needs. Could you please provide a quotation and list of available menus?\n\nBest regards,\nEvent Planning Team` },
          { category: "AV/Lighting", draft_message: `Dear AV Specialist,\n\nWe require sound systems, stage lighting, and a high-definition projector screen for our event "${event.title}" on ${event.date} at ${event.venue || 'the venue'}. Please provide your rates for set-up, on-site technician support, and pack-down.\n\nWarm regards,\nEvent Logistics Team` }
        ],
        guest_messages: {
          invitation: `Hello,\n\nYou are cordially invited to join us for "${event.title}"! \n\nDate: ${event.date}\nVenue: ${event.venue || 'To Be Announced'}\nObjective: ${event.objective || 'A premium gathering'}\n\nPlease click the link below to confirm your registration and list any dietary requirements.\n\nLooking forward to seeing you there!\n\nWarm regards,\n${event.title} Organizing Team`,
          reminder: `Hi there,\n\nThis is a friendly reminder that "${event.title}" is happening soon on ${event.date} at ${event.venue}.\n\nIf you haven't confirmed your attendance, please do so today to help us lock in catering numbers.\n\nBest,\nOrganizing Team`
        },
        risks_contingencies: [
          { risk: "Technical breakdown of AV equipment", impact: "High", backup_plan: "Ensure the AV vendor provides a backup mixer and secondary projector on-site, and have a pre-tested presentation loaded on a local flash drive." },
          { risk: "Low RSVP turnout", impact: "Medium", backup_plan: "Send customized follow-ups to VIP guests, and expand invitations to secondary waitlist attendees if targets aren't reached by next week." },
          { risk: "Extreme weather (for outdoor setups)", impact: "High", backup_plan: "Secure indoor canopy covers or have a secondary pre-reserved ballroom space adjacent to the primary venue." }
        ]
      };
    }

    // Save/Update plan in database
    const existingPlan = await db.query('SELECT id FROM ai_plans WHERE event_id = $1', [eventId]);
    if (existingPlan.rows.length === 0) {
      await db.query(
        `INSERT INTO ai_plans (id, event_id, concept, timeline, budget_allocation, vendor_messages, guest_messages, risks_contingencies, approved) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          crypto.randomUUID(),
          eventId,
          generatedData.concept,
          JSON.stringify(generatedData.timeline),
          JSON.stringify(generatedData.budget_allocation),
          JSON.stringify(generatedData.vendor_messages),
          JSON.stringify(generatedData.guest_messages),
          JSON.stringify(generatedData.risks_contingencies),
          false
        ]
      );
    } else {
      await db.query(
        `UPDATE ai_plans 
         SET concept = $1, timeline = $2, budget_allocation = $3, vendor_messages = $4, guest_messages = $5, risks_contingencies = $6, approved = $7 
         WHERE event_id = $8`,
        [
          generatedData.concept,
          JSON.stringify(generatedData.timeline),
          JSON.stringify(generatedData.budget_allocation),
          JSON.stringify(generatedData.vendor_messages),
          JSON.stringify(generatedData.guest_messages),
          JSON.stringify(generatedData.risks_contingencies),
          false,
          eventId
        ]
      );
    }

    const savedPlanResult = await db.query('SELECT * FROM ai_plans WHERE event_id = $1', [eventId]);
    const savedPlan = savedPlanResult.rows[0];

    res.status(200).json({
      ...savedPlan,
      timeline: JSON.parse(savedPlan.timeline),
      budget_allocation: JSON.parse(savedPlan.budget_allocation),
      vendor_messages: JSON.parse(savedPlan.vendor_messages),
      guest_messages: JSON.parse(savedPlan.guest_messages),
      risks_contingencies: JSON.parse(savedPlan.risks_contingencies)
    });
  } catch (error) {
    console.error('Generate event plan error:', error);
    res.status(500).json({ error: 'Failed to generate plan: ' + error.message });
  }
};

// Generates quizzes for event coordinator training
export const generateQuiz = async (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required.' });
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const client = getGeminiClient();
  let quizQuestions = null;

  try {
    if (client) {
      const model = client.getGenerativeModel({ model: modelName });
      const prompt = `
        You are an expert trainer in Event Coordination and Management.
        Generate a multiple-choice quiz about "${topic}".
        Return a single JSON array of exactly 5 questions.
        Each question object MUST have the following structure:
        {
          "question": "The question text?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answerIndex": 0, // 0-indexed correct answer
          "explanation": "Short explanation of why this answer is correct."
        }
        Only output the raw JSON, no markdown fences or wrapper formatting.
      `;

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      });
      const text = response.response.text();
      quizQuestions = parseGeminiJson(text);
    } else {
      // Mock Fallback
      quizQuestions = [
        {
          question: `Which of the following is the most critical first step when managing "${topic}"?`,
          options: ["Signing vendor agreements immediately", "Identifying key objectives and risk parameters", "Selecting decoration palettes", "Inviting VIP attendees"],
          answerIndex: 1,
          explanation: "Defining objectives and understanding potential risks forms the foundation of any event plan, ensuring resources are aligned."
        },
        {
          question: `In the context of "${topic}", what does a contingency buffer protect against?`,
          options: ["Over-communication with guests", "Unexpected budget inflation or service failures", "Marketing campaigns running early", "Selecting wrong lighting colors"],
          answerIndex: 1,
          explanation: "Buffers account for unexpected changes, emergencies, or rising costs during event execution."
        },
        {
          question: `Which indicator is best for evaluating the efficiency of "${topic}" workflows?`,
          options: ["Total count of emails sent", "Task completion rate relative to milestones", "Number of pictures taken", "Total event duration"],
          answerIndex: 1,
          explanation: "Task progression tracked against pre-defined milestones is the clearest index of workflow efficiency."
        },
        {
          question: `How should critical dependencies be addressed in "${topic}" scheduling?`,
          options: ["Schedule dependent tasks in parallel", "Ensure precursor tasks are approved and complete before launching successor tasks", "Skip dependencies to speed up the process", "Only notify the client after a block occurs"],
          answerIndex: 1,
          explanation: "Completing precursor tasks prevents bottlenecks and ensures the next phase can begin without errors."
        },
        {
          question: `Why is active feedback collection necessary after resolving "${topic}"?`,
          options: ["To evaluate attendee satisfaction and compile lessons learned for future events", "To increase registration prices", "To delay payment releases to vendors", "To create a secondary marketing brief only"],
          answerIndex: 0,
          explanation: "Post-event reviews evaluate successes and failures, helping refine workflows for future coordination."
        }
      ];
    }

    res.status(200).json({ topic, questions: quizQuestions });
  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({ error: 'Failed to generate quiz: ' + error.message });
  }
};

// Generates general content templates (announcements, instructions, vendor guidelines)
export const generateContent = async (req, res) => {
  const { prompt, context } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const client = getGeminiClient();
  let contentText = '';

  try {
    if (client) {
      const model = client.getGenerativeModel({ model: modelName });
      const fullPrompt = `
        You are an expert event manager assistant.
        Given the following context: "${context || 'No specific context provided'}"
        Generate the requested content for: "${prompt}".
        Write it in a professional and premium tone. Format it nicely using markdown.
      `;
      const response = await model.generateContent(fullPrompt);
      contentText = response.response.text();
    } else {
      contentText = `### Gemini-Generated Template\n\nHere is a professional draft regarding: **${prompt}**\n\n* **Context:** ${context || 'General event planning guideline'}\n\n#### Draft:\nThis draft is designed to streamline coordination. Please review details, input correct timings, contact details, and locations prior to final deployment.\n\n* **Vendor Instruction Checklist:** Verify all equipment drops match specifications.\n* **Staffing Guidance:** Please meet in the main hall 15 minutes before doors open.`;
    }

    res.status(200).json({ content: contentText });
  } catch (error) {
    console.error('Generate content error:', error);
    res.status(500).json({ error: 'Failed to generate content: ' + error.message });
  }
};

// Returns generated event plan details
export const getEventPlan = async (req, res) => {
  const { eventId } = req.params;
  try {
    const result = await db.query('SELECT * FROM ai_plans WHERE event_id = $1', [eventId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No generated plans found for this event. Hit Generate to create one.' });
    }
    const plan = result.rows[0];
    res.status(200).json({
      ...plan,
      timeline: JSON.parse(plan.timeline),
      budget_allocation: JSON.parse(plan.budget_allocation),
      vendor_messages: JSON.parse(plan.vendor_messages),
      guest_messages: JSON.parse(plan.guest_messages),
      risks_contingencies: JSON.parse(plan.risks_contingencies)
    });
  } catch (error) {
    console.error('Get event plan error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// Save approved/edited event plan
export const saveApprovedPlan = async (req, res) => {
  const { eventId } = req.params;
  const { concept, timeline, budget_allocation, vendor_messages, guest_messages, risks_contingencies, approved } = req.body;
  try {
    const existing = await db.query('SELECT id FROM ai_plans WHERE event_id = $1', [eventId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'No plan exists to approve. Generate a plan first.' });
    }

    await db.query(
      `UPDATE ai_plans 
       SET concept = $1, timeline = $2, budget_allocation = $3, vendor_messages = $4, guest_messages = $5, risks_contingencies = $6, approved = $7 
       WHERE event_id = $8`,
      [
        concept,
        JSON.stringify(timeline),
        JSON.stringify(budget_allocation),
        JSON.stringify(vendor_messages),
        JSON.stringify(guest_messages),
        JSON.stringify(risks_contingencies),
        approved !== undefined ? approved : true,
        eventId
      ]
    );

    res.status(200).json({ message: 'Event plan updated and marked as approved.' });
  } catch (error) {
    console.error('Save approved plan error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
