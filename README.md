# Log collection API

## About

This application is a simple API service, built on Node and Express, which allows a client to search for log lines on the server's local system.

It prevents path traversal and accesses logs in the system's `/var/log` directory by default.

## Instructions

### Setup

* Clone this repository to your local system.
* Ensure Node v22.14 is installed. If you're using [nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating), run `nvm install` in the project's root directory to get the required Node version from `.nvmrc`, install it if necessary, and use it.
* Install dependencies: `npm install`
* To build and run the server on http://localhost:3000:
  * `npm run build`
  * `npm run start`
* Confirm you can make a successful API call. (Note that the default API parameters require a `/var/log/syslog` file to be present.) `curl "http://localhost:3000/lines"`

### API documentation

The server exposes one REST API endpoint, `/lines`, which returns lines from a single log file in reverse order, up to a specified limit. It optionally applies keyword matching.

| Query parameter | Description | Default value |
|---|---|---|
| `filePath` | A URL-encoded path to the log file, relative to the root log directory. | `syslog` |
| `filterQuery` | A keyword to filter returned log lines with. An empty string (`''`) matches all lines. | `''` |
| `limit` | The maximum number of lines to return. | 100 |

For example, to run a curl request for the 10 most recent lines containing "Processing" in `/var/log/apt/term.log`:

`curl "http://localhost:3000/lines?filePath=apt%2Fterm.log&filterQuery=Processing&limit=10"`

### Configuration

#### Log directory

By default, the server searches for log files in the local system's `/var/log` directory. For easier local shakeout testing, you can configure a different directory by setting the `ROOT_LOG_DIRECTORY` environment variable.

For example, to search for logs in the project's tmp directory, run the server with: `ROOT_LOG_DIRECTORY=tmp npm run start`

### Other development and test commands

#### Automated testing

Unit tests are implemented with Jest. Run the suite with:

`npm run test`

#### Linting

Run ESLint and Prettier checks for code style and formatting with:

`npm run lint`

#### Development mode

You can run the server for local development with just-in-time compilation, using the `ts-node-dev` package:

`npm run dev`

#### Generating a large mock log file

For manual performance testing benchmarking, the project includes a script to create a large, mock log file of 13 million lines, roughly 1GB in size.
The generated file is named `mock-big-log.txt` and stored in the project's `tmp` directory.

Run: `npx ts-node scripts/generate-big-log.ts`

To run the server against this file:
* Start the server with the log directory set: `ROOT_LOG_DIRECTORY=tmp npm run start`
* Pass the log name in your API requests, for example: `curl "http://localhost:3000/lines?filePath=mock-big-log.txt"`

Each line in the generated log is structured is structured like this example:

`2025-04-10 10:33:27 mock log content rand10(7) rand1000(443) rand1000000(958764)`

To test filtering behavior at different densities, each line contains the terms `rand10(X)`, `rand1000(Y)`, and `rand1000000(Z)`, where X, Y, and Z are random integers between 0 and (respectively) 9, 999, and 999999.

So, for example, the API request `http://localhost:3000/lines?filePath=mock-big-log.txt&limit=1000&filterQuery=rand1000000(0)` will search the file for the first 1000 occurrences of a single random integer up to 1 million, which is expected to make the server process the entire log file.

## Notes and issues

The core logic of the application is built around two loops:
* An outer loop that successively streams chunks of the log file contents in reverse order
* An inner loop that parses the complete lines out of each chunk, reverses them, and applies the filter and count limit

The file is streamed to prevent the server from loading large files entirely into memory. Based on my local development environment, I've hardcoded the chunk size to 128 KiB, which has been sufficient to process all lines in a 1 GB file in under 15 seconds and to prove out the concept. To improve this I would do more refined tuning of the chunk size based on profiling the API server's memory and I/O usage. A "real" log reader API deployed on an organization's servers would need to minimize resource overhead.

I haven't yet hardened the application's behavior for the edge case of extremely high limits for large files. As a next step, I would update the API endpoint to cap the allowed number of lines.
