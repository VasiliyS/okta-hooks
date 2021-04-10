import { VercelRequest, VercelResponse } from "@vercel/node";

export default function (req: VercelRequest, res: VercelResponse) {
  // Okta EventHook verification Logic
  if (req.method === "GET") {
    const returnValue = {
      verification: req.headers["x-okta-verification-challenge"],
    };
    res.status(200).json(returnValue);
  } else if (req.method === 'POST'){
      console.log('incoming post request')
      console.log(`request parameters ${req.url}`)
      for(const k in req.query){
        console.log(`query has key: ${k} = ${req.query[k]}`)
      }
      if(req.body != null){ 
        console.log(" -- body ---")
        const bodyStr = JSON.stringify(req.body)
        console.log(bodyStr)
      }
      res.status(200).end();
  } else {
    res.status(404).json({ error: 'This request is not supported' })
  }
}
