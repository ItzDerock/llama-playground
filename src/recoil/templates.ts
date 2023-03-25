import { stripIndents } from "common-tags";
import { atom } from "recoil";

export type TemplateData = {
  name: string;
  prompt: string;
  options?: Partial<{
    maximum_tokens: number;
    temperature: number;
    top_p: number;
    top_k: number;
    repeat_penalty: number;
    repeat_last_n: number;
  }>;
};

export const defaultTemplates: TemplateData[] = [
  {
    name: "Question Answering",
    prompt: stripIndents`
    Below is an instruction that describes a task. Write a response that appropriately completes the task. The response must be accurate, concise, coherent, and evidence-based whenever possible.

    **Task:** Describe Machine Learning in your own words.
  `,
  },
  {
    name: "Chatbot",
    prompt: stripIndents`
    Below is a conversation between two people. Write a response that appropriately completes a response for the AI. The response must be accurate, concise, coherent, and evidence-based whenever possible. Do not complete the User's part.

    User: What is Machine Learning?
    AI: 
  `,
  },
  {
    name: "Story",
    prompt: stripIndents`
    Below is a prompt for a story. The story must relate to the prompt and be creative and interesting.

    Prompt: It was a dark and stormy night...
  `,
    options: {
      temperature: 0.5,
    },
  },
];

export const allTemplatesState = atom<TemplateData[]>({
  key: "all_templates",
  default: defaultTemplates,
});
