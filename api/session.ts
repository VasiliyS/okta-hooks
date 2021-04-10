import { VercelRequest, VercelResponse } from "@vercel/node";

export default function (req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const returnValue = {
      verification: req.headers["x-okta-verification-challenge"],
    };
    res.json(returnValue);
  } else if (req.method === 'POST'){
      console.log('incoming post request')
      console.log(`request parameters ${req.url}`)
      res.status(200)
  } else {
    res.status(404).json({ error: 'This request is not supported' });
  }
}
