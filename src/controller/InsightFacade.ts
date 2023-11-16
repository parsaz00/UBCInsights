// Citation: Used ChatGPT for suggestions
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import {unzipZipFileFromString, processFiles, writeToJsonFile, deleteFile} from "./UtilFunctions";
import {DataSet, DataSetManager, DatasetRoom, TempSection} from "./DataSet";
import * as fs from "fs-extra";
import JSZip from "jszip";
import * as Parse5 from "parse5";
import {QueryNode} from "./QueryNode";
import {RoomProcessing} from "./RoomProcessing";
import http from "http";

const dataSetFolder = "./data";
const Schema = {
	type: "object",
	properties: {
		id: {type: "number"},
		Course: {type: "string"},
		Title: {type: "string"},
		Professor: {type: "string"},
		Subject: {type: "string"},
		Year: {type: "string"},
		Avg: {type: "number"},
		Pass: {type: "number"},
		Fail: {type: "number"},
		Audit: {type: "number"},
	},
	required: ["id", "Course", "Title", "Professor", "Subject", "Year", "Avg", "Pass", "Fail", "Audit"],
};
export default class InsightFacade implements IInsightFacade {
	private datasetmap = new DataSetManager();
	private datasetsLoaded: boolean = false; // see citation for ensureDatasetsLoaded
	private geoCache: Record<string, any> = {};

	constructor() {
		console.log("InsightFacadeImpl::init()");
	}

	// citation: Used GPT to get idea for this approach. suggested using a method in tandem with a boolean member

