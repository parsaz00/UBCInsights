import {expect} from "chai";
import "chai-as-promised";
import {InsightDatasetKind, InsightError} from "../src/controller/IInsightFacade";
import {QueryNode} from "../src/controller/QueryNode";
import {DataSet, DatasetSection} from "../src/controller/DataSet";
import e from "express";

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
					sections_avg: 90,
				},
			},
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: "sections_avg",
			},
		};
		const dataset: DatasetSection[] = [
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
				audit: 0, // You can fill this with an appropriate value
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
				audit: 0, // You can fill this with an appropriate value
			},
		];

		const datasetObject: DataSet = {
			id: "sections",
			section: dataset,
			kind: InsightDatasetKind.Sections,
			numRows: dataset.length,
		};
		const expectedResults = [
			{
				sections_avg: 95,
				sections_dept: "cpsc",
			},
		];
		const queryNode = new QueryNode(query, "sections");
		const results = queryNode.evaluate(datasetObject);
		expect(results).to.deep.equal(expectedResults);
	});
});

describe("Test suite for C2 for QueryNode", function () {
	it("should validate a correct rooms query without transformations", function () {
		const query = {
			WHERE: {
				IS: {
					rooms_furniture: "Table",
				},
			},
			OPTIONS: {
				COLUMNS: ["rooms_shortname", "rooms_number", "rooms_furniture"],
			},
		};
		const result = new QueryNode(query, "rooms");
		expect(result.validate()).to.be.true;
	});
	it("should validate a correct rooms query with wildcards in the IS filter", function () {
		const query = {
			WHERE: {
				IS: {
					rooms_furniture: "*Table*",
				},
			},
			OPTIONS: {
				COLUMNS: ["rooms_shortname", "rooms_number", "rooms_furniture"],
			},
		};
		const result = new QueryNode(query, "rooms");
		expect(result.validate()).to.be.true;
	});
	it("should throw an InsightError for an invalid rooms query", function () {
		const query = {
			WHERE: {
				IS: {
					sections_dept: "cpsc",
				},
			},
			OPTIONS: {
				COLUMNS: ["rooms_shortname", "rooms_number"],
			},
		};
		const result = new QueryNode(query, "rooms");
		expect(result.validate()).to.be.false;
		// expect(() => new QueryNode(query, "rooms")).to.throw(InsightError);
	});

	it("Test for a valid query with GROUP and APPLY", function () {
		const query = {
			WHERE: {},
			OPTIONS: {
				COLUMNS: ["sections_dept", "avgGrade"],
				ORDER: "avgGrade",
			},
			TRANSFORMATIONS: {
				GROUP: ["sections_dept"],
				APPLY: [
					{
						avgGrade: {
							AVG: "sections_avg",
						},
					},
				],
			},
		};
		const result = new QueryNode(query, "sections");
		expect(result.validate()).to.be.true;
	});
	it("Test for an invalid query where the applykey in an APPLYRULE is not unique", function () {
		const query = {
			WHERE: {},
			OPTIONS: {
				COLUMNS: ["sections_dept", "avgGrade"],
			},
			TRANSFORMATIONS: {
				GROUP: ["sections_dept"],
				APPLY: [
					{
						avgGrade: {
							AVG: "sections_avg",
						},
					},
					{
						avgGrade: {
							MAX: "sections_avg",
						},
					},
				],
			},
		};
		const result = new QueryNode(query, "sections");
		const answer = result.validate();
		expect(answer).to.be.false;
	});
	it(
		"Test for an invalid query where the COLUMNS keys do not correspond to one of the GROUP keys or " +
			"to applykeys defined in the APPLY block",
		function () {
			const query = {
				WHERE: {},
				OPTIONS: {
					COLUMNS: ["sections_dept", "someRandomKey"],
				},
				TRANSFORMATIONS: {
					GROUP: ["sections_dept"],
					APPLY: [
						{
							avgGrade: {
								AVG: "sections_avg",
							},
						},
					],
				},
			};
			const result = new QueryNode(query, "sections");
			expect(result.validate()).to.be.false;
		}
	);
	it("Test for an invalid query where a non-numeric key is used with MAX, MIN, AVG, or SUM", function () {
		const query = {
			WHERE: {},
			OPTIONS: {
				COLUMNS: ["sections_dept", "maxName"],
			},
			TRANSFORMATIONS: {
				GROUP: ["sections_dept"],
				APPLY: [
					{
						maxName: {
							MAX: "sections_instructor",
						},
					},
				],
			},
		};
		const result = new QueryNode(query, "sections");
		expect(result.validate()).to.be.false;
	});
	it("Test for a valid query where COUNT is used on a non-numeric key", function () {
		const query = {
			WHERE: {},
			OPTIONS: {
				COLUMNS: ["sections_dept", "nameCount"],
			},
			TRANSFORMATIONS: {
				GROUP: ["sections_dept"],
				APPLY: [
					{
						nameCount: {
							COUNT: "sections_instructor",
						},
					},
				],
			},
		};
		const result = new QueryNode(query, "sections");
		expect(result.validate()).to.be.true;
	});
	it("Test for a valid query with a single column sort", function () {
		const query = {
			WHERE: {},
			OPTIONS: {
				COLUMNS: ["sections_avg"],
				ORDER: "sections_avg",
			},
		};
		const result = new QueryNode(query, "sections");
		expect(result.validate()).to.be.true;
	});

	it("Test for a valid query with multiple column sorts", function () {
		const query = {
			WHERE: {},
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: {
					dir: "UP",
					keys: ["sections_dept", "sections_avg"],
				},
			},
		};
		const result = new QueryNode(query, "sections");
		expect(result.validate()).to.be.true;
	});

	it("Test for an invalid query where the SORT keys are not in the COLUMNS", function () {
		const query = {
			WHERE: {},
			OPTIONS: {
				COLUMNS: ["sections_dept"],
				ORDER: "sections_avg",
			},
		};
		const result = new QueryNode(query, "sections");
		expect(result.validate()).to.be.false;
	});
	it("Test for a valid query that combines WHERE, GROUP, APPLY, and SORT", function () {
		const query = {
			WHERE: {
				GT: {
					sections_avg: 90,
				},
			},
			OPTIONS: {
				COLUMNS: ["sections_dept", "avgGrade"],
				ORDER: "avgGrade",
			},
			TRANSFORMATIONS: {
				GROUP: ["sections_dept"],
				APPLY: [
					{
						avgGrade: {
							AVG: "sections_avg",
						},
					},
				],
			},
		};
		const result = new QueryNode(query, "sections");
		expect(result.validate()).to.be.true;
	});

	it("Test for an invalid query that combines WHERE, GROUP, APPLY, and SORT in an incorrect manner", function () {
		const query = {
			WHERE: {
				GT: {
					sections_avg: 90,
				},
			},
			OPTIONS: {
				COLUMNS: ["sections_dept", "avgGrade", "someRandomKey"],
				ORDER: "someRandomKey",
			},
			TRANSFORMATIONS: {
				GROUP: ["sections_dept"],
				APPLY: [
					{
						avgGrade: {
							AVG: "sections_avg",
						},
					},
				],
			},
		};
		const result = new QueryNode(query, "sections");
		expect(result.validate()).to.be.false;
	});
	it("Test for a query with an empty TRANSFORMATIONS block", function () {
		const query = {
			WHERE: {},
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
			},
			TRANSFORMATIONS: {},
		};
		const result = new QueryNode(query, "sections");
		expect(result.validate()).to.be.false;
	});

	it("Test for a query with an empty GROUP", function () {
		const query = {
			WHERE: {},
			OPTIONS: {
				COLUMNS: ["sections_dept", "avgGrade"],
			},
			TRANSFORMATIONS: {
				GROUP: [],
				APPLY: [
					{
						avgGrade: {
							AVG: "sections_avg",
						},
					},
				],
			},
		};
		const result = new QueryNode(query, "sections");
		expect(result.validate()).to.be.false;
	});

	it("Test for a query with an empty APPLY", function () {
		const query = {
			WHERE: {},
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
			},
			TRANSFORMATIONS: {
				GROUP: ["sections_dept"],
				APPLY: [],
			},
		};
		const result = new QueryNode(query, "sections");
		expect(result.validate()).to.be.false;
	});

	it("Test for a query with a GROUP but no APPLY", function () {
		const query = {
			WHERE: {},
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
			},
			TRANSFORMATIONS: {
				GROUP: ["sections_dept"],
			},
		};
		const result = new QueryNode(query, "sections");
		expect(result.validate()).to.be.false;
	});

	it("Test for a query with an APPLY but no GROUP", function () {
		const query = {
			WHERE: {},
			OPTIONS: {
				COLUMNS: ["sections_dept", "avgGrade"],
			},
			TRANSFORMATIONS: {
				APPLY: [
					{
						avgGrade: {
							AVG: "sections_avg",
						},
					},
				],
			},
		};
		const result = new QueryNode(query, "sections");
		expect(result.validate()).to.be.false;
	});
});

