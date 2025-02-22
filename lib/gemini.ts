import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export interface LessonPlanInput {
  topic: string;
  gradeLevel: string;
  mainConcept: string;
  subTopics: string;
  materials: string;
  objectives: string;
  lessonOutline: string;
}

export interface GeneratedLessonPlan {
  overview: string;
  activities: string;
  assessment: string;
}

function validateInput(input: LessonPlanInput): void {
  const requiredFields = [
    'topic',
    'gradeLevel',
    'mainConcept',
    'subTopics',
    'materials',
    'objectives',
    'lessonOutline'
  ] as const;

  const emptyFields = requiredFields.filter(field => !input[field].trim());
  
  if (emptyFields.length > 0) {
    throw new Error(`Please fill in all required fields: ${emptyFields.join(', ')}`);
  }
}

export async function generateLessonPlan(input: LessonPlanInput): Promise<GeneratedLessonPlan> {
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured. Please add your API key to the environment variables.");
  }

  try {
    validateInput(input);

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Create a detailed lesson plan with the following information:
Topic: ${input.topic}
Grade Level: ${input.gradeLevel}
Main Concept: ${input.mainConcept}
Sub Topics: ${input.subTopics}
Materials Needed: ${input.materials}
Learning Objectives: ${input.objectives}
Lesson Outline: ${input.lessonOutline}

Please provide the response in the following format:

OVERVIEW:
[Detailed overview of the lesson plan]

ACTIVITIES:
[List of engaging classroom activities]

ASSESSMENT:
[Assessment questions and evaluation criteria]`;

    const safePrompt = prompt.trim().slice(0, 30000); // Ensure prompt isn't too long
    const result = await model.generateContent(safePrompt);
    
    if (!result || !result.response) {
      throw new Error("No response received from Gemini API");
    }

    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response received from Gemini API");
    }

    // Parse the response
    const sections = text.split(/OVERVIEW:|ACTIVITIES:|ASSESSMENT:/);
    
    if (sections.length < 4) {
      throw new Error("Invalid response format from Gemini API. Please try again.");
    }

    const plan = {
      overview: sections[1]?.trim() || "Overview not generated",
      activities: sections[2]?.trim() || "Activities not generated",
      assessment: sections[3]?.trim() || "Assessment not generated",
    };

    // Validate the generated content
    if (!plan.overview || !plan.activities || !plan.assessment) {
      throw new Error("Incomplete lesson plan generated. Please try again.");
    }

    return plan;
  } catch (error) {
    console.error("Error generating lesson plan:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate lesson plan: ${error.message}`);
    }
    throw new Error("Failed to generate lesson plan: Unknown error occurred");
  }
}