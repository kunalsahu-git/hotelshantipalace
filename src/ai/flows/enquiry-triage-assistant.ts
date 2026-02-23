'use server';
/**
 * @fileOverview An AI assistant that summarizes and categorizes guest enquiries.
 *
 * - enquiryTriageAssistant - A function that handles the enquiry triage process.
 * - EnquiryTriageAssistantInput - The input type for the enquiryTriageAssistant function.
 * - EnquiryTriageAssistantOutput - The return type for the enquiryTriageAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnquiryTriageAssistantInputSchema = z.object({
  message: z.string().describe('The full message content of the guest enquiry.'),
});
export type EnquiryTriageAssistantInput = z.infer<typeof EnquiryTriageAssistantInputSchema>;

const EnquiryTriageAssistantOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the guest enquiry, no more than 2-3 sentences.'),
  category: z
    .enum([
      'Booking Inquiry',
      'Complaint',
      'General Question',
      'Feedback',
      'Maintenance Request',
      'Other',
    ])
    .describe('A suggested category for the enquiry to help with prioritization.'),
});
export type EnquiryTriageAssistantOutput = z.infer<typeof EnquiryTriageAssistantOutputSchema>;

export async function enquiryTriageAssistant(
  input: EnquiryTriageAssistantInput
): Promise<EnquiryTriageAssistantOutput> {
  return enquiryTriageAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enquiryTriageAssistantPrompt',
  input: {schema: EnquiryTriageAssistantInputSchema},
  output: {schema: EnquiryTriageAssistantOutputSchema},
  prompt: `You are an AI assistant for the Hotel Shanti Palace staff. Your task is to help staff quickly understand guest enquiries.

Read the following guest enquiry message carefully. Then, provide a concise summary (2-3 sentences) of the message and categorize its main intent from the available options.

Enquiry Message: """{{{message}}}"""

Consider the following categories for your response: Booking Inquiry, Complaint, General Question, Feedback, Maintenance Request, Other.

Your output MUST be a JSON object with two fields: 'summary' and 'category'.`,
});

const enquiryTriageAssistantFlow = ai.defineFlow(
  {
    name: 'enquiryTriageAssistantFlow',
    inputSchema: EnquiryTriageAssistantInputSchema,
    outputSchema: EnquiryTriageAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
