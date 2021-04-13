enum LogLevel {
  Production, // Errors Only
  Info,
  Detailed
}
const debugLevel = parseInt(process.env.DEBUG_LEVEL || "0", 10);
const log = (logLevel: LogLevel, ...args) => {
    if( debugLevel >= logLevel){
      console.log(...args);
    }
};
module.exports = (req, res) => {
    const date = new Date().toString();
    console.log(`debugLevel is ${debugLevel} / ${LogLevel[debugLevel]}`); 
    log(LogLevel.Info,"The date is: ", date);
    res.status(200).send();
  };