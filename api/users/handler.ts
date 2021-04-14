import { VercelRequest, VercelResponse } from "@vercel/node";
import okta from "@okta/okta-sdk-nodejs";
import { log, LogLevel } from "../utils";

// populate Org URL and Token from env variables
// OKTA_CLIENT_ORGURL=https://dev-1234.oktapreview.com/
// OKTA_CLIENT_TOKEN=xYzabc
const oktaClient = new okta.Client({
  orgUrl: process.env.OKTA_CLIENT_ORGURL,
  token: process.env.OKTA_CLIENT_TOKEN,
  // calling from a function, no need to cache
  //cacheMiddleware: null,
});

export default async function (req: VercelRequest, resp: VercelResponse) {
  // TODO in production setting check that request or request origin is authorized
  // --- using api routes for REST experience
  // /api/users/{user}/op1/op2/... -> {id=user, res=opt2, action=opt3} 
  // this is done in vercel.json
  log(LogLevel.Debug,` Incoming request: ${req.url}`);
  console.log("req.query has:");
  for(let k in req.query){
    console.log(`"${k}" = ${req.query[k]}`);
  }

  try {
    if (req.method === "GET") {
      log(LogLevel.Debug, `Performing GET on URI ${req.url}`);
      handleUserGet( req, resp);
    } else if (req.method === "POST") {
      log(LogLevel.Debug, `Performing POST on URI ${req.url}`);
      handleUsersPost( req, resp);
    } else {
      resp.status(405).json({ error: "This request is not supported" });
    }
  } catch (err) {
    //handle all Okta API errors
    log(
      LogLevel.Production,
      `Error performing '${req.method}' on URI: ${req.url}' User with id: ${req.query.id}, Error : ${err} `
    );
    resp.status(err.status || 500).json({ error: `${err}` });
  }
}

async function handleUserGet(
  req: VercelRequest,
  res: VercelResponse
) {
  const id = req.query.id as string;
  const user = await oktaClient.getUser(id);
  let checkResult = {
    managed: user.profile["device_trust"] ? true : false, // this is a custom field so can be undefined
    status: user.status,
    fwToken: "xxsometoken", // the idea is that fw client can verify request
  };
  log(
    LogLevel.Info,
    `User with id ${decodeURIComponent(
      id
    )} is subject to Device Trust policies: ${checkResult.managed}`
  );
  res.status(200).json(checkResult);
}

async function handleUsersPost(
  req: VercelRequest,
  res: VercelResponse
) {
  const id = req.query.id as string;
  // mimic Okta APIs /api/users/{id}/lifecycle/unsuspend
  log(LogLevel.Debug,`Attempting to unsuspend User with id: ${id}`);
  if ( req.query.action === "unsuspend") {
    const resp = await oktaClient.unsuspendUser(id);
    log(LogLevel.Info, `Success: User with ${id} unsuspended `);
  } else {
    res
      .status(404)
      .json({ error: `Request for '${req.url}' is not supported` });
  }
}
