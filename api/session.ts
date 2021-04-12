import { VercelRequest, VercelResponse } from "@vercel/node";
import okta from "@okta/okta-sdk-nodejs";

// populate Org URL and Token from env variables
// OKTA_CLIENT_ORGURL=https://dev-1234.oktapreview.com/
// OKTA_CLIENT_TOKEN=xYzabc
const oktaClient = new okta.Client({
  orgUrl: process.env.OKTA_CLIENT_ORGURL,
  token: process.env.OKTA_CLIENT_TOKEN,
  // calling from a function, no need to cache
  //cacheMiddleware: null
});

export default async function (req: VercelRequest, res: VercelResponse) {
  // Okta EventHook verification Logic
  if (req.method === "GET") {
    const returnValue = {
      verification: req.headers["x-okta-verification-challenge"],
    };
    res.status(200).json(returnValue);
  } else if (req.method === "POST") {
    console.log("incoming post request");
    console.log(`request parameters ${req.url}`);
    // TODO check Authorization - shouldn't process requests not coming from Okta!!
    if (req?.body) {
      console.log(" -- body ---");
      const bodyStr = JSON.stringify(req.body, null, 2);
      console.log(bodyStr);
      //look for logout event and suspend user to prevent login
      const events = req.body?.data?.events;
      // Okta can batch events, so if multiple users log out we'll need to 'suspend' them all
      console.log(`received ${events.length} events`);
      events?.forEach((event) => {
        console.log(
          `Processing event: ${event.eventType} for user with id: ${event.actor.id}`
        );
        if (event.eventType === "user.session.end") {
          suspendUser(event.actor.id);
        }
      });
    }
    res.status(200).end();
  } else {
    res.status(404).json({ error: "This request is not supported" });
  }
}

async function suspendUser(id: string) {
  console.log(`Trying to suspend a User with id "${id}"`);
  try {
    let resp = await oktaClient.suspendUser(id);
    console.log(`Success suspending User with id "${id}"), response: ${resp} `);
  } catch (err) {
    console.log(`Error suspending User with id(${id}), received: ${err} `);
  }
}
