import { ChildProcess, spawn } from "child_process";
import { Socket } from "net";
import { Readable } from "stream";
import { findRandomOpenPort } from "~/utils/utils";

type LLaMATCPClientOptions = (
  | {
      modelPath: string;
      binPath: string;
      port: number | "auto";
    }
  | {
      port: number;
      host: string;
    }
) & {
  debug?: boolean | ((...args: any[]) => void);
};

export default class LLaMATCPClient {
  // configuration options
  private options: LLaMATCPClientOptions;

  // the llama-tcp server process
  private _process?: ChildProcess;

  // state
  public state: "loading" | "ready" | "error" = "loading";
  private _loadingPromise?: Promise<void>;

  // logging
  private _log: (...args: any[]) => void;

  /**
   * Create a new LLaMATCPClient
   * @param options - options for the client
   */
  constructor(options: LLaMATCPClientOptions) {
    // set logging
    if (options.debug === true) {
      this._log = (...args: any[]) => console.log("[llama-tcp] ", ...args);
    } else if (typeof options.debug === "function") {
      this._log = options.debug;
    } else {
      this._log = () => {};
    }

    // set options
    this.options = options;

    // if binPath is set and equals "auto", set it to the default path
    if ("binPath" in this.options && this.options.binPath === "auto") {
      this.options.binPath = "./bin/main";
    }
  }

  /**
   * Start the LLaMATCPClient
   * Creates a server process if necessary
   */
  async start() {
    // if we're already loading, return the loading promise
    if (this._loadingPromise) return this._loadingPromise;

    // create a new promise for loading
    let resolve: () => void = () => {};
    let reject: (error: Error) => void = () => {};
    this._loadingPromise = new Promise(async (res, rej) => {
      resolve = res;
      reject = rej;
    });

    // only start a server instance if binPath is set
    if ("binPath" in this.options) {
      this._log("starting server");

      // find a random port if port is set to "auto"
      if (this.options.port === "auto") {
        this._log("start(): port is set to auto, finding random open port");
        this.options.port = await findRandomOpenPort();
        this._log("start(): found random open port: ", this.options.port);
      }

      // start the server process
      this._log("start(): starting server process");
      this._process = spawn(
        this.options.binPath!,
        ["-l", this.options.port.toString(), "-m", this.options.modelPath],
        {
          stdio: "inherit",
        }
      );

      // handle errors
      this._process.on("error", (error) => {
        console.error(error);
        this.state = "error";
        reject(error);
      });

      // wait for the server to start
      this._log("start(): waiting for server to start");
      let iterations = 0;

      while (iterations < 50) {
        try {
          await this._createConnection();
          this.state = "ready";
          this._log("start(): server started successfully");
          resolve();
          return;
        } catch (error) {
          this._log(
            "start(): error: ",
            (error as any).message,
            ", retrying in 1s (",
            iterations,
            "/50)"
          );
          iterations++;
          await new Promise((res) => setTimeout(res, 1000));
        }
      }

      // if we get here, the server failed to start
      this.state = "error";
      reject(new Error("Failed to start server!"));
    } else {
      // if we don't have a binPath, we're just connecting to a remote server
      this.state = "ready";
      resolve();
    }
  }

  /**
   * Creates a new connection and asks the server to complete the given text
   * @param text - the text to complete
   * @param options - options for the completion
   * @returns a readable stream of the completion
   */
  async complete(
    text: string,
    options: {
      [key: string]: string | number | boolean;
    }
  ) {
    // make sure we're ready
    if (this.state !== "ready") {
      await this._loadingPromise;
    }

    // create a new connection
    const client = await this._createConnection();

    // build the tcp request
    let request = "";
    let args = 0;

    // the text goes in as a -p argument
    options["-p"] = text;

    // add the options
    for (const key in options) {
      // if the value is boolean and false, skip it
      if (typeof options[key] === "boolean" && !options[key]) continue;

      request += key + "\x00";
      args++;

      // if value is number, convert it to string
      if (typeof options[key] === "number") {
        options[key] = options[key]!.toString();
      }

      // if value is a non-empty string, add it
      if (typeof options[key] === "string" && options[key] !== "") {
        request += options[key] + "\x00";
        args++;
      }
    }

    // append # of args to the start of the request
    request = args.toString() + "\n" + request;

    // log the built tcp packet
    this._log(
      `complete(): sending tcp packet: `,
      request.replace("\x00", "\\x00")
    );

    // create a readable stream from the connection
    const stream = new Readable({
      read() {},
    });

    // send the request
    client.write(request);

    // variables to keep track of where we are in the response
    let gotSamplingParameters = false;
    let promptIndex = 0;

    // handle data
    client.on("data", (data) => {
      // convert the data to a string
      let parsedData = data.toString();
      this._log(`complete(): received tcp packet: `, parsedData);

      // wait for the packet with samping parameters:
      // this marks the first line of response
      if (!gotSamplingParameters) {
        if (parsedData.includes("sampling parameters:")) {
          gotSamplingParameters = true;

          // get the last line of data -- this will be part of the prompt.
          let after = parsedData.split("\n").pop()!;

          // remove the trailing space
          after = after.substring(1);

          // if the length is greater than the prompt length, then we need to substring
          if (after.length > text.length) {
            parsedData = after.substring(text.length - 1);
            console.log(parsedData, after);
          } else {
            // otherwise, ignore this chunk and update promptIndex
            promptIndex = after.length;
            return;
          }
        }

        if (parsedData === "") return;
      }

      // wait until the prompt is finished being echoed back
      if (promptIndex < text.length) {
        let requiredPromptChars = text.length - promptIndex;

        // if the data includes same amt or less chars, discard
        if (parsedData.length <= requiredPromptChars) {
          promptIndex += parsedData.length;
          return;
        }

        // otherwise, we substring what is required
        parsedData = parsedData.substring(requiredPromptChars);
        promptIndex += requiredPromptChars;
      }

      // push the data to the stream
      stream.push(parsedData);
    });

    // when the connection closes, end the stream
    client.on("close", () => {
      stream.push(null);
    });

    // handle errors
    client.on("error", (error) => {
      stream.emit("error", error);
    });

    // return the stream
    return {
      stream,
      cancel: () => {
        client.destroy();
      },
    };
  }

  private _createConnection() {
    return new Promise<Socket>((resolve, reject) => {
      // create a tcp client
      const client = new Socket();

      // make sure a port has been resolved
      if (this.options.port === "auto") {
        reject(
          new Error("_createConnection() called before port was resolved!")
        );
        return;
      }

      // default host is localhost
      const host = "host" in this.options ? this.options.host : "localhost";

      // connect it to the server
      client.connect(this.options.port, host, () => {
        this._log("_createConnection(): connected to server");
        resolve(client);
      });

      // handle errors
      client.on("error", (error) => {
        this._log("_createConnection(): error: ", error.message);
        reject(error);
      });
    });
  }
}
