import {
	IInsightFacade,
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

use(chaiAsPromised);

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let resetions: string;

	before(function () {
		// This block runs once and loads the datasets.
		sections = getContentFromArchives("pair.zip");
		resetions = getContentFromArchives("pair_lite.zip");
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

		// This is a unit test. You should create more like this!
		it("add should reject with  an empty dataset id", function () {
			const result = facade.addDataset("", resetions, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
	});
	it("add should reject with whitespace id", function () {
		const result = facade.addDataset(" ", resetions, InsightDatasetKind.Sections);
		return expect(result).to.eventually.be.rejectedWith(InsightError);
	});

	it("add should reject with an id with underscore", function () {
		const result = facade.addDataset("_aa", resetions, InsightDatasetKind.Sections);
		return expect(result).to.eventually.be.rejectedWith(InsightError);
	});

	// new//
	it("Should add a data set with a valid data set ID", function () {
		const result = facade.addDataset("aspa", resetions, InsightDatasetKind.Sections);
		return expect(result).to.eventually.have.members(["aspa"]);
	});

	it("add should reject with a duplicated dataset id", function () {
		facade.addDataset("hi", resetions, InsightDatasetKind.Sections);
		const result = facade.addDataset("hi", resetions, InsightDatasetKind.Sections);
		return expect(result).to.eventually.be.rejectedWith(InsightError);
	});

	// new//
	it("add should reject a dataset with an invalid kind", function () {
		const result = facade.addDataset("validID", resetions, "invalid kind" as any);
		return expect(result).to.eventually.be.rejectedWith(InsightError);
	});

	// new//
	it("add should reject a dataset with invalid zip file content", function () {
		const zipInvalid = "invalidBase64Zip";
		const result = facade.addDataset("validID", zipInvalid, InsightDatasetKind.Sections);
		return expect(result).to.eventually.be.rejectedWith(InsightError);
	});

	it("remove should reject with a non-existing dataset id", function () {
		const result = facade.removeDataset("hi");
		return expect(result).to.eventually.be.rejectedWith(NotFoundError);
	});

	it("remove should reject with an id with underscore", function () {
		const result = facade.removeDataset("_");
		return expect(result).to.eventually.be.rejectedWith(InsightError);
	});

	it("remove should reject with an whitespace id", function () {
		const result = facade.removeDataset(" ");
		return expect(result).to.eventually.be.rejectedWith(InsightError);
	});

	it("remove should reject with an empty id", function () {
		const result = facade.removeDataset("");
		return expect(result).to.eventually.be.rejectedWith(InsightError);
	});

	it("remove should fulfill with a valid id", function () {
		facade.addDataset("hi", sections, InsightDatasetKind.Sections);
		const result = facade.removeDataset("hi");
		return expect(result).to.eventually.be.fulfilled;
	});

	it("should reject with a double removal", function () {
		facade.addDataset("hi", sections, InsightDatasetKind.Sections);
		facade.removeDataset("hi");
		const result = facade.removeDataset("hi");
		return expect(result).to.eventually.be.rejectedWith(NotFoundError);
	});

	it("should fulfill a listDatasets", function () {
		const result = facade.listDatasets();
		return expect(result).to.eventually.be.fulfilled;
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
			const loadDatasetPromises = [facade.addDataset("sections", sections, InsightDatasetKind.Sections)];

			return Promise.all(loadDatasetPromises);
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
				assertOnResult: (actual, expected) => {
					// TODO add an assertion!
				},
				errorValidator: (error): error is PQErrorKind =>
					error === "ResultTooLargeError" || error === "InsightError",
				assertOnError: (actual, expected) => {
					// TODO add an assertion!
				},
			}
		);
	});
});
