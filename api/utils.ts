export enum LogLevel {
    Production, // Errors Only
    Info,
    Detailed
  }
  const debugLevel = parseInt(process.env.DEBUG_LEVEL || "0", 10);
  export const log = (logLevel: LogLevel, ...args) => {
      if( debugLevel >= logLevel){
        console.log(...args);
      }
  };