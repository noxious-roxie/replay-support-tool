export default async function handler(req, res) {
  const mon = req.query.mon?.toLowerCase();
  const url = `https://play.pokemonshowdown.com/sprites/gen5/${mon}.png`;

  res.status(200).json({ sprite: url });
}
