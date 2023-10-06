import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import {DataSet, DataSetManager, Section, TempSection} from "./DataSet";

import * as fs from "fs-extra";
import JSZip from "jszip";
import path from "node:path";

// folder that contains the zip files
const zipFolder = "./project_team127/test/resources/archives";
// folder to store the files unzipped from the zip file
const outputFolder = "./output_data";
// folder to store the dataset
const dataSetFolder = "./data";
const folderName = "courses";
const datasetmap = new DataSetManager();

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
const Schema = {
	type: "object",
	properties: {
		id: {type: "string"},
		Course: {type: "string"},
		Title: {type: "string"},
		Professor: {type: "string"},
		Subject: {type: "string"},
		Year: {type: "number"},
		Avg: {type: "number"},
		Pass: {type: "number"},
		Fail: {type: "number"},
		Audit: {type: "number"},
	},
	required: ["id", "Course", "Title", "Professor", "Subject", "Year", "Avg", "Pass", "Fail", "Audit"],
};

console.log(Schema);

export default class InsightFacade implements IInsightFacade {
	constructor() {
		console.log("InsightFacadeImpl::init()");
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// Use a regular expression to check if id is valid. If not, return

		if (!isNotEmptyOrWhitespace(id)) {
			return Promise.reject(new InsightError("Invalid id"));
		}
		if (id.includes("_")) {
			return Promise.reject(new InsightError("Invalid id"));
		}
		if (datasetmap.map.has(id)) {
			return Promise.reject(new InsightError("Duplicated id"));
		}

		// create dataset for the data with name id
		let tempDataSet: DataSet = new DataSet(id, [], kind, 0);

		// unzip the zip file from zipFolder to JSON files and put them in outputFolder
		unzipZipFileFromString(content, outputFolder).catch((error) => {
			console.error("Error unzipping files:", error);
			return Promise.reject(new InsightError("Invalid content"));
		});

		// JSON files of courses should be in the following path
		const coursePath = path.join(outputFolder, folderName);

		/* read through all JSON files in the outputFolder and validate them against the schema. If not valid, delete the
         JSON file. If valid, copy the data to a temp class called TempSection, transfer the identifier of TempSection to
         Section, and push the section to the dataset */

		processFiles(coursePath, Schema, tempDataSet);

		// add the DataSet to DataSetManager map
		datasetmap.map.set(id, tempDataSet);
		const keysIterator = datasetmap.map.keys();
		let keysArray = Array.from(keysIterator);

		// write the tempDataSet into JSON file on the disk
		const jsonString = JSON.stringify(tempDataSet, null, 2);
		const patha = path.join(dataSetFolder, id);
		await writeToJsonFile(patha, jsonString);
		tempDataSet.numRows = tempDataSet.section.length;
		return Promise.resolve(keysArray);
	}

	public removeDataset(id: string): Promise<string> {
		if (!isNotEmptyOrWhitespace(id)) {
			return Promise.reject(new InsightError("Invalid id"));
		}
		if (id.includes("_")) {
			return Promise.reject(new InsightError("Invalid id"));
		}
		if (!datasetmap.map.has(id)) {
			return Promise.reject(new NotFoundError("Id not Found"));
		}
		const fullFilePath = path.join(dataSetFolder, id); // Replace with the full path to the file
		// delete the file from disk
		deleteFile(fullFilePath)
			.then(() => {
				console.log("Deletion completed.");
			})
			.catch((error) => {
				console.error("Error:", error);
			});
		// delete the dataset itself(?)
		// delete the key pairs in the DataSetManager map
		datasetmap.map.delete(id);
		return Promise.resolve(id);
	}

	public listDatasets(): Promise<InsightDataset[]> {
		const insightDatasets: InsightDataset[] = Array.from(datasetmap.map.values()).map((dataset) => ({
			id: dataset.id,
			kind: dataset.kind, // Set the kind property based on your logic
			numRows: dataset.numRows, // Set the numRows property based on your logic
		}));
		return Promise.resolve(insightDatasets);
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return Promise.reject("Not implemented.");
	}
}

function isNotEmptyOrWhitespace(input: string): boolean {
	const regex = /\S/;
	return regex.test(input);
}

async function unzipZipFileFromString(zipFileContent: string, outputF: string): Promise<void> {
	try {
		const jszip = new JSZip();

		// Load the ZIP file content from the provided string
		const zip = await jszip.loadAsync(zipFileContent);

		await Promise.all(
			Object.keys(zip.files).map(async (fileName) => {
				const fileData = await zip.files[fileName].async("nodebuffer");
				const outputPath = path.join(outputF, fileName);

				await fs.ensureDir(path.dirname(outputPath));
				await fs.writeFile(outputPath, fileData);
				console.log(`Extracted: ${outputPath}`);
			})
		);

		console.log("ZIP file extraction completed.");
	} catch (error) {
		console.error("ZIP file extraction failed:", error);
	}
}

// validating json file
function validateAgainstSchema(jsonData: any, schema: any): boolean {
	// Validate JSON data against the schema
	const {properties, required} = schema;

	for (const key of required) {
		if (!(key in jsonData)) {
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

function identifierSwitch(obj: any): Section {
	return new Section(
		obj.id || "",
		obj.Course || "",
		obj.Title || "",
		obj.Professor || "",
		obj.Subject || "",
		obj.Year || 0,
		obj.Avg || 0,
		obj.Pass || 0,
		obj.Fail || 0,
		obj.Audit || 0
	);
}

async function processFiles(coursePath: string, schema: any, dataset: DataSet) {
	try {
		const files = await fs.readdir(coursePath);

		// Use Promise.all to parallelize file processing
		await Promise.all(
			files.map(async (file) => {
				const filePath = path.join(coursePath, file);

				if (path.extname(file) === ".json") {
					try {
						const data = await fs.readFile(filePath, "utf8");
						const jsonArray = JSON.parse(data);

						if (Array.isArray(jsonArray)) {
							// JSON data is an array, iterate through it
							jsonArray.forEach((jsonObject: any) => {
								const isValid = validateAgainstSchema(jsonObject, schema);

								if (isValid) {
									// Create an instance of MyClass with valid JSON data
									const section = new TempSection(
										jsonObject.id,
										jsonObject.Course,
										jsonObject.Title,
										jsonObject.Professor,
										jsonObject.Subject,
										jsonObject.Year,
										jsonObject.Avg,
										jsonObject.Pass,
										jsonObject.Fail,
										jsonObject.Audit
									);
									const updatedSection = identifierSwitch(section);
									dataset.section.push(updatedSection);
									console.log("Valid JSON data added");
								} else {
									console.error(`JSON data in file ${file} is not valid. Skipping invalid entry.`);
								}
							});
						} else {
							console.error(`JSON data in file ${file} is not an array. Skipping file.`);
						}
					} catch (error) {
						// Log the error and continue processing other files
						console.error(`Error processing JSON file ${file}:`, error);
					}
				}
			})
		);
	} catch (error) {
		// Handle errors related to reading the directory
		throw new InsightError("Invalid reading directory");
	}
}

// Read JSON files from the folder and create Section instances
async function writeToJsonFile(filePath: string, data: string) {
	try {
		await fs.writeFile(filePath, data, "utf8");
		console.log(`Data written to ${filePath}`);
	} catch (error) {
		console.error(`Error writing to ${filePath}:`, error);
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
