import {expect} from "chai";
import "chai-as-promised";
import {InsightDatasetKind, InsightError} from "../src/controller/IInsightFacade";
import {QueryNode} from "../src/controller/QueryNode";
import {DataSet, Section} from "../src/controller/DataSet";

describe("QueryNode unit tests and validation tests", function () {
	it("should throw an InsightError if there is NO WHERE CLAUSE", function () {
		const query = {
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: "sections_avg",
			},
		};
		expect(() => new QueryNode(query, "sections")).to.throw(InsightError);
	});

	it("should throw an InsightError if there is no OPTIONS clause", function () {
		const query = {
			WHERE: {
				GT: {
					sections_avg: 97,
				},
			},
		};
		expect(() => new QueryNode(query, "sections")).to.throw(InsightError);
	});

	it("should validate a correct query and return true", function () {
		const query = {
			WHERE: {
				GT: {
					sections_avg: 97,
				},
			},
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: "sections_avg",
			},
		};
		const result = new QueryNode(query, "sections");
		expect(result.validate()).to.be.true;
	});
	it("should throw an InsightError for an empty query", function () {
		const query = {};
		expect(() => new QueryNode(query, "sections")).to.throw(InsightError);
	});
	it("should NOT throw an error with both WHERE and OPTIONS clauses present", function () {
		const query = {
			WHERE: {
				GT: {
					sections_avg: 90,
				},
			},
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: "sections_avg",
			},
		};
		expect(() => new QueryNode(query, "sections")).to.not.throw();
	});
	it("should not throw an error for an empty WHERE clause", function () {
		const query = {
			WHERE: {},
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
			},
		};
		expect(() => new QueryNode(query, "sections")).to.not.throw();
	});
	it("should throw an InsightError for a non-object WHERE clause", function () {
		const query = {
			WHERE: "invalid",
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
			},
		};
		expect(() => new QueryNode(query, "sections")).to.throw(InsightError);
	});
	it("should not throw an error for nested logic comparisons", function () {
		const query = {
			WHERE: {
				OR: [
					{
						AND: [{GT: {sections_avg: 90}}, {IS: {sections_dept: "cpsc"}}],
					},
					{IS: {sections_dept: "math"}},
				],
			},
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
			},
		};
		expect(() => new QueryNode(query, "sections")).to.not.throw();
	});
	it("should not throw an error for multiple nested logic comparisons", function () {
		const query = {
			WHERE: {
				NOT: {
					OR: [
						{
							AND: [{GT: {sections_avg: 90}}, {IS: {sections_dept: "cpsc"}}],
						},
						{IS: {sections_dept: "math"}},
					],
				},
			},
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
			},
		};
		expect(() => new QueryNode(query, "sections")).to.not.throw();
	});
	it("should not throw an error for valid MCOMPARISON and SCOMPARISON", function () {
		const query = {
			WHERE: {
				AND: [{GT: {sections_avg: 90}}, {IS: {sections_dept: "cpsc"}}],
			},
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
			},
		};
		expect(() => new QueryNode(query, "sections")).to.not.throw();
	});
	it("should evaluate a basic query correctly", function () {
		const query = {
			WHERE: {
				GT: {
					sections_avg: 90
				}
			},
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: "sections_avg"
			}
		};
		const dataset: Section[] = [
			{
				uuid: "someUUID1", // You can fill this with an appropriate value
				id: "someID1", // You can fill this with an appropriate value
				title: "someTitle1", // You can fill this with an appropriate value
				instructor: "someInstructor1", // You can fill this with an appropriate value
				dept: "cpsc",
				year: 2021, // You can fill this with an appropriate value
				avg: 95,
				pass: 90, // You can fill this with an appropriate value
				fail: 5, // You can fill this with an appropriate value
				audit: 0 // You can fill this with an appropriate value
			},
			{
				uuid: "someUUID2", // You can fill this with an appropriate value
				id: "someID2", // You can fill this with an appropriate value
				title: "someTitle2", // You can fill this with an appropriate value
				instructor: "someInstructor2", // You can fill this with an appropriate value
				dept: "math",
				year: 2021, // You can fill this with an appropriate value
				avg: 85,
				pass: 80, // You can fill this with an appropriate value
				fail: 5, // You can fill this with an appropriate value
				audit: 0 // You can fill this with an appropriate value
			}
		];

		const datasetObject: DataSet = {
			id: "sections",
			section: dataset,
			kind: InsightDatasetKind.Sections,
			numRows: dataset.length
		};
		const expectedResults = [
			{
				sections_avg: 95,
				sections_dept: "cpsc"
			}
		];
		const queryNode = new QueryNode(query, "sections");
		const results = queryNode.evaluate(datasetObject);
		expect(results).to.deep.equal(expectedResults);
	});

});
