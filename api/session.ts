import { VercelRequest, VercelResponse } from "@vercel/node";
import * as oktaEvent from "@okta/okta-sdk-nodejs/src/types/models/LogEvent";
import okta from "@okta/okta-sdk-nodejs";
import {log, LogLevel} from "./utils";

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
    log(LogLevel.Detailed, "incoming post request");
    log(LogLevel.Detailed,`request parameters ${req.url}`);
    // TODO check Authorization - shouldn't process requests not coming from Okta!!
    if (req?.body) {
      log(LogLevel.Detailed, " --- body ---");
      log(LogLevel.Detailed, JSON.stringify(req.body, null, 2));
      //look for logout event and suspend user to prevent login
      const events = req.body?.data?.events;
      // Okta can batch events, so if multiple users log out we'll need to 'suspend' them all
      log(LogLevel.Info,`received ${events.length} events`);
      for(let i in events){
        log(LogLevel.Info,`Processing event #${i}: ${events[i].eventType} for user with id: ${events[i].actor.id}`);
        if (events[i].eventType === "user.session.end") {
          let resp = await suspendUser(events[i].actor.id);
          log(LogLevel.Info,`suspendUser returned: ${resp}`);
        }
      }
    }
    res.status(200).end();
  } else {
    res.status(404).json({ error: "This request is not supported" });
  }
}

async function suspendUser(id: string) {
  log(LogLevel.Detailed,`Trying to suspend a User with id "${id}", OrgUrl is: ${oktaClient.baseUrl}`);
  try {
    let resp = await oktaClient.suspendUser(id);
    log(LogLevel.Detailed,`Success suspending User with id "${id}"), response: ${resp} `);
    return true;
  } catch (err) {
    log(LogLevel.Production,`Error suspending User with id(${id}), received: ${err} `);
    return false;
  }
}
