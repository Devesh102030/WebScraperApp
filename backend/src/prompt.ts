export const getReviewSummaryPrompt = (reviews: string[]): string => `
I have an array of customer reviews about a product. Some reviews may be incomplete, distorted, or contain irrelevant information. Your task is to:
1. Extract valid and meaningful reviews from the provided data.
2. Ignore any distorted, incomplete, or irrelevant reviews.
3. Summarize the overall sentiment and key points based on the extracted reviews.
4. Highlight common praises, complaints, and any recurring themes.
5. Return the result in a structured JSON format.

### **Input:**
Here is the array of reviews:
\`\`\`json
${JSON.stringify(reviews, null, 2)}
\`\`\`

### **Output Format (Example JSON Structure):**
\`\`\`json
{
  "overall_sentiment": "<Positive | Neutral | Negative>",
  "common_praises": ["<key positive points>"],
  "common_complaints": ["<key negative points>"],
  "summary": "<brief summary of product quality, features, and user experience>"
}
\`\`\`

Please analyze the reviews and provide the JSON output accordingly.
`;
