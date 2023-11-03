import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import {folderTest} from "@ubccpsc310/folder-test";
import {expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
import {clearDisk, getContentFromArchives} from "../TestUtil";
import * as fs from "fs-extra";

use(chaiAsPromised);

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let courses: string;
	let nodit: string;
	let rooms: string;
	let noIRooms: string;
	let noTable: string;
	let invalidLink: string;
	let bldNoTable: string;
	let lackingField: string;
	let invalidGeo: string;

	before(function () {
		// This block runs once and loads the datasets.
		sections = getContentFromArchives("pair.zip");
		courses = getContentFromArchives("smallCourses.zip");
		nodit = getContentFromArchives("noCourseDirectory.zip");
		rooms = getContentFromArchives("campus.zip");
		noIRooms = getContentFromArchives("noIndex.zip");
		noTable = getContentFromArchives("noTable.zip");
		invalidLink = getContentFromArchives("invalidLink.zip");
		bldNoTable = getContentFromArchives("bldNoTable.zip");
		lackingField = getContentFromArchives("lackingField.zip");
		invalidGeo = getContentFromArchives("invalidGeo.zip");
		// Just in case there is anything hanging around from a previous run of the test suite
		clearDisk();
	});

	describe("Add/Remove/List Dataset", function () {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);
		});

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			console.info(`BeforeTest: ${this.currentTest?.title}`);
			facade = new InsightFacade();
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
		});

		afterEach(function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			console.info(`AfterTest: ${this.currentTest?.title}`);
			clearDisk();
		});

		it("should not retrieve a removed dataset after 'crash'", async function () {
			await facade.addDataset("sections", courses, InsightDatasetKind.Sections);
			await facade.removeDataset("sections");

			// Simulate a crash by creating a new instance
			const newInstance = new InsightFacade();
			const datasets = await newInstance.listDatasets();
			expect(datasets).to.be.empty;
		});

		// it("should retrieve multiple datasets after 'crash'", async function () {
		// 	const facade = new InsightFacade();
		//
		// 	await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
		// 	await facade.addDataset("courses", courses, InsightDatasetKind.Sections);
		//
		// 	// Simulate a crash by creating a new instance
		// 	const newInstance = new InsightFacade();
		// 	const datasets = await newInstance.listDatasets();
		//
		// 	expect(datasets).to.have.length(2);
		// 	expect(datasets.map((d) => d.id)).to.include.members(["sections", "courses"]);
		// });
		it("c2 should add rooms dataset", async function () {
			const result = await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
			expect(result).to.have.deep.members(["rooms"]);
		});
		it("should create a file on disk after adding a dataset", async function () {
			await facade.addDataset("sections", courses, InsightDatasetKind.Sections);

			// Use the correct path where the dataset is saved
			const fileExists = await fs.pathExists("./data/sections");
			expect(fileExists).to.be.true;
		});
		// it("should delete the file on disk after removing a dataset", async function () {
		// 	const facade = new InsightFacade();
		// 	await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
		// 	await facade.removeDataset("sections");
		//
		// 	const fileExists = await fs.pathExists("./data/sections");
		// 	expect(fileExists).to.be.false;
		// });

		// This is a unit test. You should create more like this!
		it("should reject with  an empty dataset id", function () {
			const result = facade.addDataset("", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with a whitespace dataset ID", function () {
			const result = facade.addDataset(" ", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject an ID with an underscore", function () {
			const result = facade.addDataset("invalid_id", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject adding a dataset with an empty content argument", function () {
			const invalidContent = "";
			const result = facade.addDataset("sections", invalidContent, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("C2 should reject adding a dataset when the zip file input doesn't contain any valid room", function () {
			const result = facade.addDataset("sections", courses, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("C2 should reject adding a dataset without index.htm file", function () {
			const result = facade.addDataset("sections", noIRooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("C2 should reject adding a dataset with an index.htm that doesn't contain any tables", function () {
			const result = facade.addDataset("sections", noTable, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("C2 should reject adding a dataset with link to a building file that doesn't exist ", function () {
			const result = facade.addDataset("sections", invalidLink, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("C2 should reject adding a dataset with a building file that contains no room table ", function () {
			const result = facade.addDataset("sections", bldNoTable, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("C2 should reject adding a dataset with a bd file with rm table doesn't contain every field ", function () {
			const result = facade.addDataset("sections", lackingField, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("C2 should reject adding a dataset with room of invalid geolocation result", function () {
			const result = facade.addDataset("sections", invalidGeo, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("C2 should accept a valid adding request", async function () {
			const result = await facade.addDataset("sections", rooms, InsightDatasetKind.Rooms);
			console.log(result);
			return expect(result).to.have.deep.members(["sections"]);
		});

		it("should reject a duplicated ID", async function () {
			await facade.addDataset("abcd", courses, InsightDatasetKind.Sections);
			const result = facade.addDataset("abcd", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("add should write to disk", async function () {
			await facade.addDataset("abcd", courses, InsightDatasetKind.Sections);
			const result = fs.existsSync("./data/abcd");
			return expect(result).to.be.true;
		});

		it("should accept a valid ID and return the array of ID's with the valid ID contained", async function () {
			const result = await facade.addDataset("sections", courses, InsightDatasetKind.Sections);
			console.log(result);
			return expect(result).to.have.deep.members(["sections"]);
		});

		it("should add multi datasets with valid IDs that are diff and return the array with ids", async function () {
			await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
			await facade.addDataset("id1", courses, InsightDatasetKind.Sections);
			await facade.addDataset("id2", courses, InsightDatasetKind.Sections);
			const result = await facade.addDataset("courses", courses, InsightDatasetKind.Sections);
			return expect(result).to.have.deep.members(["sections", "id1", "id2", "courses"]);
		});

		// TESTS FOR REMOVE
		it("should remove a dataset that has been added and is valid", async function () {
			await facade.addDataset("sections", courses, InsightDatasetKind.Sections);
			const result = facade.removeDataset("sections");
			return expect(result).to.eventually.equal("sections");
		});
		it("should throw an Insight error if the dataset to be removed does not exist", function () {
			const result = facade.removeDataset("sections");
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});
		it("should reject removing a dataset with an empty dataset id", function () {
			const result = facade.removeDataset("");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		it("should reject removing a dataset with a whitespace dataset ID", function () {
			const result = facade.removeDataset(" ");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		it("should reject removing a dataset with an ID with an underscore", function () {
			const result = facade.removeDataset("invalid_id");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		// LIST DATASET methods
		it("should list one dataset if added correctly", async function () {
			await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
			const expected: InsightDataset[] = [
				{
					id: "sections",
					kind: InsightDatasetKind.Sections,
					numRows: 64612,
				},
			];
			const result = facade.listDatasets();
			return expect(result).to.eventually.have.deep.members(expected);
		});
		it("should list an empty array if there are no datasets added", function () {
			const result = facade.listDatasets();
			return expect(result).to.eventually.have.deep.members([]);
		});
	});

	/*
	 * This test suite dynamically generates tests from the JSON files in test/resources/queries.
	 * You should not need to modify it; instead, add additional files to the queries directory.
	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
	 */
	describe("PerformQuery", () => {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);

			facade = new InsightFacade();

			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [
				facade.addDataset("sections", sections, InsightDatasetKind.Sections),
				facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms),
			];

			return Promise.all(loadDatasetPromises); // review
			// const loadDataset = facade.addDataset("sections", sections, InsightDatasetKind.Sections);
			// return Promise.resolve(loadDataset);
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			clearDisk();
		});

		type PQErrorKind = "ResultTooLargeError" | "InsightError";

		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
			"Dynamic InsightFacade PerformQuery tests",
			(input) => facade.performQuery(input),
			"./test/resources/queries",
			{
				assertOnResult: async (actual, expected) => {
					// TODO add an assertion!
					expect(actual).to.have.deep.members(await expected); // deep equal: cares about order
				},
				errorValidator: (error): error is PQErrorKind =>
					error === "ResultTooLargeError" || error === "InsightError",
				assertOnError: (actual, expected) => {
					if (expected === "ResultTooLargeError") {
						expect(actual).to.be.instanceof(ResultTooLargeError);
					} else if (expected === "InsightError") {
						expect(actual).to.be.instanceof(InsightError);
					} else {
						console.log("Error was thrown, but was not ResultTooLarge or InsightError");
					}
				},
			}
		);
	});
});
