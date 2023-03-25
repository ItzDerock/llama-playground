import { createServer, AddressInfo } from "net";

/**
 * Searches randomly for an open port
 * @param min The minimum port number to search for
 * @param max The maximum port number to search for
 * @param _i The current iteration
 */
export function findRandomOpenPort(min: number = 1000, max: number = 65535, _i: number = 0) {
  // if _i is a multiple of 10, log a warning
  if (_i > 0 && _i % 10 === 0) {
    console.warn(`[warn] findRandomOpenPort: ${_i} iterations, no open port found`);
  }

  // generate random port number
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

  // check if port is open
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", (error) => {
      // check the error
      if (error.message.includes("EADDRINUSE")) {
        // port is in use, try again
        resolve(findRandomOpenPort(min, max, _i + 1));
        return;
      }

      // some other error, throw it
      reject(error);
    });
    
    // attempt to listen on the port
    server.listen(randomNumber, () => {
      // success! close the server and return the port
      const { port } = server.address() as AddressInfo;
      server.close(() => {
        resolve(port);
      });
    });
  });
}