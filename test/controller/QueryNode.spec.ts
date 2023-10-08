import {expect} from "chai";
import "chai-as-promised";
import {InsightError} from "../../src/controller/IInsightFacade";
import {QueryNode} from "../../src/controller/QueryNode";

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
	// it("should throw an InsightError for invalid MCOMPARISON", function () {
	// 	const query = {
	// 		WHERE: {
	// 			GT: {
	// 				sections_avg: "invalid"
	// 			}
	// 		},
	// 		OPTIONS: {
	// 			COLUMNS: ["sections_dept", "sections_avg"]
	// 		}
	// 	};
	// 	expect(() => new QueryNode(query, "sections")).to.throw(InsightError);
	// });
	// it("should throw an InsightError for invalid filter in WHERE clause", function () {
	// 	const query = {
	// 		WHERE: {
	// 			GT: {
	// 				invalid_field: 90
	// 			}
	// 		},
	// 		OPTIONS: {
	// 			COLUMNS: ["sections_dept", "sections_avg"]
	// 		}
	// 	};
	// 	const queryNode = new QueryNode(query, "sections");
	// 	expect(() => queryNode.validate()).to.throw(InsightError);
	// });

	// it("should throw an InsightError for invalid SCOMPARISON", function () {
	// 	const query = {
	// 		WHERE: {
	// 			IS: {
	// 				sections_dept: 123
	// 			}
	// 		},
	// 		OPTIONS: {
	// 			COLUMNS: ["sections_dept", "sections_avg"]
	// 		}
	// 	};
	// 	expect(() => new QueryNode(query, "sections")).to.throw(InsightError);
	// });
});
