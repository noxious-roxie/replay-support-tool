export default async function handler(req, res) {
  try {
    const { text } = req.body;

    // Detect Pokémon code like :charizard:
    const formatted = text.replace(/:([a-z0-9\-]+):/gi, (match, pkm) => {
      return `[IMG]https://play.pokemonshowdown.com/sprites/gen5/${pkm}.png[/IMG]`;
    });

    res.status(200).json({ result: formatted });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
}
