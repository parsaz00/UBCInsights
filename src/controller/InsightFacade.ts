// Citation: Used ChatGPT for suggestions on to why previous commit had timeout issues. Pointed out that we were
// 			 unnecessarily writing to disk twice, and so, we changed unzipZipFileFromString and processFromFile. It
// 			 suggested using a datastructure to hold the unzipped data from processing, so we could process from memory
// 			 as such, we decided to use a map to store unzipped data, process it, then store it disk to speed up the process
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, InsightResult, NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import {DataSet, DataSetManager, DatasetSection, TempSection} from "./DataSet";
import * as fs from "fs-extra";
import JSZip from "jszip";
import {QueryNode} from "./QueryNode";
const dataSetFolder = "./data";
/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 */
const Schema = {
	type: "object",
	properties: {id: {type: "number"}, Course: {type: "string"}, Title: {type: "string"}, Professor: {type: "string"},
		Subject: {type: "string"}, Year: {type: "string"}, Avg: {type: "number"}, Pass: {type: "number"},
		Fail: {type: "number"}, Audit: {type: "number"},},
	required: ["id", "Course", "Title", "Professor", "Subject", "Year", "Avg", "Pass", "Fail", "Audit"],
};
export default class InsightFacade implements IInsightFacade {
	private datasetmap = new DataSetManager();
	private datasetsLoaded: boolean = false; // see citation for ensureDatasetsLoaded
	constructor() {
		console.log("InsightFacadeImpl::init()");
	}
	// citation: Used GPT to get idea for this approach. suggested using a method in tandem with a boolean member
	// 			 to ensure that datasets are loaded before any method is called

	public ensureDatasetsLoaded(): void {
		if (!this.datasetsLoaded) {
			try {
				fs.ensureDirSync(dataSetFolder);
				const files = fs.readdirSync(dataSetFolder);
				for (const file of files) {
					const filePath = `${dataSetFolder}/${file}`;
					const data = fs.readFileSync(filePath, "utf8");
					const dataset: DataSet = global.JSON.parse(data);
					this.datasetmap.map.set(dataset.id, dataset);
				}
				this.datasetsLoaded = true;
			} catch (error) {
				console.error("Error loading datasets from disk:", error);
			}
		}
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		this.ensureDatasetsLoaded();
		if (!isNotEmptyOrWhitespace(id)) {
			return Promise.reject(new InsightError("ID cannot be whitespace"));
		}
		if (id.includes("_")) {
			return Promise.reject(new InsightError("ID cannot include underscore _"));
		}
		if (this.datasetmap.map.has(id)) {
			return Promise.reject(new InsightError("Duplicated id is not allowed, pick new id"));
		}
		if (content.length === 0) {
			return Promise.reject(new InsightError("Rejected because content is empty"));
		}
		let tempDataSet: DataSet = new DataSet(id, [], kind, 0);
		const decodedBuffer = Buffer.from(content, "base64");
		const decodedString = decodedBuffer.toString("binary");
		const fileContents = await unzipZipFileFromString(decodedString);
		await processFiles(fileContents, Schema, tempDataSet);
		this.datasetmap.map.set(id, tempDataSet);
		const keysIterator = this.datasetmap.map.keys();
		let keysArray = Array.from(keysIterator);
		const jsonString = global.JSON.stringify(tempDataSet, null, 2);
		const patha = dataSetFolder + "/" + id;
		await writeToJsonFile(patha, jsonString);
		tempDataSet.numRows = tempDataSet.section.length;
		return Promise.resolve(keysArray);
	}

	public removeDataset(id: string): Promise<string> {
		this.ensureDatasetsLoaded();
		if (!isNotEmptyOrWhitespace(id)) {
			return Promise.reject(new InsightError("Invalid id"));
		}
		if (id.includes("_")) {
			return Promise.reject(new InsightError("Invalid id"));
		}
		if (!this.datasetmap.map.has(id)) {
			return Promise.reject(new NotFoundError("Id not Found"));
		}
		const fullFilePath = dataSetFolder + "/" + id;
		deleteFile(fullFilePath)
			.then(() => {
				console.log("Deletion completed.");
			})
			.catch((error) => {
				console.error("Error:", error);
			});
		this.datasetmap.map.delete(id);
		return Promise.resolve(id);
	}

	public listDatasets(): Promise<InsightDataset[]> {
		this.ensureDatasetsLoaded();
		const insightDatasets: InsightDataset[] = Array.from(this.datasetmap.map.values()).map((dataset) => ({
			id: dataset.id,
			kind: dataset.kind, // Set the kind property
			numRows: dataset.numRows, // Set the numRows property
		}));
		return Promise.resolve(insightDatasets);
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		this.ensureDatasetsLoaded();
		// Step 1: Ensure that the query is an object
		if (typeof query !== "object" || query === null) {
			return Promise.reject(new InsightError("Query must be a valid object"));
		}
		const dataSetID = this.getDataSetID(query);
		let queryNode: QueryNode;
		try {
			queryNode = new QueryNode(query as any, dataSetID);
			if (!queryNode.validate()) {
				return Promise.reject(new InsightError("Invalid query"));
			}
		} catch (error) {
			return Promise.reject(new InsightError("Invalid query"));
		}
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
		if (results.length > 5000) {
			return Promise.reject(new ResultTooLargeError("More than 5000 results found"));
		}
		return Promise.resolve(results);
	}

