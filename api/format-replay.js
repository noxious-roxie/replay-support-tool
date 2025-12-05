export default async function handler(req, res) {
  try {
    const { text } = req.body;

    const link = text.trim();
    const bbcode = `[URL=${link}]Replay[/URL]`;

    res.status(200).json({ result: bbcode });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
}
