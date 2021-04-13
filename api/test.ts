
import {log, LogLevel} from "./utils"

module.exports = (req, res) => {
    const date = new Date().toString();
    const debugLevel = parseInt(process.env.DEBUG_LEVEL || "0", 10);
    
    console.log(`debugLevel is ${debugLevel} / ${LogLevel[debugLevel]}`); 
    log(LogLevel.Production, "Print me at 'Production'");
    log(LogLevel.Info, "Print me at 'Info'");
    log(LogLevel.Info,"Want details? The date is: ", date);
    res.status(200).send();
  };