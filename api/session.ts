import { VercelRequest, VercelResponse } from "@vercel/node";

export default function (req: VercelRequest, res: VercelResponse) {
  // Okta EventHook verification Logic
  if (req.method === "GET") {
    const returnValue = {
      verification: req.headers["x-okta-verification-challenge"],
    };
    res.status(200).json(returnValue);
  } else if (req.method === 'POST'){
      console.log('incoming post request');
      console.log(`request parameters ${req.url}`);
      // TODO check Authorization - shouldn't process requests not coming from Okta!!
      if(req?.body){ 
        console.log(" -- body ---");
        const bodyStr = JSON.stringify(req.body, null, 2);
        console.log(bodyStr);
        //look for logout event and suspend user to prevent login 
        const events = req.body?.data?.events;
        // Okta can batch events, so if multiple users log out we'll need to 'suspend' them all
        events?.forEach(event => {
          if(event.evenType === 'user.session.end'){
            suspendUser(event.actor.id);
          }
        });
      }
      res.status(200).end();
  } else {
    res.status(404).json({ error: 'This request is not supported' });
  }
}

import {Client} from "@okta/okta-sdk-nodejs";
// populate Org URL and Token from env variables
  // OKTA_CLIENT_ORGURL=https://dev-1234.oktapreview.com/
  // OKTA_CLIENT_TOKEN=xYzabc
  const client = new Client({
    // calling from a function, no need to cache 
    cacheMiddleware: null
  });

function suspendUser(id: string): boolean{
  client.suspendUser(id)
    .then(function(){
      console.log(`Success suspending User with id(${id})`);
    })
    .catch( err => {
      console.log(`Error suspending User with id(${id}), received: ${err} `);
      return false;
    })
  return true;
}