import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError, ResultTooLargeError,
} from "./IInsightFacade";
import {QueryNode} from "./QueryNode";
import e from "express";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	constructor() {
		console.log("InsightFacadeImpl::init()");
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		return Promise.reject("Not implemented.");
	}

	public removeDataset(id: string): Promise<string> {
		return Promise.reject("Not implemented.");
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		// Step 1: Ensure that the query is an object
		if (typeof query !== "object" || query === null) {
			return Promise.reject(new InsightError("Query must be a valid object"));
		}
		// Get the DataSetID
		const dataSetID = this.getDataSetID();

		// Create a QueryNode and validate it
		let queryNode: QueryNode;
		try {
			queryNode = new QueryNode(query as any, dataSetID);
			if (!queryNode.validate()) {
				return Promise.reject(new InsightError("Invalid query"));
			}
		} catch (error) {
			return Promise.reject(new InsightError("Unknown failure"));
		}

		// Evaluate the query against the dataset
		const dataset = this.getDataset(dataSetID);
		let results: InsightResult[];
		try {
			results = queryNode.evaluate(dataset);
		} catch (error) {
			if (error instanceof ResultTooLargeError) {
				return Promise.reject(error);
			}
			return Promise.reject(new InsightError("Error evaluating the query"));
		}
		// Ensure the results are less than or equal to 5000
		if (results.length > 5000) {
			return Promise.reject(new ResultTooLargeError("More than 5000 results found"));
		}

		return Promise.resolve(results);
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}

	// Placeholder methods, replace with actual methods once done
	private getDataSetID(): string {
		// Replace with your method to get the dataset ID
		return "sample-dataset-id";
	}

	private getDataset(dataSetID: string): any[] {
		// Replace with your method to get the dataset
		return [];
	}
}
