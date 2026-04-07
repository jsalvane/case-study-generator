import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { productLine, industry, product, challenge, solution, result } = req.body;

  if (!challenge || !solution || !result) {
    return res.status(400).json({ error: 'Challenge, solution, and result are required to generate a title.' });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `You are writing a headline for a B2B industrial case study for A.W. Chesterton Company.

Given the following case study details, generate ONE concise, compelling case study title. The title should:
- Highlight the key outcome or benefit (include specific metrics if available)
- Mention the product or solution if relevant
- Be specific to the industry context
- Be 10-20 words maximum
- Sound professional and results-focused (not salesy)
- Follow this pattern where appropriate: "[Outcome] with [Product/Solution] in [Industry/Application]" or "How [Product] [Solved Problem] for [Industry] Customer"

Case Study Details:
Product Line: ${productLine || 'N/A'}
Industry: ${industry || 'N/A'}
Product: ${product || 'N/A'}
Challenge: ${challenge}
Solution: ${solution}
Result: ${result}

Return ONLY the title text — no quotes, no explanation, no punctuation at the end.`;

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 128,
      messages: [{ role: 'user', content: prompt }],
    });

    const title = response.content[0]?.text?.trim() ?? '';
    return res.status(200).json({ title });
  } catch (err) {
    console.error('generate-title error:', err);
    const message = err?.message || 'Unknown error';
    return res.status(500).json({ error: `Title generation failed: ${message}` });
  }
}