describe("QueryNode Evaluation Tests", function () {
	it("should correctly evaluate a query with GROUP and APPLY", function () {
		// Given dataset
		const dataset: DatasetSection[] = [
			{
				uuid: "1",
				instructor: "Jean",
				avg: 90,
				title: "310",
				id: "1",
				dept: "cpsc",
				year: 2018,
				pass: 50,
				fail: 50,
				audit: 10,
			},
			{
				uuid: "2",
				instructor: "Jean",
				avg: 80,
				title: "310",
				id: "2",
				dept: "cpsc",
				year: 2018,
				pass: 50,
				fail: 50,
				audit: 10,
			},
			{
				uuid: "3",
				instructor: "Casey",
				avg: 95,
				title: "310",
				id: "3",
				dept: "cpsc",
				year: 2018,
				pass: 50,
				fail: 50,
				audit: 10,
			},
			{
				uuid: "4",
				instructor: "Casey",
				avg: 85,
				title: "310",
				id: "4",
				dept: "cpsc",
				year: 2018,
				pass: 50,
				fail: 50,
				audit: 10,
			},
			{
				uuid: "5",
				instructor: "Kelly",
				avg: 74,
				title: "210",
				id: "5",
				dept: "cpsc",
				year: 2018,
				pass: 50,
				fail: 50,
				audit: 10,
			},
			{
				uuid: "6",
				instructor: "Kelly",
				avg: 78,
				title: "210",
				id: "6",
				dept: "cpsc",
				year: 2018,
				pass: 50,
				fail: 50,
				audit: 10,
			},
			{
				uuid: "7",
				instructor: "Kelly",
				avg: 72,
				title: "210",
				id: "7",
				dept: "cpsc",
				year: 2018,
				pass: 50,
				fail: 50,
				audit: 10,
			},
			{
				uuid: "8",
				instructor: "Eli",
				avg: 85,
				title: "210",
				id: "8",
				dept: "cpsc",
				year: 2018,
				pass: 50,
				fail: 50,
				audit: 10,
			},
		];

		const datasetObject: DataSet = {
			id: "sections",
			section: dataset,
			kind: InsightDatasetKind.Sections,
			numRows: dataset.length,
		};

		// Given query
		const query = {
			WHERE: {},
			OPTIONS: {
				COLUMNS: ["sections_title", "overallAvg"],
			},
			TRANSFORMATIONS: {
				GROUP: ["sections_title"],
				APPLY: [
					{
						overallAvg: {
							AVG: "sections_avg",
						},
					},
				],
			},
		};

		// Expected result
		const expectedResults = [
			{sections_title: "310", overallAvg: 87.5},
			{sections_title: "210", overallAvg: 77.25},
		];

		// Evaluate
		const queryNode = new QueryNode(query, "sections");
		const results = queryNode.evaluate(datasetObject);

		// Assert
		expect(results).to.deep.equal(expectedResults);
	});
});
