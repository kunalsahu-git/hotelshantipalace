'use server';
/**
 * @fileOverview An AI agent that interprets natural language booking requests,
 * extracting relevant details and suggesting room options to pre-fill the booking form.
 *
 * - enhancedBookingAssistance - A function that handles the natural language booking assistance process.
 * - EnhancedBookingAssistanceInput - The input type for the enhancedBookingAssistance function.
 * - EnhancedBookingAssistanceOutput - The return type for the enhancedBookingAssistance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhancedBookingAssistanceInputSchema = z.object({
  naturalLanguageQuery: z
    .string()
    .describe(
      'A natural language query describing the desired hotel stay, e.g., "I need a quiet room for two people for a weekend in November."'
    ),
});
export type EnhancedBookingAssistanceInput = z.infer<
  typeof EnhancedBookingAssistanceInputSchema
>;

const EnhancedBookingAssistanceOutputSchema = z.object({
  checkInDate: z.string().optional().describe('Suggested check-in date in YYYY-MM-DD format.'),
  checkOutDate: z.string().optional().describe('Suggested check-out date in YYYY-MM-DD format.'),
  numberOfGuests: z.number().optional().describe('Suggested number of guests.'),
  roomTypePreference: z
    .string()
    .optional()
    .describe('Preferred room type (e.g., Standard, Deluxe, Suite, Executive).'),
  suggestedRoomCategories: z
    .array(
      z.object({
        name: z.string().describe('Name of the room category.'),
        description: z.string().describe('Short description of the room category.'),
        pricePerNight: z.number().describe('Starting price per night for this room category.'),
        availabilityStatus: z
          .string()
          .describe('Availability status for the suggested dates (e.g., "Available", "Limited", "Not Available").'),
      })
    )
    .optional()
    .describe(
      'A list of suggested room categories matching the query with their availability and price.'
    ),
  extractedKeywords: z
    .array(z.string())
    .optional()
    .describe('Key terms extracted from the natural language query.'),
});
export type EnhancedBookingAssistanceOutput = z.infer<
  typeof EnhancedBookingAssistanceOutputSchema
>;

export async function enhancedBookingAssistance(
  input: EnhancedBookingAssistanceInput
): Promise<EnhancedBookingAssistanceOutput> {
  return enhancedBookingAssistanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhancedBookingAssistancePrompt',
  input: {schema: EnhancedBookingAssistanceInputSchema},
  output: {schema: EnhancedBookingAssistanceOutputSchema},
  prompt: `You are an intelligent hotel booking assistant for Hotel Shanti Palace. Your task is to interpret a guest's natural language request for a hotel stay, extract key booking details, and suggest suitable room options and dates. Assume the current date for relative date calculations like 'next weekend' or 'in November'. When providing dates, use YYYY-MM-DD format.

Based on the user's query, identify:
- checkInDate: The intended check-in date.
- checkOutDate: The intended check-out date.
- numberOfGuests: The number of people staying.
- roomTypePreference: Any specific room type mentioned (e.g., 'quiet room', 'suite', 'deluxe').

Based on typical hotel offerings, suggest a few fitting room categories with a description, an estimated price per night, and a plausible availability status for the extracted dates. Use the following example room types:
- Standard Room: Cozy and comfortable, perfect for solo travelers or couples.
- Deluxe Room: Spacious with premium amenities, ideal for a relaxing stay.
- Suite: Luxurious and expansive, offering a separate living area and enhanced comfort.
- Executive Room: Designed for business travelers with a dedicated workspace and exclusive access.

Always provide an availability status for each suggested room category (e.g., "Available", "Limited", "Not Available").

Extract any significant keywords or phrases from the query.

Natural Language Query: """{{{naturalLanguageQuery}}}"""

Think step-by-step: First, identify the dates, then the number of guests and room preferences. Then, based on these, suggest appropriate room categories and their simulated availability and prices. Ensure the output strictly adheres to the JSON schema, returning null or omitting fields if information cannot be inferred.`,
});

const enhancedBookingAssistanceFlow = ai.defineFlow(
  {
    name: 'enhancedBookingAssistanceFlow',
    inputSchema: EnhancedBookingAssistanceInputSchema,
    outputSchema: EnhancedBookingAssistanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