	private extractDatasetIDFromQuery(query: any): string | null {
		let datasetID = this.extractFromWhere(query);
		if (datasetID) {
			return datasetID;
		}
		return this.extractFromOptions(query);
	}

	// Citation: Chat GPT used to help create the logic and implementation for this method and extractFromOptions
	private extractFromWhere(query: any): string | null {
		if (query && query.WHERE) {
			for (let condition in query.WHERE) {
				const value = query.WHERE[condition];
				if (typeof value === "object" && !Array.isArray(value)) {
					const field = Object.keys(value)[0];
					const parts = field.split("_");
					if (parts.length > 1) {
						return parts[0];
					}
					// Handle NOT filter
					if (condition === "NOT") {
						return this.extractDatasetIDFromQuery({WHERE: value});
					}
				} else if (Array.isArray(value)) {
					for (let subCondition of value) {
						const id = this.extractDatasetIDFromQuery({WHERE: subCondition});
						if (id) {
							return id;
						}
					}
				}
			}
		}
		return null;
	}

	private extractFromOptions(query: any): string | null {
		if (query && query.OPTIONS && query.OPTIONS.COLUMNS) {
			for (let column of query.OPTIONS.COLUMNS) {
				const parts = column.split("_");
				if (parts.length > 1) {
					return parts[0];
				}
			}
		}
		return null;
	}

	private getDataSetID(query: any): string {
		return this.extractDatasetIDFromQuery(query) || "";
	}

	private getDataset(dataSetID: string): DataSet {
		const dataset = this.datasetmap.map.get(dataSetID);
		if (!dataset) {
			throw new InsightError(`Dataset was not found for ID: ${dataSetID}`);
		}
		return dataset;
	}
}
function isNotEmptyOrWhitespace(input: string): boolean {
	const regex = /\S/;
	return regex.test(input);
}
// Citation: function below generated with help of ChatGPT
async function unzipZipFileFromString(zipFileContent: string): Promise<Map<string, string>> {
	const fileContents = new Map<string, string>();
	const jszip = new JSZip();
	const zip = await jszip.loadAsync(zipFileContent);
	await Promise.all(
		Object.keys(zip.files).map(async (fileName) => {
			if (!zip.files[fileName].dir) {
				const fileData = await zip.files[fileName].async("string");
				fileContents.set(fileName, fileData);
			}
		})
	);
	return fileContents;
}
// Citation: function below generated with help of ChatGPT
function validateAgainstSchema(jsonData: any, schema: any): boolean {
	const {properties, required} = schema;
	for (const key of required) {
		if (!(key in jsonData)) {
			console.error(`Missing required property: ${key}`);
			return false; // Required property is missing
		}
		const propertySchema = properties[key];
		if (propertySchema.type === "string" && typeof jsonData[key] !== "string") {
			return false; // Property is not of type string
		}
		if (propertySchema.type === "number" && typeof jsonData[key] !== "number") {
			return false; // Property is not of type number
		}
	}
	return true; // Validation passed
}
// Citation: the next three functions below generated with help of ChatGPT
function identifierSwitch(obj: any): DatasetSection {
	let year: number;
	if (obj.Section === "overall") {
		year = 1900;
	} else {
		year = Number(obj.Year);
	}
	return new DatasetSection(String(obj.id) || "", obj.Course || "", obj.Title || "",
		obj.Professor || "", obj.Subject || "", year || 0, obj.Avg || 0, obj.Pass || 0,
		obj.Fail || 0, obj.Audit || 0);
}
async function processFiles(fileContents: Map<string, string>, schema: any, dataset: DataSet) {
	for (const [fileName, data] of fileContents.entries()) {
		try {
			const jsonArray = global.JSON.parse(data);
			if (Array.isArray(jsonArray.result)) {
				jsonArray.result.forEach((jsonObject: any) => {
					const isValid = validateAgainstSchema(jsonObject, schema);
					if (isValid) {
						const section = new TempSection(jsonObject.id, jsonObject.Course, jsonObject.Title,
							jsonObject.Professor, jsonObject.Subject, jsonObject.Year, jsonObject.Avg, jsonObject.Pass,
							jsonObject.Fail, jsonObject.Audit, jsonObject.Section);
						const updatedSection = identifierSwitch(section);
						dataset.section.push(updatedSection);
					} else {
						console.error(`JSON data in file ${fileName} is not valid. Skipping invalid entry.`);
					}
				});
			} else {
				console.error(`JSON data in file ${fileName} is not an array. Skipping file.`);
			}
		} catch (error) {
			console.error(`Error processing JSON file ${fileName}:`, error);
		}
	}
}
async function writeToJsonFile(filePath: string, data: string) {
	try {
		const dir = filePath.substring(0, filePath.lastIndexOf("/"));
		console.log("dir in wrtieToJsonFile is: ", dir);
		console.log("file path is:", filePath);
		await fs.ensureDir(dir);
		await fs.writeFile(filePath, data, "utf8");
		console.log("Data written to ${filePath}");
	} catch (error) {
		console.error("Error writing to ${filePath}:", error);
		return Promise.reject(new InsightError("Invalid writing path"));
	}
}
async function deleteFile(filePath: string): Promise<void> {
	try {
		await fs.unlink(filePath);
		console.log(`File ${filePath} deleted successfully.`);
	} catch (error) {
		console.error(`Error deleting file ${filePath}:`, error);
		return Promise.reject(new InsightError("Invalid deleting path"));
	}
}
