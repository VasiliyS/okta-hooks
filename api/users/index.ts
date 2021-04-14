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

export default async function (req: VercelRequest, res: VercelResponse) {
  // TODO in production setting check that request or request origin is authorized
  // --- using api routes for REST experience
  // /api/users/{user}/op1/op2/... -> {"params" : ["opt1", "opt2", ...]}
  // https://nextjs.org/docs/api-routes/dynamic-api-routes
  const { params } = req.query;
  console.log("url is ", req.url);
  console.log("req.query has:");
  for(let k in req.query){
    console.log(`"${k}" = ${req.query[k]}`);
  }

  log(LogLevel.Debug,`params is: ${params}`);
  try {
    if (req.method === "GET") {
      log(LogLevel.Debug, `Performing GET on URI ${req.url}`);
      handleUserGet(params as string[], req, res);
    } else if (req.method === "POST") {
      log(LogLevel.Debug, `Performing POST on URI ${req.url}`);
      handleUsersPost(params as string[], req, res);
    } else {
      res.status(405).json({ error: "This request is not supported" });
    }
  } catch (err) {
    //handle all Okta API errors
    log(
      LogLevel.Production,
      `Error performing '${req.method}' on URI: ${req.url}' User with id: ${params[0]}, Error : ${err} `
    );
    res.status(err.status || 500).json({ error: `${err}` });
  }
}

async function handleUserGet(
  params: string[],
  req: VercelRequest,
  res: VercelResponse
) {
  const id = params[0];
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
  params: string[],
  req: VercelRequest,
  res: VercelResponse
) {
  const id = params[0];
  // mimic Okta APIs /api/users/{id}/lifecycle/unsuspend
  log(LogLevel.Debug,`Attempting to unsuspend User with id: ${id}`);
  if (params.length === 3 && params[2] === "unsuspend") {
    const resp = await oktaClient.unsuspendUser(id);
    log(LogLevel.Info, `Success: User with ${id} unsuspended `);
  } else {
    res
      .status(404)
      .json({ error: `Request for '${req.url}' is not supported` });
  }
}
