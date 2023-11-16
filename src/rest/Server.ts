import express, {Application, Request, Response} from "express";
import * as http from "http";
import cors from "cors";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, InsightError, NotFoundError} from "../controller/IInsightFacade";

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;
	private facade: InsightFacade;

	constructor(port: number) {
		console.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();

		this.registerMiddleware();
		this.registerRoutes();
		this.facade = new InsightFacade();

		// NOTE: you can serve static frontend files in from your express server
		// by uncommenting the line below. This makes files in ./frontend/public
		// accessible at http://localhost:<port>/
		// this.express.use(express.static("./frontend/public"))
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public start(): Promise<void> {
		return new Promise((resolve, reject) => {
			console.info("Server::start() - start");
			if (this.server !== undefined) {
				console.error("Server::start() - server already listening");
				reject();
			} else {
				this.server = this.express
					.listen(this.port, () => {
						console.info(`Server::start() - server listening on port: ${this.port}`);
						resolve();
					})
					.on("error", (err: Error) => {
						// catches errors in server start
						console.error(`Server::start() - server ERROR: ${err.message}`);
						reject(err);
					});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public stop(): Promise<void> {
		console.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				console.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					console.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware() {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({type: "application/*", limit: "10mb"}));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// Registers all request handlers to routes
	private registerRoutes() {
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		this.express.get("/echo/:msg", Server.echo);

		// TODO: your other endpoints should go here

		// PUT Request
		this.express.put("/dataset/:id/:kind", this.putDataset.bind(this));

		// DELETE Request
		this.express.delete("/dataset/:id", this.deleteDataset.bind(this));

		// POST Request
		this.express.post("/query", this.postQuery.bind(this));

		// GET Request
		this.express.post("/datasets", this.getDatasets.bind(this));
	}

	// The next two methods handle the echo service.
	// These are almost certainly not the best place to put these, but are here for your reference.
	// By updating the Server.echo function pointer above, these methods can be easily moved.
	private static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}

	private async putDataset(req: Request, res: Response) {
		try {
			// Extract dataset ID from URL parameter
			const id: string = req.params.id;
			// Extract dataset kind from the URL and cast to InsightDatasetKind
			const kind: InsightDatasetKind = req.params.kind as InsightDatasetKind;
			// Convert the raw zip file bugger from the request body to a base64 string
			const content: string = req.body.toString("base64");
			// console.log("id is:", id);
			// console.log("kind is", kind);
			// console.log("content is", content);

			const result = await this.facade.addDataset(id, content, kind);
			res.status(200).json({result: result});
		} catch (err) {
			if (err instanceof Error) {
				console.log(err.message);
				res.status(400).json({error: err.message});
			} else {
				res.status(500).json({error: "Internal Server error"});
			}
		}
	}

	private async deleteDataset(req: Request, res: Response) {
		try {
			// Extract dataset ID from URL
			const id: string = req.params.id;

			// call removeDataset
			const result = await this.facade.removeDataset(id);
			res.status(200).json({result: result});
		} catch (err) {
			if (err instanceof NotFoundError) {
				// If the dataset is not found, respond with HTTP 404
				res.status(404).json({error: err.message});
			} else if (err instanceof InsightError) {
				// For other errors (e.g., invalid ID), respond with HTTP 400
				res.status(400).json({error: err.message});
			} else {
				// For unhandled errors, respond with HTTP 500 (Internal Server Error)
				res.status(500).json({error: "Internal Server Error"});
			}
		}
	}

	// TODO: maybe we should add security checks so we don't get hit with a stack attack using a query
	private async postQuery(req: Request, res: Response) {
		try {
			// Extract the query from the request body
			const query = req.body;

			// Check the query is present and not null
			if (!query) {
				throw new InsightError("Query is missing or malformed");
			}

			// Perform query
			const result = await this.facade.performQuery(query);
			res.status(200).json({result: result});
		} catch (err) {
			if (err instanceof InsightError) {
				console.log(err.message);
				res.status(400).json({error: err.message});
			} else {
				// Handle uncaught exception with HTTP 500
				res.status(500).json({error: "Internal Server Error"});
			}
		}
	}

	private async getDatasets(req: Request, res: Response) {
		try {
			// Retrieve the datasets in list form
			const datasets = await this.facade.listDatasets();
			res.status(200).json({result: datasets});
		} catch (err) {
			// Handle any unexpected errors with 500
			console.error("Error in getDatasets: ", err);
			res.status(500).json({error: "Internal Server Error"});
		}
	}
}
