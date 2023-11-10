// UtilFunctions.ts
// CITATION: Refactoring into this class was assisted by CHAT GPT. The below methods were aided by Chat GPT in figuring
//           out initial logic and high-level implementation
import * as fs from "fs-extra";
import JSZip from "jszip";
import {InsightError} from "./IInsightFacade";
import {DataSet, DataSetManager, TempSection} from "./DataSet";
// Citation: all the following functions below generated with help of ChatGPT
export async function unzipZipFileFromString(zipFileContent: string): Promise<Map<string, string>> {
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
export async function processFiles(fileContents: Map<string, string>, schema: any, dataset: DataSet) {
	for (const [fileName, data] of fileContents.entries()) {
		try {
			const jsonArray = global.JSON.parse(data);
			if (Array.isArray(jsonArray.result)) {
				jsonArray.result.forEach((jsonObject: any) => {
					const isValid = DataSetManager.validateAgainstSchema(jsonObject, schema);
					if (isValid) {
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
							jsonObject.Audit,
							jsonObject.Section
						);
						const updatedSection = DataSetManager.identifierSwitch(section);
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
export async function writeToJsonFile(filePath: string, data: string) {
	try {
		const dir = filePath.substring(0, filePath.lastIndexOf("/"));
		await fs.ensureDir(dir);
		await fs.writeFile(filePath, data, "utf8");
	} catch (error) {
		console.error("Error writing to ${filePath}:", error);
		return Promise.reject(new InsightError("Invalid writing path"));
	}
}
export async function deleteFile(filePath: string): Promise<void> {
	try {
		await fs.unlink(filePath);
		console.log(`File ${filePath} deleted successfully.`);
	} catch (error) {
		console.error(`Error deleting file ${filePath}:`, error);
		return Promise.reject(new InsightError("Invalid deleting path"));
	}
}