	private ensureDatasetsLoaded(): void {
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
				console.log("didn't work rip bro");
			}
		}
	}

	private validateDatasetId(id: string): boolean {
		const regex = /\S/;
		console.log("ID is:", id);
		console.log("Invalid ID for test nerd");
		console.log("regex.test is", regex.test(id));
		console.log("!id.includes(_) is", !id.includes("_"));
		console.log("!this.datasetmap.map.has(id) is", !this.datasetmap.map.has(id));
		return regex.test(id) && !id.includes("_") && !this.datasetmap.map.has(id);
	}

	private validateContent(content: string): boolean {
		console.log("content is bad");
		return content.length !== 0;
	}

	// Citation: Refactoring done with the help of Chat GPT
	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		this.ensureDatasetsLoaded();
		if (!this.validateDatasetId(id) || !this.validateContent(content)) {
			return Promise.reject(new InsightError("Invalid input"));
		}
		const tempDataSet: DataSet = new DataSet(id, [], kind, 0);
		const {decodedString, fileContents} = await this.extracted(content);
		if (kind === InsightDatasetKind.Sections) {
			await processFiles(fileContents, Schema, tempDataSet);
		} else if (kind === InsightDatasetKind.Rooms) {
			const zip = await JSZip.loadAsync(decodedString);
			const indexFile = zip.file("index.htm");
			if (!indexFile) {
				return Promise.reject(new InsightError("htm file not found"));
			}
			const indexContent = await indexFile.async("string");
			if (!indexContent) {
				return Promise.reject(new InsightError("htm file content is empty or unreadable"));
			}
			if (!indexContent) {
				return Promise.reject(new InsightError("htm file not found"));
			}
			const indexDocument = Parse5.parse(indexContent);
			await this.processRooms(zip, indexDocument, tempDataSet);
		} else {
			return Promise.reject(new InsightError("Invalid kind"));
		}
		tempDataSet.numRows = tempDataSet.section.length;
		this.datasetmap.map.set(id, tempDataSet);
		await this.saveDatasetToFile(tempDataSet);
		return Promise.resolve(Array.from(this.datasetmap.map.keys()));
	}

	// Citation: Refactoring done with the help of Chat GPT
	private async processRooms(zip: JSZip, indexDocument: any, dataset: DataSet) {
		const buildingTable =
			RoomProcessing.findBuildingTable(indexDocument) ||
			(await Promise.reject(new InsightError("Building table not found")));
		const buildingLinks = RoomProcessing.getBuildingLinks(buildingTable);
		await this.getGeolocations(buildingLinks);
		await Promise.all(buildingLinks.map(this.processBuildingLink.bind(this, zip, dataset)));
	}

	// Citation: Refactoring done with the help of Chat GPT
	private async processBuildingLink(zip: JSZip, dataset: DataSet, link: any) {
		const buildingFile = zip.file(link.href.substring(2));
		if (!buildingFile) {
			return;
		}
		const buildingContent = await buildingFile.async("string");
		const buildingDocument = Parse5.parse(buildingContent);
		const roomsTable = RoomProcessing.findRoomTable(buildingDocument);
		if (!roomsTable) {
			return;
		}
		RoomProcessing.getRows(roomsTable).forEach(this.processRow.bind(this, dataset, link));
	}

	private processRow(dataset: DataSet, link: any, row: any) {
		const geoResponse = this.geoCache[link.address];
		if (!geoResponse || geoResponse.error) {
			return;
		}
		dataset.section.push(
			new DatasetRoom(
				link.fullname,
				link.shortname,
				row.number,
				`${link.shortname}_${row.number}`,
				link.address,
				geoResponse.lat,
				geoResponse.lon,
				row.seats,
				row.type,
				row.furniture,
				row.href
			)
		);
	}

	private async extracted(content: string) {
		const decodedBuffer = Buffer.from(content, "base64");
		const decodedString = decodedBuffer.toString("binary");
		const fileContents = await unzipZipFileFromString(decodedString);
		return {decodedString, fileContents};
	}

	private async saveDatasetToFile(dataset: DataSet) {
		const jsonString = global.JSON.stringify(dataset, null, 2);
		const filePath = `${dataSetFolder}/${dataset.id}`;
		await writeToJsonFile(filePath, jsonString);
		dataset.numRows = dataset.section.length;
	}

	public removeDataset(id: string): Promise<string> {
		this.ensureDatasetsLoaded();
		const regex = /\S/;
		if (!regex.test(id) || id.includes("_")) {
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
		if (typeof query !== "object" || query === null) {
			return Promise.reject(new InsightError("Query must be a valid object"));
		}
		const dataSetID = DataSetManager.getDataSetID(query);
		let queryNode: QueryNode;
		try {
			queryNode = new QueryNode(query as any, dataSetID);
			if (!queryNode.validate()) {
				return Promise.reject(new InsightError("Invalid query"));
			}
		} catch (error) {
			return Promise.reject(new InsightError("Invalid query"));
		}
		try {
			const dataset = DataSetManager.getDataset(dataSetID, this.datasetmap.map);
			let results: InsightResult[];
			results = queryNode.evaluate(dataset);
			if (results.length > 5000) {
				return Promise.reject(new ResultTooLargeError("More than 5000 results found"));
			}
			return Promise.resolve(results);
		} catch (error) {
			return Promise.reject(new InsightError("Dataset not found"));
		}
	}

	// CIATION: had to change to use get instead of fetch: used chatGPT and piazza for help
	private async getGeolocations(buildingLinks: any[]): Promise<void> {
		const requests = buildingLinks.map((link) => this.handleGeolocationRequest(link));
		await Promise.all(requests);
	}

	private handleGeolocationRequest(link: any): Promise<void> {
		return new Promise<void>((resolve) => {
			if (!this.geoCache[link.address]) {
				const encodedAddress = encodeURIComponent(link.address);
				const url = `http://cs310.students.cs.ubc.ca:11316/api/v1/project_team127/${encodedAddress}`;

				http.get(url, (res) => {
					let data = "";

					res.on("data", (chunk) => {
						data += chunk;
					});

					res.on("end", () => {
						try {
							this.geoCache[link.address] = JSON.parse(data);
						} catch (error) {
							this.geoCache[link.address] = null; // cache the failure, so we don’t retry
						}
						resolve();
					});
				}).on("error", (err) => {
					resolve();
				});
			} else {
				resolve();
			}
		});
	}
}
