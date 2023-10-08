import {expect} from "chai";
import "chai-as-promised";
import {InsightError} from "../../src/controller/IInsightFacade";
import {QueryNode} from "../../src/controller/QueryNode";
import {WhereNode} from "../../src/controller/WhereNode";
import e from "express";
import exp from "constants";

describe("test suit for WhereNode class", function () {
	// double check this
	it("should validate and return true for an empty where clause", function () {
		const where = {};
		const whereNode = new WhereNode(where, "courses");
		expect(whereNode.validate()).to.be.true;
	});

	it("should reject a where clause that is NOT an object", function () {
		const where = "invalid";
		expect(() => new WhereNode(where, "courses")).to.throw(InsightError);
	});

	it("should reject a where clause that is NOT an object, specifically NULL", function () {
		expect(() => new WhereNode(null, "courses")).to.throw(InsightError);
	});
	describe("nested WhereNode tests for MComparators that are valid and validate function", function () {
		it("should validate a correct GT comparison", function () {
			const where = {GT: {courses_avg: 90}};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.true;
		});
		it("should validate a correct LT comparison", function () {
			const where = {LT: {courses_avg: 54}};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.true;
		});
		it("should validate a correct EQ comparison", function () {
			const where = {EQ: {courses_avg: 85}};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.true;
		});
	});
	describe("nested WhereNode tests for MComparators that are INVALID and validate function",
		function () {
			it("should reject a GT comparison that isn't a numeric value", function () {
				const where = {GT: {courses_avg: "string"}};
				const whereNode = new WhereNode(where, "courses");
				expect(whereNode.validate()).to.be.false;
			});
			it("should reject a LT comparison that isn't a numeric value", function () {
				const where = {LT: {courses_avg: "string"}};
				const whereNode = new WhereNode(where, "courses");
				expect(whereNode.validate()).to.be.false;
			});
			it("should reject a EQ comparison that isn't a numeric value", function () {
				const where = {EQ: {courses_avg: "string"}};
				const whereNode = new WhereNode(where, "courses");
				expect(whereNode.validate()).to.be.false;
			});
			it("should reject a GT comparison with a missing key", function () {
				const where = {GT: {}};
				const whereNode = new WhereNode(where, "courses");
				expect(whereNode.validate()).to.be.false;
			});
			it("should reject a LT comparison with a missing key", function () {
				const where = {LT: {}};
				const whereNode = new WhereNode(where, "courses");
				expect(whereNode.validate()).to.be.false;
			});
			it("should reject a EQ comparison with a missing key", function () {
				const where = {EQ: {}};
				const whereNode = new WhereNode(where, "courses");
				expect(whereNode.validate()).to.be.false;
			});
			it("should reject an MComparator with an INVALID MComparator", function () {
				const where = {INVALID_MCOMPARATOR: {courses_avg: 97}};
				const whereNode = new WhereNode(where, "courses");
				expect(whereNode.validate()).to.be.false;
			});
			it("should reject an MComparator with an INVALID key", function () {
				const where = {
					EQ: {
						invalid_key: 97,
					},
				};
				const whereNode = new WhereNode(where, "courses");
				expect(whereNode.validate()).to.be.false;
			});
		});
	describe("nested WhereNode tests for LComparators and validate function", function () {
		it("should return true for the validate function for a valid AND comparator", function () {
			const where = {
				AND: [{GT: {courses_avg: 90}}, {LT: {courses_avg: 95}}],
			};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.true;
		});
		it("should return true for the validate function for a valid OR comparator", function () {
			const where = {
				OR: [{GT: {courses_avg: 95}}, {LT: {courses_avg: 62}}],
			};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.true;
		});
		it("should return true for the validate function for nested OR and AND comparator", function () {
			const where = {
				AND: [
					{GT: {courses_avg: 92}},
					{
						OR: [{EQ: {courses_avg: 85}}, {LT: {courses_avg: 71}}],
					},
				],
			};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.true;
		});
		it("should reject an AND comparator and return false for an AND comparator with non-array value", function () {
			const where = {AND: {courses_avg: 90}};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.false;
		});
		it("should reject an OR comparator and return false for an OR comparator with non-array value", function () {
			const where = {OR: {courses_avg: 90}};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.false;
		});
		it("should reject an AND comparator and return false when the AND array is empty", function () {
			const where = {
				AND: [],
			};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.false;
		});
		it("should reject an OR comparator and return false when the OR array is empty", function () {
			const where = {
				OR: [],
			};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.false;
		});
		it("should reject an INVALID logic comparator and return false", function () {
			const where = {
				INVALID_LCOMPARATOR: [{courses_avg: 90}, {courses_avg: 84}],
			};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.false;
		});
	});
	describe("tests to validate for IS comparators, testing the WhereNode validate function", function () {
		it("should accept and return true for a valid IS comparison with a string", function () {
			const where = {IS: {courses_dept: "cpsc"}};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.true;
		});
		it("should accept and return true for a valid wildcard AT START comparison", function () {
			const where = {IS: {courses_instructor: "*smith"}};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.true;
		});
		it("should accept and return true for a valid wildcard AT END comparison", function () {
			const where = {IS: {courses_title: "intro*"}};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.true;
		});
		it("should accept and return true for a valid wildcard AT START and END comparison", function () {
			const where = {IS: {courses_title: "*intro*"}};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.true;
		});
	});
	describe("tests to check for invalid IS comparisons", function () {
		it("should reject and return false for a IS comparison that is not a string", function () {
			const where = {IS: {courses_avg: 90}};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.false;
		});
		it("should reject and return false for a IS comparison that has invalid wildcard form", function () {
			const where = {IS: {courses_title: "*ma*t*h*"}};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.false;
		});
		it("should reject and return false for a IS comparison with an invalid key", function () {
			const where = {IS: {invalid_key: "cpsc"}};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.false;
		});
	});
	describe("WhereNode validate functions for Negation", function () {
		it("should validate and return true for a NOT comparison with GT that is valid", function () {
			const where = {
				NOT: {
					GT: {courses_avg: 60},
				},
			};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.true;
		});
		it("should validate and return true for a NOT comparsion with IS that is valid", function () {
			const where = {
				NOT: {
					IS: {courses_dept: "cpsc"},
				},
			};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.true;
		});
		it("should validate and return true for a NOT nested in a NOT", function () {
			const where = {
				NOT: {
					NOT: {
						IS: {courses_dept: "cpsc"},
					},
				},
			};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.true;
		});
		it("should reject and return false for a NOT with an non object", function () {
			const where = {NOT: "invalid_object"};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.false;
		});
		it("should reject and return false for a NOT with an empty object", function () {
			const where = {NOT: {}};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.false;
		});
		it("should reject a NOT with MULTIPLE FILTERS", function () {
			const where = {
				NOT: {
					GT: {
						courses_avg: 90,
					},
					IS: {
						courses_dept: "cpsc",
					},
				},
			};
			const whereNode = new WhereNode(where, "courses");
			expect(whereNode.validate()).to.be.false;
		});
	});
});

// Will separate the test suite for evaluate as it will get increasingly long and complicated
describe("Test suite for WhereNode class evaluate method", function () {
	it("Should return all entries in the dataset if there is an empty WHERE clause", function () {
		let mockDataSet = [
			{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
			{courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
			{courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
		];
		const where = {};
		const whereNode = new WhereNode(where, "courses");
		const result = whereNode.evaluate(mockDataSet);
		expect(result).to.have.lengthOf(mockDataSet.length);
	});
	it("Should filter and only return courses with an average greater than 90", function () {
		let mockDataSet = [
			{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
			{courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
			{courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
		];
		const where = {
			GT: {courses_avg: 90},
		};
		const whereNode = new WhereNode(where, "courses");
		const result = whereNode.evaluate(mockDataSet);
		expect(result).to.have.lengthOf(1);
		// expect(result).to.have.members([{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"}]);
	});
	it("Should filter and only return courses with an average less than 90", function () {
		let mockDataSet = [
			{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
			{courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
			{courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
		];
		const where = {
			LT: {
				courses_avg: 90,
			},
		};
		const whereNode = new WhereNode(where, "courses");
		const result = whereNode.evaluate(mockDataSet);
		expect(result).to.have.lengthOf(2);
	});
	it("should filter and not return any results if the filter criteria matches none of the items", function () {
		let mockDataSet = [
			{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
			{courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
			{courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
		];
		const where = {
			GT: {
				courses_avg: 99,
			},
		};
		const whereNode = new WhereNode(where, "courses");
		const result = whereNode.evaluate(mockDataSet);
		expect(result).to.have.lengthOf(0);
	});
	it("should filter and only return the course that has avg EQ to 95", function () {
		let mockDataSet = [
			{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
			{courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
			{courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
		];
		const where = {
			EQ: {
				courses_avg: 95,
			},
		};
		const whereNode = new WhereNode(where, "courses");
		const result = whereNode.evaluate(mockDataSet);
		expect(result).to.have.lengthOf(1);
	});
	it("should filter and only return courses in CPSC department", function () {
		let mockDataSet = [
			{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
			{courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
			{courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
		];
		const where = {
			IS: {
				courses_dept: "cpsc",
			},
		};
		const whereNode = new WhereNode(where, "courses");
		const result = whereNode.evaluate(mockDataSet);
		expect(result).to.have.lengthOf(1);
	});
	it("should filter and only return course with instructor smith based on wildcard at start", function () {
		let mockDataSet = [
			{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
			{courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
			{courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
		];
		const where = {
			IS: {
				courses_instructor: "*smith",
			},
		};
		const whereNode = new WhereNode(where, "courses");
		const result = whereNode.evaluate(mockDataSet);
		expect(result).to.have.lengthOf(1);
	});
	it("should filter and return the math course based on *s wildcard, as the instructors name ends with s"
		, function () {
			let mockDataSet = [
				{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
				{courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
				{courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
			];
			const where = {
				IS: {
					courses_instructor: "*s",
				},
			};
			const whereNode = new WhereNode(where, "courses");
			const result = whereNode.evaluate(mockDataSet);
			expect(result).to.have.lengthOf(1);
		});
	it(
		"should filter and return the math and cpsc course based on *s* wildcard, " +
			"as the instructors names contain an s",
		function () {
			let mockDataSet = [
				{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
				{courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
				{courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
			];
			const where = {
				IS: {
					courses_instructor: "*s*",
				},
			};
			const whereNode = new WhereNode(where, "courses");
			const result = whereNode.evaluate(mockDataSet);
			expect(result).to.have.lengthOf(2);
		}
	);
	// Logic Comparisons
	it("should filter and return only the CPSC course as it is in the cpsc dept AND have avg above 86", function () {
		let mockDataSet = [
			{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
			{courses_avg: 87, courses_dept: "cpsc", courses_instructor: "bob"},
			{courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
			{courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
		];
		const where = {
			AND: [{GT: {courses_avg: 86}}, {IS: {courses_dept: "cpsc"}}],
		};
		const whereNode = new WhereNode(where, "courses");
		const result = whereNode.evaluate(mockDataSet);
		expect(result).to.lengthOf(2);
	});
	it("should filter and return only the CPSC course as it is in the cpsc dept AND have avg above 80", function () {
		let mockDataSet = [
			{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
			{courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
			{courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
		];
		const where = {
			AND: [{GT: {courses_avg: 80}}, {IS: {courses_dept: "cpsc"}}],
		};
		const whereNode = new WhereNode(where, "courses");
		const result = whereNode.evaluate(mockDataSet);
		expect(result).to.lengthOf(1);
	});
	it("should filter and return only the math and cpwc course as it is in the cpsc dept or have avg above 84"
		, function () {
			let mockDataSet = [
				{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
				{courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
				{courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
			];
			const where = {
				OR: [{GT: {courses_avg: 84}}, {IS: {courses_dept: "math"}}],
			};
			const whereNode = new WhereNode(where, "courses");
			const result = whereNode.evaluate(mockDataSet);
			expect(result).to.lengthOf(2);
		});
	it("should filter and return the math and bio course based on NOT comparison", function () {
		let mockDataSet = [
			{courses_uuid: "102123", courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
			{courses_uuid: "102124", courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
			{courses_uuid: "102125", courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
		];
		const where = {
			NOT: {
				GT: {courses_avg: 86},
			},
		};
		const whereNode = new WhereNode(where, "courses");
		const result = whereNode.evaluate(mockDataSet);
		expect(result).to.have.lengthOf(2);
	});
	it("should filter and return none of the options due to NOT filter", function () {
		let mockDataSet = [
			{courses_uuid: "102123", courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
			{courses_uuid: "102124", courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
			{courses_uuid: "102125", courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
		];
		const where = {
			NOT: {
				GT: {courses_avg: 70},
			},
		};
		const whereNode = new WhereNode(where, "courses");
		const result = whereNode.evaluate(mockDataSet);
		expect(result).to.have.lengthOf(0); // none of the options should be returned
	});
	it("should filter and return all of mockdataset - 1 for IS wildcard", function () {
		let mockDataset = [
			{
				sections_dept: "apbi",
				sections_id: "351",
				sections_avg: 52.08,
			},
			{
				sections_dept: "apbi",
				sections_id: "351",
				sections_avg: 52.08,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 57.68,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 57.81,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 59.23,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 59.31,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 60.52,
			},
			{
				sections_dept: "apbi",
				sections_id: "351",
				sections_avg: 61.69,
			},
			{
				sections_dept: "apbi",
				sections_id: "351",
				sections_avg: 61.69,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 62.37,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 62.53,
			},
			{
				sections_dept: "apbi",
				sections_id: "328",
				sections_avg: 62.54,
			},
			{
				sections_dept: "apbi",
				sections_id: "328",
				sections_avg: 62.54,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 62.69,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 63.17,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 63.18,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 63.33,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 63.48,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 63.61,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 63.96,
			},
			{
				sections_dept: "apbi",
				sections_id: "324",
				sections_avg: 64,
			},
			{
				sections_dept: "apbi",
				sections_id: "444",
				sections_avg: 64.13,
			},
			{
				sections_dept: "apbi",
				sections_id: "444",
				sections_avg: 64.13,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 64.14,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 64.16,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 64.32,
			},
			{
				sections_dept: "apbi",
				sections_id: "351",
				sections_avg: 64.36,
			},
			{
				sections_dept: "apbi",
				sections_id: "351",
				sections_avg: 64.36,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 64.38,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 64.41,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 64.48,
			},
			{
				sections_dept: "apbi",
				sections_id: "351",
				sections_avg: 64.53,
			},
			{
				sections_dept: "apbi",
				sections_id: "351",
				sections_avg: 64.53,
			},
			{
				sections_dept: "apbi",
				sections_id: "210",
				sections_avg: 64.56,
			},
			{
				sections_dept: "apbi",
				sections_id: "210",
				sections_avg: 64.56,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 64.6,
			},
			{
				sections_dept: "apbi",
				sections_id: "426",
				sections_avg: 64.6,
			},
			{
				sections_dept: "apbi",
				sections_id: "426",
				sections_avg: 64.6,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 64.73,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 64.76,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 64.76,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 64.78,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 64.83,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 65.05,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 65.06,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 65.07,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 65.11,
			},
			{
				sections_dept: "apbi",
				sections_id: "418",
				sections_avg: 65.17,
			},
			{
				sections_dept: "apbi",
				sections_id: "418",
				sections_avg: 65.17,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 65.17,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 65.26,
			},
			{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 65.29,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 65.32,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 65.51,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 65.57,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 65.59,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 65.73,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 65.77,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 65.79,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 65.8,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 65.84,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 65.88,
			},
			{
				sections_dept: "apbi",
				sections_id: "244",
				sections_avg: 65.89,
			},
			{
				sections_dept: "apbi",
				sections_id: "244",
				sections_avg: 65.89,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 65.93,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 65.97,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 66.08,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 66.17,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 66.2,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 66.21,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 66.28,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 66.45,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 66.45,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 66.53,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 66.54,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 66.57,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 66.57,
			},
			{
				sections_dept: "apbi",
				sections_id: "460",
				sections_avg: 66.64,
			},
			{
				sections_dept: "apbi",
				sections_id: "460",
				sections_avg: 66.64,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 66.79,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 66.79,
			},
			{
				sections_dept: "apbi",
				sections_id: "419",
				sections_avg: 66.83,
			},
			{
				sections_dept: "apbi",
				sections_id: "419",
				sections_avg: 66.83,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 66.85,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 66.86,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 66.96,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 66.96,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 66.96,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 66.96,
			},
			{
				sections_dept: "apbi",
				sections_id: "351",
				sections_avg: 67,
			},
			{
				sections_dept: "apbi",
				sections_id: "351",
				sections_avg: 67,
			},
			{
				sections_dept: "apbi",
				sections_id: "351",
				sections_avg: 67,
			},
			{
				sections_dept: "apbi",
				sections_id: "351",
				sections_avg: 67,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 67.13,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 67.14,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 67.16,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 67.22,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 67.23,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 67.23,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 67.24,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 67.25,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 67.25,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 67.26,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 67.27,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 67.42,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 67.42,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 67.45,
			},
			{
				sections_dept: "apbi",
				sections_id: "244",
				sections_avg: 67.48,
			},
			{
				sections_dept: "apbi",
				sections_id: "244",
				sections_avg: 67.48,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 67.52,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 67.56,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 67.66,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 67.68,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 67.69,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 67.82,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 67.85,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 67.85,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 67.88,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 67.92,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 68.02,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 68.03,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 68.05,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 68.16,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 68.19,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 68.28,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 68.3,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 68.32,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 68.35,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 68.39,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 68.41,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 68.41,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 68.46,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 68.49,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 68.53,
			},
			{
				sections_dept: "apbi",
				sections_id: "495",
				sections_avg: 68.53,
			},
			{
				sections_dept: "apbi",
				sections_id: "495",
				sections_avg: 68.53,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 68.55,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 68.55,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 68.56,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 68.6,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 68.6,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 68.6,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 68.62,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 68.62,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 68.64,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 68.76,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 68.77,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 68.82,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 68.86,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 68.89,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 68.9,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 68.92,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 69.1,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 69.15,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 69.25,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 69.25,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 69.33,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 69.35,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 69.36,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 69.36,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 69.38,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 69.5,
			},
			{
				sections_dept: "apbi",
				sections_id: "328",
				sections_avg: 69.58,
			},
			{
				sections_dept: "apbi",
				sections_id: "328",
				sections_avg: 69.58,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 69.58,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 69.59,
			},
			{
				sections_dept: "apbi",
				sections_id: "244",
				sections_avg: 69.63,
			},
			{
				sections_dept: "apbi",
				sections_id: "244",
				sections_avg: 69.63,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 69.65,
			},
			{
				sections_dept: "apbi",
				sections_id: "498",
				sections_avg: 69.67,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 69.71,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 69.71,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 69.72,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 69.75,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 69.76,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 69.8,
			},
			{
				sections_dept: "apbi",
				sections_id: "361",
				sections_avg: 69.82,
			},
			{
				sections_dept: "apbi",
				sections_id: "361",
				sections_avg: 69.82,
			},
			{
				sections_dept: "apbi",
				sections_id: "244",
				sections_avg: 69.84,
			},
			{
				sections_dept: "apbi",
				sections_id: "244",
				sections_avg: 69.84,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 69.84,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 69.91,
			},
			{
				sections_dept: "apbi",
				sections_id: "444",
				sections_avg: 70,
			},
			{
				sections_dept: "apbi",
				sections_id: "444",
				sections_avg: 70,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 70,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 70,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 70.04,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 70.06,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 70.07,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 70.13,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 70.15,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 70.15,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 70.17,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 70.23,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 70.29,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 70.38,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 70.39,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 70.52,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 70.56,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 70.6,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 70.62,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 70.65,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 70.72,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 70.76,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 70.78,
			},
			{
				sections_dept: "apbi",
				sections_id: "460",
				sections_avg: 70.81,
			},
			{
				sections_dept: "apbi",
				sections_id: "460",
				sections_avg: 70.81,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 70.84,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 70.86,
			},
			{
				sections_dept: "apbi",
				sections_id: "460",
				sections_avg: 70.9,
			},
			{
				sections_dept: "apbi",
				sections_id: "460",
				sections_avg: 70.9,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 70.9,
			},
			{
				sections_dept: "apbi",
				sections_id: "460",
				sections_avg: 70.94,
			},
			{
				sections_dept: "apbi",
				sections_id: "460",
				sections_avg: 70.94,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 71,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 71,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 71.05,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 71.09,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 71.13,
			},
			{
				sections_dept: "apbi",
				sections_id: "210",
				sections_avg: 71.17,
			},
			{
				sections_dept: "apbi",
				sections_id: "210",
				sections_avg: 71.17,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 71.18,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 71.24,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 71.35,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 71.36,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 71.37,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 71.37,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 71.44,
			},
			{
				sections_dept: "apbi",
				sections_id: "419",
				sections_avg: 71.5,
			},
			{
				sections_dept: "apbi",
				sections_id: "419",
				sections_avg: 71.5,
			},
			{
				sections_dept: "apsc",
				sections_id: "182",
				sections_avg: 71.57,
			},
			{
				sections_dept: "apsc",
				sections_id: "182",
				sections_avg: 71.57,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 71.59,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 71.62,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 71.66,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 71.66,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 71.68,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 71.69,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 71.72,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 71.73,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 71.77,
			},
			{
				sections_dept: "apbi",
				sections_id: "444",
				sections_avg: 71.78,
			},
			{
				sections_dept: "apbi",
				sections_id: "444",
				sections_avg: 71.78,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 71.85,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 71.87,
			},
			{
				sections_dept: "apbi",
				sections_id: "244",
				sections_avg: 71.88,
			},
			{
				sections_dept: "apbi",
				sections_id: "244",
				sections_avg: 71.88,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 71.89,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 71.91,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 72.03,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 72.03,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 72.04,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 72.08,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 72.09,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 72.14,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 72.22,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 72.23,
			},
			{
				sections_dept: "apbi",
				sections_id: "244",
				sections_avg: 72.24,
			},
			{
				sections_dept: "apbi",
				sections_id: "244",
				sections_avg: 72.24,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 72.29,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 72.29,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 72.35,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 72.36,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 72.36,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 72.36,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 72.45,
			},
			{
				sections_dept: "apbi",
				sections_id: "403",
				sections_avg: 72.5,
			},
			{
				sections_dept: "apbi",
				sections_id: "403",
				sections_avg: 72.5,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 72.55,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 72.57,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 72.58,
			},
			{
				sections_dept: "apbi",
				sections_id: "440",
				sections_avg: 72.6,
			},
			{
				sections_dept: "apbi",
				sections_id: "440",
				sections_avg: 72.6,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 72.6,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 72.64,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 72.64,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 72.74,
			},
			{
				sections_dept: "apsc",
				sections_id: "178",
				sections_avg: 72.76,
			},
			{
				sections_dept: "apsc",
				sections_id: "178",
				sections_avg: 72.76,
			},
			{
				sections_dept: "apbi",
				sections_id: "210",
				sections_avg: 72.78,
			},
			{
				sections_dept: "apbi",
				sections_id: "210",
				sections_avg: 72.78,
			},
			{
				sections_dept: "apbi",
				sections_id: "324",
				sections_avg: 72.78,
			},
			{
				sections_dept: "apbi",
				sections_id: "324",
				sections_avg: 72.78,
			},
			{
				sections_dept: "apbi",
				sections_id: "210",
				sections_avg: 72.8,
			},
			{
				sections_dept: "apbi",
				sections_id: "210",
				sections_avg: 72.8,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 72.82,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 72.82,
			},
			{
				sections_dept: "apbi",
				sections_id: "460",
				sections_avg: 72.84,
			},
			{
				sections_dept: "apbi",
				sections_id: "460",
				sections_avg: 72.84,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 72.87,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 72.97,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 72.99,
			},
			{
				sections_dept: "apbi",
				sections_id: "418",
				sections_avg: 73,
			},
			{
				sections_dept: "apbi",
				sections_id: "419",
				sections_avg: 73,
			},
			{
				sections_dept: "apbi",
				sections_id: "419",
				sections_avg: 73,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 73,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 73,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 73,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 73.03,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 73.05,
			},
			{
				sections_dept: "apbi",
				sections_id: "327",
				sections_avg: 73.06,
			},
			{
				sections_dept: "apbi",
				sections_id: "327",
				sections_avg: 73.06,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 73.11,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 73.13,
			},
			{
				sections_dept: "apsc",
				sections_id: "172",
				sections_avg: 73.18,
			},
			{
				sections_dept: "apsc",
				sections_id: "172",
				sections_avg: 73.18,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 73.2,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 73.2,
			},
			{
				sections_dept: "apbi",
				sections_id: "360",
				sections_avg: 73.24,
			},
			{
				sections_dept: "apbi",
				sections_id: "360",
				sections_avg: 73.24,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 73.24,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 73.25,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 73.29,
			},
			{
				sections_dept: "apbi",
				sections_id: "342",
				sections_avg: 73.31,
			},
			{
				sections_dept: "apbi",
				sections_id: "342",
				sections_avg: 73.31,
			},
			{
				sections_dept: "apbi",
				sections_id: "426",
				sections_avg: 73.33,
			},
			{
				sections_dept: "apbi",
				sections_id: "426",
				sections_avg: 73.33,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 73.37,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 73.39,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 73.44,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 73.45,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 73.5,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 73.5,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 73.5,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 73.55,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 73.59,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 73.64,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 73.66,
			},
			{
				sections_dept: "apbi",
				sections_id: "361",
				sections_avg: 73.68,
			},
			{
				sections_dept: "apbi",
				sections_id: "361",
				sections_avg: 73.68,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 73.68,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 73.68,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 73.7,
			},
			{
				sections_dept: "apbi",
				sections_id: "244",
				sections_avg: 73.74,
			},
			{
				sections_dept: "apbi",
				sections_id: "244",
				sections_avg: 73.74,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 73.74,
			},
			{
				sections_dept: "apbi",
				sections_id: "351",
				sections_avg: 73.75,
			},
			{
				sections_dept: "apbi",
				sections_id: "351",
				sections_avg: 73.75,
			},
			{
				sections_dept: "apbi",
				sections_id: "444",
				sections_avg: 73.78,
			},
			{
				sections_dept: "apbi",
				sections_id: "444",
				sections_avg: 73.78,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 73.78,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 73.79,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 73.83,
			},
			{
				sections_dept: "apbi",
				sections_id: "210",
				sections_avg: 73.85,
			},
			{
				sections_dept: "apbi",
				sections_id: "210",
				sections_avg: 73.85,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 73.85,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 73.87,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 73.96,
			},
			{
				sections_dept: "apsc",
				sections_id: "261",
				sections_avg: 74,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 74.01,
			},
			{
				sections_dept: "apbi",
				sections_id: "361",
				sections_avg: 74.02,
			},
			{
				sections_dept: "apbi",
				sections_id: "361",
				sections_avg: 74.02,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 74.02,
			},
			{
				sections_dept: "apbi",
				sections_id: "401",
				sections_avg: 74.04,
			},
			{
				sections_dept: "apbi",
				sections_id: "401",
				sections_avg: 74.04,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 74.05,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.08,
			},
			{
				sections_dept: "apbi",
				sections_id: "495",
				sections_avg: 74.13,
			},
			{
				sections_dept: "apbi",
				sections_id: "495",
				sections_avg: 74.13,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 74.13,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 74.13,
			},
			{
				sections_dept: "apbi",
				sections_id: "327",
				sections_avg: 74.18,
			},
			{
				sections_dept: "apbi",
				sections_id: "327",
				sections_avg: 74.18,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.19,
			},
			{
				sections_dept: "apbi",
				sections_id: "328",
				sections_avg: 74.2,
			},
			{
				sections_dept: "apbi",
				sections_id: "328",
				sections_avg: 74.2,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.21,
			},
			{
				sections_dept: "apbi",
				sections_id: "328",
				sections_avg: 74.22,
			},
			{
				sections_dept: "apbi",
				sections_id: "328",
				sections_avg: 74.22,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.24,
			},
			{
				sections_dept: "apbi",
				sections_id: "327",
				sections_avg: 74.25,
			},
			{
				sections_dept: "apbi",
				sections_id: "327",
				sections_avg: 74.25,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.25,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.27,
			},
			{
				sections_dept: "apbi",
				sections_id: "490",
				sections_avg: 74.29,
			},
			{
				sections_dept: "apbi",
				sections_id: "490",
				sections_avg: 74.29,
			},
			{
				sections_dept: "apbi",
				sections_id: "210",
				sections_avg: 74.3,
			},
			{
				sections_dept: "apbi",
				sections_id: "210",
				sections_avg: 74.3,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 74.3,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.31,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 74.32,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 74.33,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 74.33,
			},
			{
				sections_dept: "apsc",
				sections_id: "173",
				sections_avg: 74.33,
			},
			{
				sections_dept: "apsc",
				sections_id: "173",
				sections_avg: 74.33,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 74.36,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 74.38,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.39,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.43,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.44,
			},
			{
				sections_dept: "apbi",
				sections_id: "495",
				sections_avg: 74.45,
			},
			{
				sections_dept: "apbi",
				sections_id: "495",
				sections_avg: 74.45,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.47,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.49,
			},
			{
				sections_dept: "apbi",
				sections_id: "498",
				sections_avg: 74.5,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 74.5,
			},
			{
				sections_dept: "apbi",
				sections_id: "327",
				sections_avg: 74.52,
			},
			{
				sections_dept: "apbi",
				sections_id: "327",
				sections_avg: 74.52,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.53,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.54,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 74.56,
			},
			{
				sections_dept: "apbi",
				sections_id: "244",
				sections_avg: 74.6,
			},
			{
				sections_dept: "apbi",
				sections_id: "244",
				sections_avg: 74.6,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 74.63,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 74.65,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 74.68,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.73,
			},
			{
				sections_dept: "apbi",
				sections_id: "327",
				sections_avg: 74.74,
			},
			{
				sections_dept: "apbi",
				sections_id: "327",
				sections_avg: 74.74,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 74.74,
			},
			{
				sections_dept: "apbi",
				sections_id: "490",
				sections_avg: 74.75,
			},
			{
				sections_dept: "apbi",
				sections_id: "460",
				sections_avg: 74.77,
			},
			{
				sections_dept: "apbi",
				sections_id: "460",
				sections_avg: 74.77,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.77,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 74.79,
			},
			{
				sections_dept: "apbi",
				sections_id: "490",
				sections_avg: 74.8,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 74.82,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.83,
			},
			{
				sections_dept: "apbi",
				sections_id: "401",
				sections_avg: 74.84,
			},
			{
				sections_dept: "apbi",
				sections_id: "401",
				sections_avg: 74.84,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.85,
			},
			{
				sections_dept: "apbi",
				sections_id: "490",
				sections_avg: 74.88,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.89,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 74.89,
			},
			{
				sections_dept: "apbi",
				sections_id: "342",
				sections_avg: 74.9,
			},
			{
				sections_dept: "apbi",
				sections_id: "342",
				sections_avg: 74.9,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 74.96,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 74.96,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.97,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 74.98,
			},
			{
				sections_dept: "apbi",
				sections_id: "328",
				sections_avg: 75,
			},
			{
				sections_dept: "apbi",
				sections_id: "328",
				sections_avg: 75,
			},
			{
				sections_dept: "apsc",
				sections_id: "182",
				sections_avg: 75.08,
			},
			{
				sections_dept: "apsc",
				sections_id: "182",
				sections_avg: 75.08,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 75.08,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 75.1,
			},
			{
				sections_dept: "apbi",
				sections_id: "312",
				sections_avg: 75.19,
			},
			{
				sections_dept: "apbi",
				sections_id: "312",
				sections_avg: 75.19,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 75.19,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 75.22,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 75.23,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 75.25,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 75.32,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 75.32,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 75.36,
			},
			{
				sections_dept: "apbi",
				sections_id: "316",
				sections_avg: 75.4,
			},
			{
				sections_dept: "apbi",
				sections_id: "316",
				sections_avg: 75.4,
			},
			{
				sections_dept: "apbi",
				sections_id: "495",
				sections_avg: 75.4,
			},
			{
				sections_dept: "apbi",
				sections_id: "495",
				sections_avg: 75.4,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 75.4,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 75.41,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 75.42,
			},
			{
				sections_dept: "apbi",
				sections_id: "418",
				sections_avg: 75.43,
			},
			{
				sections_dept: "apbi",
				sections_id: "418",
				sections_avg: 75.43,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 75.43,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 75.46,
			},
			{
				sections_dept: "apbi",
				sections_id: "401",
				sections_avg: 75.48,
			},
			{
				sections_dept: "apbi",
				sections_id: "401",
				sections_avg: 75.48,
			},
			{
				sections_dept: "apsc",
				sections_id: "172",
				sections_avg: 75.49,
			},
			{
				sections_dept: "apsc",
				sections_id: "172",
				sections_avg: 75.49,
			},
			{
				sections_dept: "apbi",
				sections_id: "324",
				sections_avg: 75.5,
			},
			{
				sections_dept: "apbi",
				sections_id: "324",
				sections_avg: 75.5,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 75.51,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 75.51,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 75.53,
			},
			{
				sections_dept: "apbi",
				sections_id: "401",
				sections_avg: 75.54,
			},
			{
				sections_dept: "apbi",
				sections_id: "401",
				sections_avg: 75.54,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 75.55,
			},
			{
				sections_dept: "apsc",
				sections_id: "261",
				sections_avg: 75.57,
			},
			{
				sections_dept: "apbi",
				sections_id: "418",
				sections_avg: 75.63,
			},
			{
				sections_dept: "apbi",
				sections_id: "418",
				sections_avg: 75.63,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 75.63,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 75.67,
			},
			{
				sections_dept: "apsc",
				sections_id: "261",
				sections_avg: 75.68,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 75.68,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 75.77,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 75.77,
			},
			{
				sections_dept: "apbi",
				sections_id: "418",
				sections_avg: 75.78,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 75.78,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 75.82,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 75.85,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 75.86,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 75.89,
			},
			{
				sections_dept: "apbi",
				sections_id: "260",
				sections_avg: 75.91,
			},
			{
				sections_dept: "apbi",
				sections_id: "260",
				sections_avg: 75.91,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 75.92,
			},
			{
				sections_dept: "apsc",
				sections_id: "440",
				sections_avg: 75.93,
			},
			{
				sections_dept: "apsc",
				sections_id: "440",
				sections_avg: 75.93,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 75.95,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 76.04,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 76.08,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 76.08,
			},
			{
				sections_dept: "apbi",
				sections_id: "315",
				sections_avg: 76.09,
			},
			{
				sections_dept: "apbi",
				sections_id: "315",
				sections_avg: 76.09,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 76.09,
			},
			{
				sections_dept: "apsc",
				sections_id: "261",
				sections_avg: 76.1,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 76.12,
			},
			{
				sections_dept: "apbi",
				sections_id: "324",
				sections_avg: 76.14,
			},
			{
				sections_dept: "apbi",
				sections_id: "324",
				sections_avg: 76.14,
			},
			{
				sections_dept: "apsc",
				sections_id: "183",
				sections_avg: 76.16,
			},
			{
				sections_dept: "apsc",
				sections_id: "183",
				sections_avg: 76.16,
			},
			{
				sections_dept: "apbi",
				sections_id: "327",
				sections_avg: 76.18,
			},
			{
				sections_dept: "apbi",
				sections_id: "327",
				sections_avg: 76.18,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 76.18,
			},
			{
				sections_dept: "apbi",
				sections_id: "403",
				sections_avg: 76.19,
			},
			{
				sections_dept: "apbi",
				sections_id: "403",
				sections_avg: 76.19,
			},
			{
				sections_dept: "apsc",
				sections_id: "261",
				sections_avg: 76.22,
			},
			{
				sections_dept: "apsc",
				sections_id: "261",
				sections_avg: 76.22,
			},
			{
				sections_dept: "apbi",
				sections_id: "361",
				sections_avg: 76.25,
			},
			{
				sections_dept: "apbi",
				sections_id: "361",
				sections_avg: 76.25,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 76.25,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 76.25,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 76.25,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 76.29,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 76.29,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 76.31,
			},
			{
				sections_dept: "apsc",
				sections_id: "440",
				sections_avg: 76.31,
			},
			{
				sections_dept: "apsc",
				sections_id: "440",
				sections_avg: 76.31,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 76.34,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 76.34,
			},
			{
				sections_dept: "apbi",
				sections_id: "260",
				sections_avg: 76.35,
			},
			{
				sections_dept: "apbi",
				sections_id: "260",
				sections_avg: 76.35,
			},
			{
				sections_dept: "apbi",
				sections_id: "418",
				sections_avg: 76.42,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 76.42,
			},
			{
				sections_dept: "apbi",
				sections_id: "403",
				sections_avg: 76.43,
			},
			{
				sections_dept: "apbi",
				sections_id: "403",
				sections_avg: 76.43,
			},
			{
				sections_dept: "apbi",
				sections_id: "417",
				sections_avg: 76.44,
			},
			{
				sections_dept: "apbi",
				sections_id: "417",
				sections_avg: 76.44,
			},
			{
				sections_dept: "apbi",
				sections_id: "444",
				sections_avg: 76.44,
			},
			{
				sections_dept: "apbi",
				sections_id: "444",
				sections_avg: 76.44,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 76.46,
			},
			{
				sections_dept: "apbi",
				sections_id: "495",
				sections_avg: 76.5,
			},
			{
				sections_dept: "apbi",
				sections_id: "495",
				sections_avg: 76.5,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 76.5,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 76.5,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 76.52,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 76.52,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 76.53,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 76.53,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 76.56,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 76.57,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 76.58,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 76.59,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 76.6,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 76.64,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 76.64,
			},
			{
				sections_dept: "apbi",
				sections_id: "417",
				sections_avg: 76.67,
			},
			{
				sections_dept: "apbi",
				sections_id: "417",
				sections_avg: 76.67,
			},
			{
				sections_dept: "apsc",
				sections_id: "440",
				sections_avg: 76.68,
			},
			{
				sections_dept: "apsc",
				sections_id: "440",
				sections_avg: 76.68,
			},
			{
				sections_dept: "apbi",
				sections_id: "419",
				sections_avg: 76.73,
			},
			{
				sections_dept: "apbi",
				sections_id: "311",
				sections_avg: 76.75,
			},
			{
				sections_dept: "apbi",
				sections_id: "311",
				sections_avg: 76.75,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 76.78,
			},
			{
				sections_dept: "apbi",
				sections_id: "312",
				sections_avg: 76.82,
			},
			{
				sections_dept: "apbi",
				sections_id: "312",
				sections_avg: 76.82,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 76.83,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 76.89,
			},
			{
				sections_dept: "apbi",
				sections_id: "312",
				sections_avg: 76.9,
			},
			{
				sections_dept: "apbi",
				sections_id: "312",
				sections_avg: 76.9,
			},
			{
				sections_dept: "apbi",
				sections_id: "315",
				sections_avg: 76.9,
			},
			{
				sections_dept: "apbi",
				sections_id: "315",
				sections_avg: 76.9,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 76.91,
			},
			{
				sections_dept: "apsc",
				sections_id: "261",
				sections_avg: 76.91,
			},
			{
				sections_dept: "apsc",
				sections_id: "261",
				sections_avg: 76.91,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 76.94,
			},
			{
				sections_dept: "apsc",
				sections_id: "261",
				sections_avg: 76.97,
			},
			{
				sections_dept: "apsc",
				sections_id: "261",
				sections_avg: 76.97,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 77,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 77,
			},
			{
				sections_dept: "apsc",
				sections_id: "278",
				sections_avg: 77.01,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 77.02,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 77.02,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 77.09,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 77.09,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 77.09,
			},
			{
				sections_dept: "apbi",
				sections_id: "327",
				sections_avg: 77.11,
			},
			{
				sections_dept: "apbi",
				sections_id: "327",
				sections_avg: 77.11,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 77.13,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 77.14,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 77.15,
			},
			{
				sections_dept: "apbi",
				sections_id: "403",
				sections_avg: 77.2,
			},
			{
				sections_dept: "apbi",
				sections_id: "403",
				sections_avg: 77.2,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 77.2,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 77.24,
			},
			{
				sections_dept: "apbi",
				sections_id: "490",
				sections_avg: 77.25,
			},
			{
				sections_dept: "apbi",
				sections_id: "328",
				sections_avg: 77.26,
			},
			{
				sections_dept: "apbi",
				sections_id: "328",
				sections_avg: 77.26,
			},
			{
				sections_dept: "apbi",
				sections_id: "444",
				sections_avg: 77.27,
			},
			{
				sections_dept: "apbi",
				sections_id: "444",
				sections_avg: 77.27,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 77.29,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 77.29,
			},
			{
				sections_dept: "apbi",
				sections_id: "311",
				sections_avg: 77.32,
			},
			{
				sections_dept: "apbi",
				sections_id: "311",
				sections_avg: 77.32,
			},
			{
				sections_dept: "apsc",
				sections_id: "101",
				sections_avg: 77.36,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 77.38,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 77.39,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 77.39,
			},
			{
				sections_dept: "apbi",
				sections_id: "260",
				sections_avg: 77.41,
			},
			{
				sections_dept: "apbi",
				sections_id: "260",
				sections_avg: 77.41,
			},
			{
				sections_dept: "apsc",
				sections_id: "440",
				sections_avg: 77.47,
			},
			{
				sections_dept: "apsc",
				sections_id: "440",
				sections_avg: 77.47,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 77.52,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 77.55,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 77.56,
			},
			{
				sections_dept: "apbi",
				sections_id: "418",
				sections_avg: 77.57,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 77.59,
			},
			{
				sections_dept: "apbi",
				sections_id: "495",
				sections_avg: 77.6,
			},
			{
				sections_dept: "apbi",
				sections_id: "495",
				sections_avg: 77.6,
			},
			{
				sections_dept: "apbi",
				sections_id: "311",
				sections_avg: 77.63,
			},
			{
				sections_dept: "apbi",
				sections_id: "311",
				sections_avg: 77.63,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 77.68,
			},
			{
				sections_dept: "apbi",
				sections_id: "311",
				sections_avg: 77.69,
			},
			{
				sections_dept: "apbi",
				sections_id: "311",
				sections_avg: 77.69,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 77.69,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 77.72,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 77.79,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 77.81,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 77.82,
			},
			{
				sections_dept: "apsc",
				sections_id: "440",
				sections_avg: 77.83,
			},
			{
				sections_dept: "apsc",
				sections_id: "440",
				sections_avg: 77.83,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 77.86,
			},
			{
				sections_dept: "apsc",
				sections_id: "377",
				sections_avg: 77.88,
			},
			{
				sections_dept: "apsc",
				sections_id: "377",
				sections_avg: 77.88,
			},
			{
				sections_dept: "apbi",
				sections_id: "324",
				sections_avg: 77.9,
			},
			{
				sections_dept: "apbi",
				sections_id: "324",
				sections_avg: 77.9,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 77.9,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 77.9,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 77.92,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 77.94,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 77.94,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 77.96,
			},
			{
				sections_dept: "appp",
				sections_id: "503",
				sections_avg: 77.99,
			},
			{
				sections_dept: "appp",
				sections_id: "503",
				sections_avg: 77.99,
			},
			{
				sections_dept: "apbi",
				sections_id: "418",
				sections_avg: 78,
			},
			{
				sections_dept: "appp",
				sections_id: "505",
				sections_avg: 78,
			},
			{
				sections_dept: "appp",
				sections_id: "505",
				sections_avg: 78,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 78,
			},
			{
				sections_dept: "apbi",
				sections_id: "419",
				sections_avg: 78.09,
			},
			{
				sections_dept: "apbi",
				sections_id: "419",
				sections_avg: 78.09,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 78.12,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 78.13,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 78.13,
			},
			{
				sections_dept: "apbi",
				sections_id: "324",
				sections_avg: 78.2,
			},
			{
				sections_dept: "apbi",
				sections_id: "324",
				sections_avg: 78.2,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 78.2,
			},
			{
				sections_dept: "apbi",
				sections_id: "360",
				sections_avg: 78.25,
			},
			{
				sections_dept: "apbi",
				sections_id: "360",
				sections_avg: 78.25,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 78.3,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 78.3,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 78.31,
			},
			{
				sections_dept: "apbi",
				sections_id: "311",
				sections_avg: 78.33,
			},
			{
				sections_dept: "apbi",
				sections_id: "311",
				sections_avg: 78.33,
			},
			{
				sections_dept: "apbi",
				sections_id: "312",
				sections_avg: 78.33,
			},
			{
				sections_dept: "apbi",
				sections_id: "312",
				sections_avg: 78.33,
			},
			{
				sections_dept: "apsc",
				sections_id: "541",
				sections_avg: 78.33,
			},
			{
				sections_dept: "apsc",
				sections_id: "541",
				sections_avg: 78.33,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 78.38,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 78.38,
			},
			{
				sections_dept: "apbi",
				sections_id: "498",
				sections_avg: 78.4,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 78.41,
			},
			{
				sections_dept: "apbi",
				sections_id: "260",
				sections_avg: 78.43,
			},
			{
				sections_dept: "apbi",
				sections_id: "260",
				sections_avg: 78.43,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 78.49,
			},
			{
				sections_dept: "apsc",
				sections_id: "101",
				sections_avg: 78.5,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 78.5,
			},
			{
				sections_dept: "apbi",
				sections_id: "401",
				sections_avg: 78.52,
			},
			{
				sections_dept: "apbi",
				sections_id: "401",
				sections_avg: 78.52,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 78.52,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 78.52,
			},
			{
				sections_dept: "apbi",
				sections_id: "322",
				sections_avg: 78.54,
			},
			{
				sections_dept: "apbi",
				sections_id: "322",
				sections_avg: 78.54,
			},
			{
				sections_dept: "apsc",
				sections_id: "440",
				sections_avg: 78.56,
			},
			{
				sections_dept: "apsc",
				sections_id: "440",
				sections_avg: 78.56,
			},
			{
				sections_dept: "apbi",
				sections_id: "322",
				sections_avg: 78.58,
			},
			{
				sections_dept: "apbi",
				sections_id: "322",
				sections_avg: 78.58,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 78.58,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 78.59,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 78.59,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 78.6,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 78.62,
			},
			{
				sections_dept: "apsc",
				sections_id: "101",
				sections_avg: 78.66,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 78.7,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 78.71,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 78.73,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 78.75,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 78.75,
			},
			{
				sections_dept: "apbi",
				sections_id: "342",
				sections_avg: 78.8,
			},
			{
				sections_dept: "apbi",
				sections_id: "342",
				sections_avg: 78.8,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 78.81,
			},
			{
				sections_dept: "apsc",
				sections_id: "261",
				sections_avg: 78.81,
			},
			{
				sections_dept: "apsc",
				sections_id: "261",
				sections_avg: 78.81,
			},
			{
				sections_dept: "apsc",
				sections_id: "101",
				sections_avg: 78.83,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 78.83,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 78.88,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 78.88,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 78.9,
			},
			{
				sections_dept: "apbi",
				sections_id: "415",
				sections_avg: 78.91,
			},
			{
				sections_dept: "apbi",
				sections_id: "415",
				sections_avg: 78.91,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 78.95,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 78.95,
			},
			{
				sections_dept: "apbi",
				sections_id: "260",
				sections_avg: 78.96,
			},
			{
				sections_dept: "apbi",
				sections_id: "260",
				sections_avg: 78.96,
			},
			{
				sections_dept: "apbi",
				sections_id: "322",
				sections_avg: 79,
			},
			{
				sections_dept: "apbi",
				sections_id: "322",
				sections_avg: 79,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 79,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 79,
			},
			{
				sections_dept: "apbi",
				sections_id: "490",
				sections_avg: 79,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 79,
			},
			{
				sections_dept: "apsc",
				sections_id: "440",
				sections_avg: 79.02,
			},
			{
				sections_dept: "apsc",
				sections_id: "440",
				sections_avg: 79.02,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 79.04,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 79.04,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 79.06,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 79.07,
			},
			{
				sections_dept: "apsc",
				sections_id: "440",
				sections_avg: 79.09,
			},
			{
				sections_dept: "apsc",
				sections_id: "440",
				sections_avg: 79.09,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 79.14,
			},
			{
				sections_dept: "apbi",
				sections_id: "322",
				sections_avg: 79.15,
			},
			{
				sections_dept: "apbi",
				sections_id: "322",
				sections_avg: 79.15,
			},
			{
				sections_dept: "apbi",
				sections_id: "401",
				sections_avg: 79.16,
			},
			{
				sections_dept: "apbi",
				sections_id: "401",
				sections_avg: 79.16,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 79.18,
			},
			{
				sections_dept: "apbi",
				sections_id: "315",
				sections_avg: 79.2,
			},
			{
				sections_dept: "apbi",
				sections_id: "315",
				sections_avg: 79.2,
			},
			{
				sections_dept: "apbi",
				sections_id: "360",
				sections_avg: 79.2,
			},
			{
				sections_dept: "apbi",
				sections_id: "360",
				sections_avg: 79.2,
			},
			{
				sections_dept: "apbi",
				sections_id: "419",
				sections_avg: 79.24,
			},
			{
				sections_dept: "apbi",
				sections_id: "360",
				sections_avg: 79.31,
			},
			{
				sections_dept: "apbi",
				sections_id: "360",
				sections_avg: 79.31,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 79.34,
			},
			{
				sections_dept: "apsc",
				sections_id: "261",
				sections_avg: 79.36,
			},
			{
				sections_dept: "apsc",
				sections_id: "261",
				sections_avg: 79.36,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 79.36,
			},
			{
				sections_dept: "apbi",
				sections_id: "260",
				sections_avg: 79.4,
			},
			{
				sections_dept: "apbi",
				sections_id: "260",
				sections_avg: 79.4,
			},
			{
				sections_dept: "apsc",
				sections_id: "101",
				sections_avg: 79.4,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 79.43,
			},
			{
				sections_dept: "apsc",
				sections_id: "440",
				sections_avg: 79.43,
			},
			{
				sections_dept: "apsc",
				sections_id: "440",
				sections_avg: 79.43,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 79.43,
			},
			{
				sections_dept: "apbi",
				sections_id: "495",
				sections_avg: 79.44,
			},
			{
				sections_dept: "apbi",
				sections_id: "495",
				sections_avg: 79.44,
			},
			{
				sections_dept: "apbi",
				sections_id: "342",
				sections_avg: 79.45,
			},
			{
				sections_dept: "apbi",
				sections_id: "342",
				sections_avg: 79.45,
			},
			{
				sections_dept: "apbi",
				sections_id: "417",
				sections_avg: 79.55,
			},
			{
				sections_dept: "apbi",
				sections_id: "417",
				sections_avg: 79.55,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 79.55,
			},
			{
				sections_dept: "apsc",
				sections_id: "261",
				sections_avg: 79.6,
			},
			{
				sections_dept: "apsc",
				sections_id: "261",
				sections_avg: 79.6,
			},
			{
				sections_dept: "apbi",
				sections_id: "312",
				sections_avg: 79.61,
			},
			{
				sections_dept: "apbi",
				sections_id: "312",
				sections_avg: 79.61,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 79.63,
			},
			{
				sections_dept: "apbi",
				sections_id: "311",
				sections_avg: 79.64,
			},
			{
				sections_dept: "apbi",
				sections_id: "311",
				sections_avg: 79.64,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 79.66,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 79.66,
			},
			{
				sections_dept: "apbi",
				sections_id: "342",
				sections_avg: 79.67,
			},
			{
				sections_dept: "apbi",
				sections_id: "342",
				sections_avg: 79.67,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 79.67,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 79.69,
			},
			{
				sections_dept: "apsc",
				sections_id: "377",
				sections_avg: 79.7,
			},
			{
				sections_dept: "apsc",
				sections_id: "377",
				sections_avg: 79.7,
			},
			{
				sections_dept: "apbi",
				sections_id: "401",
				sections_avg: 79.71,
			},
			{
				sections_dept: "apbi",
				sections_id: "401",
				sections_avg: 79.71,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 79.78,
			},
			{
				sections_dept: "apbi",
				sections_id: "316",
				sections_avg: 79.79,
			},
			{
				sections_dept: "apbi",
				sections_id: "316",
				sections_avg: 79.79,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 79.79,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 79.82,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 79.83,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 79.83,
			},
			{
				sections_dept: "apbi",
				sections_id: "418",
				sections_avg: 79.85,
			},
			{
				sections_dept: "apbi",
				sections_id: "418",
				sections_avg: 79.85,
			},
			{
				sections_dept: "apbi",
				sections_id: "361",
				sections_avg: 79.87,
			},
			{
				sections_dept: "apbi",
				sections_id: "361",
				sections_avg: 79.87,
			},
			{
				sections_dept: "apsc",
				sections_id: "261",
				sections_avg: 79.98,
			},
			{
				sections_dept: "apsc",
				sections_id: "261",
				sections_avg: 79.98,
			},
			{
				sections_dept: "apbi",
				sections_id: "418",
				sections_avg: 80,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 80,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 80,
			},
			{
				sections_dept: "apbi",
				sections_id: "312",
				sections_avg: 80.07,
			},
			{
				sections_dept: "apbi",
				sections_id: "312",
				sections_avg: 80.07,
			},
			{
				sections_dept: "apbi",
				sections_id: "360",
				sections_avg: 80.09,
			},
			{
				sections_dept: "apbi",
				sections_id: "360",
				sections_avg: 80.09,
			},
			{
				sections_dept: "apbi",
				sections_id: "342",
				sections_avg: 80.13,
			},
			{
				sections_dept: "apbi",
				sections_id: "342",
				sections_avg: 80.13,
			},
			{
				sections_dept: "apbi",
				sections_id: "361",
				sections_avg: 80.17,
			},
			{
				sections_dept: "apbi",
				sections_id: "361",
				sections_avg: 80.17,
			},
			{
				sections_dept: "apbi",
				sections_id: "322",
				sections_avg: 80.18,
			},
			{
				sections_dept: "apbi",
				sections_id: "322",
				sections_avg: 80.18,
			},
			{
				sections_dept: "apbi",
				sections_id: "312",
				sections_avg: 80.22,
			},
			{
				sections_dept: "apbi",
				sections_id: "312",
				sections_avg: 80.22,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 80.26,
			},
			{
				sections_dept: "apsc",
				sections_id: "100",
				sections_avg: 80.28,
			},
			{
				sections_dept: "apsc",
				sections_id: "486",
				sections_avg: 80.29,
			},
			{
				sections_dept: "apsc",
				sections_id: "486",
				sections_avg: 80.29,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 80.31,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 80.31,
			},
			{
				sections_dept: "apsc",
				sections_id: "100",
				sections_avg: 80.37,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 80.37,
			},
			{
				sections_dept: "apbi",
				sections_id: "342",
				sections_avg: 80.38,
			},
			{
				sections_dept: "apbi",
				sections_id: "342",
				sections_avg: 80.38,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 80.38,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 80.42,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 80.42,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 80.46,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 80.47,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 80.48,
			},
			{
				sections_dept: "apsc",
				sections_id: "100",
				sections_avg: 80.49,
			},
			{
				sections_dept: "apbi",
				sections_id: "418",
				sections_avg: 80.5,
			},
			{
				sections_dept: "apsc",
				sections_id: "261",
				sections_avg: 80.5,
			},
			{
				sections_dept: "apsc",
				sections_id: "261",
				sections_avg: 80.5,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 80.5,
			},
			{
				sections_dept: "apbi",
				sections_id: "415",
				sections_avg: 80.54,
			},
			{
				sections_dept: "apbi",
				sections_id: "415",
				sections_avg: 80.54,
			},
			{
				sections_dept: "apbi",
				sections_id: "311",
				sections_avg: 80.55,
			},
			{
				sections_dept: "apbi",
				sections_id: "311",
				sections_avg: 80.55,
			},
			{
				sections_dept: "apbi",
				sections_id: "316",
				sections_avg: 80.56,
			},
			{
				sections_dept: "apbi",
				sections_id: "316",
				sections_avg: 80.56,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 80.61,
			},
			{
				sections_dept: "apbi",
				sections_id: "460",
				sections_avg: 80.62,
			},
			{
				sections_dept: "apbi",
				sections_id: "460",
				sections_avg: 80.62,
			},
			{
				sections_dept: "apbi",
				sections_id: "442",
				sections_avg: 80.63,
			},
			{
				sections_dept: "apbi",
				sections_id: "442",
				sections_avg: 80.63,
			},
			{
				sections_dept: "apbi",
				sections_id: "415",
				sections_avg: 80.67,
			},
			{
				sections_dept: "apbi",
				sections_id: "415",
				sections_avg: 80.67,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 80.7,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 80.72,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 80.74,
			},
			{
				sections_dept: "apsc",
				sections_id: "100",
				sections_avg: 80.78,
			},
			{
				sections_dept: "apbi",
				sections_id: "360",
				sections_avg: 80.81,
			},
			{
				sections_dept: "apbi",
				sections_id: "360",
				sections_avg: 80.81,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 80.83,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 80.86,
			},
			{
				sections_dept: "apsc",
				sections_id: "160",
				sections_avg: 80.86,
			},
			{
				sections_dept: "apbi",
				sections_id: "413",
				sections_avg: 80.9,
			},
			{
				sections_dept: "apbi",
				sections_id: "413",
				sections_avg: 80.9,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 80.9,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 80.94,
			},
			{
				sections_dept: "apbi",
				sections_id: "360",
				sections_avg: 81,
			},
			{
				sections_dept: "apbi",
				sections_id: "360",
				sections_avg: 81,
			},
			{
				sections_dept: "apbi",
				sections_id: "426",
				sections_avg: 81,
			},
			{
				sections_dept: "apbi",
				sections_id: "426",
				sections_avg: 81,
			},
			{
				sections_dept: "apsc",
				sections_id: "541",
				sections_avg: 81.08,
			},
			{
				sections_dept: "apsc",
				sections_id: "541",
				sections_avg: 81.08,
			},
			{
				sections_dept: "apbi",
				sections_id: "315",
				sections_avg: 81.09,
			},
			{
				sections_dept: "apbi",
				sections_id: "315",
				sections_avg: 81.09,
			},
			{
				sections_dept: "apbi",
				sections_id: "316",
				sections_avg: 81.14,
			},
			{
				sections_dept: "apbi",
				sections_id: "316",
				sections_avg: 81.14,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 81.16,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 81.16,
			},
			{
				sections_dept: "apbi",
				sections_id: "498",
				sections_avg: 81.17,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 81.2,
			},
			{
				sections_dept: "apbi",
				sections_id: "311",
				sections_avg: 81.27,
			},
			{
				sections_dept: "apbi",
				sections_id: "311",
				sections_avg: 81.27,
			},
			{
				sections_dept: "apbi",
				sections_id: "414",
				sections_avg: 81.27,
			},
			{
				sections_dept: "apbi",
				sections_id: "414",
				sections_avg: 81.27,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 81.29,
			},
			{
				sections_dept: "apsc",
				sections_id: "486",
				sections_avg: 81.36,
			},
			{
				sections_dept: "apsc",
				sections_id: "486",
				sections_avg: 81.36,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 81.38,
			},
			{
				sections_dept: "apbi",
				sections_id: "498",
				sections_avg: 81.4,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 81.41,
			},
			{
				sections_dept: "apbi",
				sections_id: "401",
				sections_avg: 81.47,
			},
			{
				sections_dept: "apbi",
				sections_id: "401",
				sections_avg: 81.47,
			},
			{
				sections_dept: "apbi",
				sections_id: "418",
				sections_avg: 81.53,
			},
			{
				sections_dept: "apbi",
				sections_id: "418",
				sections_avg: 81.53,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 81.6,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 81.64,
			},
			{
				sections_dept: "appp",
				sections_id: "502",
				sections_avg: 81.64,
			},
			{
				sections_dept: "appp",
				sections_id: "502",
				sections_avg: 81.64,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 81.66,
			},
			{
				sections_dept: "apbi",
				sections_id: "402",
				sections_avg: 81.71,
			},
			{
				sections_dept: "apbi",
				sections_id: "402",
				sections_avg: 81.71,
			},
			{
				sections_dept: "apbi",
				sections_id: "426",
				sections_avg: 81.75,
			},
			{
				sections_dept: "apbi",
				sections_id: "426",
				sections_avg: 81.75,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 81.76,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 81.8,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 81.82,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 81.87,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 81.91,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 81.92,
			},
			{
				sections_dept: "apbi",
				sections_id: "315",
				sections_avg: 82,
			},
			{
				sections_dept: "apbi",
				sections_id: "315",
				sections_avg: 82,
			},
			{
				sections_dept: "apbi",
				sections_id: "419",
				sections_avg: 82,
			},
			{
				sections_dept: "apbi",
				sections_id: "419",
				sections_avg: 82,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 82.05,
			},
			{
				sections_dept: "apbi",
				sections_id: "314",
				sections_avg: 82.06,
			},
			{
				sections_dept: "apbi",
				sections_id: "314",
				sections_avg: 82.06,
			},
			{
				sections_dept: "apsc",
				sections_id: "100",
				sections_avg: 82.08,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 82.13,
			},
			{
				sections_dept: "apbi",
				sections_id: "490",
				sections_avg: 82.24,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 82.29,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 82.29,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 82.35,
			},
			{
				sections_dept: "apbi",
				sections_id: "419",
				sections_avg: 82.4,
			},
			{
				sections_dept: "apbi",
				sections_id: "426",
				sections_avg: 82.44,
			},
			{
				sections_dept: "apbi",
				sections_id: "426",
				sections_avg: 82.44,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 82.46,
			},
			{
				sections_dept: "apbi",
				sections_id: "398",
				sections_avg: 82.5,
			},
			{
				sections_dept: "apbi",
				sections_id: "398",
				sections_avg: 82.5,
			},
			{
				sections_dept: "apsc",
				sections_id: "541",
				sections_avg: 82.52,
			},
			{
				sections_dept: "apsc",
				sections_id: "541",
				sections_avg: 82.52,
			},
			{
				sections_dept: "apsc",
				sections_id: "486",
				sections_avg: 82.53,
			},
			{
				sections_dept: "apsc",
				sections_id: "486",
				sections_avg: 82.53,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 82.58,
			},
			{
				sections_dept: "apsc",
				sections_id: "541",
				sections_avg: 82.59,
			},
			{
				sections_dept: "apsc",
				sections_id: "541",
				sections_avg: 82.59,
			},
			{
				sections_dept: "apbi",
				sections_id: "402",
				sections_avg: 82.63,
			},
			{
				sections_dept: "apbi",
				sections_id: "402",
				sections_avg: 82.63,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 82.63,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 82.64,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 82.66,
			},
			{
				sections_dept: "apsc",
				sections_id: "486",
				sections_avg: 82.66,
			},
			{
				sections_dept: "apsc",
				sections_id: "486",
				sections_avg: 82.66,
			},
			{
				sections_dept: "apbi",
				sections_id: "398",
				sections_avg: 82.69,
			},
			{
				sections_dept: "apbi",
				sections_id: "398",
				sections_avg: 82.69,
			},
			{
				sections_dept: "apbi",
				sections_id: "402",
				sections_avg: 82.73,
			},
			{
				sections_dept: "apbi",
				sections_id: "402",
				sections_avg: 82.73,
			},
			{
				sections_dept: "apbi",
				sections_id: "490",
				sections_avg: 82.75,
			},
			{
				sections_dept: "apbi",
				sections_id: "361",
				sections_avg: 82.79,
			},
			{
				sections_dept: "apbi",
				sections_id: "361",
				sections_avg: 82.79,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 82.85,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 82.88,
			},
			{
				sections_dept: "apbi",
				sections_id: "402",
				sections_avg: 82.89,
			},
			{
				sections_dept: "apbi",
				sections_id: "402",
				sections_avg: 82.89,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 82.92,
			},
			{
				sections_dept: "apbi",
				sections_id: "414",
				sections_avg: 82.93,
			},
			{
				sections_dept: "apbi",
				sections_id: "414",
				sections_avg: 82.93,
			},
			{
				sections_dept: "apsc",
				sections_id: "541",
				sections_avg: 83,
			},
			{
				sections_dept: "apsc",
				sections_id: "541",
				sections_avg: 83,
			},
			{
				sections_dept: "apbi",
				sections_id: "402",
				sections_avg: 83.08,
			},
			{
				sections_dept: "apbi",
				sections_id: "402",
				sections_avg: 83.08,
			},
			{
				sections_dept: "apbi",
				sections_id: "314",
				sections_avg: 83.09,
			},
			{
				sections_dept: "apbi",
				sections_id: "314",
				sections_avg: 83.09,
			},
			{
				sections_dept: "apbi",
				sections_id: "398",
				sections_avg: 83.13,
			},
			{
				sections_dept: "apbi",
				sections_id: "398",
				sections_avg: 83.13,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 83.14,
			},
			{
				sections_dept: "apbi",
				sections_id: "315",
				sections_avg: 83.17,
			},
			{
				sections_dept: "apbi",
				sections_id: "315",
				sections_avg: 83.17,
			},
			{
				sections_dept: "apbi",
				sections_id: "490",
				sections_avg: 83.17,
			},
			{
				sections_dept: "apbi",
				sections_id: "314",
				sections_avg: 83.22,
			},
			{
				sections_dept: "apbi",
				sections_id: "314",
				sections_avg: 83.22,
			},
			{
				sections_dept: "apsc",
				sections_id: "541",
				sections_avg: 83.24,
			},
			{
				sections_dept: "apsc",
				sections_id: "541",
				sections_avg: 83.24,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 83.25,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 83.25,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 83.28,
			},
			{
				sections_dept: "apbi",
				sections_id: "398",
				sections_avg: 83.4,
			},
			{
				sections_dept: "apbi",
				sections_id: "398",
				sections_avg: 83.4,
			},
			{
				sections_dept: "apbi",
				sections_id: "322",
				sections_avg: 83.44,
			},
			{
				sections_dept: "apbi",
				sections_id: "322",
				sections_avg: 83.44,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 83.47,
			},
			{
				sections_dept: "apsc",
				sections_id: "486",
				sections_avg: 83.47,
			},
			{
				sections_dept: "apsc",
				sections_id: "486",
				sections_avg: 83.47,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 83.5,
			},
			{
				sections_dept: "apbi",
				sections_id: "498",
				sections_avg: 83.5,
			},
			{
				sections_dept: "apsc",
				sections_id: "541",
				sections_avg: 83.5,
			},
			{
				sections_dept: "apsc",
				sections_id: "541",
				sections_avg: 83.5,
			},
			{
				sections_dept: "apbi",
				sections_id: "499",
				sections_avg: 83.67,
			},
			{
				sections_dept: "apbi",
				sections_id: "315",
				sections_avg: 83.68,
			},
			{
				sections_dept: "apbi",
				sections_id: "315",
				sections_avg: 83.68,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 83.71,
			},
			{
				sections_dept: "apbi",
				sections_id: "414",
				sections_avg: 83.75,
			},
			{
				sections_dept: "apbi",
				sections_id: "414",
				sections_avg: 83.75,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 83.75,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 83.8,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 83.86,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 83.86,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 83.92,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 83.92,
			},
			{
				sections_dept: "apsc",
				sections_id: "541",
				sections_avg: 83.92,
			},
			{
				sections_dept: "apsc",
				sections_id: "541",
				sections_avg: 83.92,
			},
			{
				sections_dept: "apsc",
				sections_id: "201",
				sections_avg: 83.94,
			},
			{
				sections_dept: "apbi",
				sections_id: "490",
				sections_avg: 84,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 84.05,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 84.06,
			},
			{
				sections_dept: "apbi",
				sections_id: "315",
				sections_avg: 84.11,
			},
			{
				sections_dept: "apbi",
				sections_id: "315",
				sections_avg: 84.11,
			},
			{
				sections_dept: "apbi",
				sections_id: "490",
				sections_avg: 84.11,
			},
			{
				sections_dept: "apbi",
				sections_id: "410",
				sections_avg: 84.13,
			},
			{
				sections_dept: "apbi",
				sections_id: "410",
				sections_avg: 84.13,
			},
			{
				sections_dept: "apbi",
				sections_id: "398",
				sections_avg: 84.24,
			},
			{
				sections_dept: "apbi",
				sections_id: "398",
				sections_avg: 84.24,
			},
			{
				sections_dept: "apbi",
				sections_id: "444",
				sections_avg: 84.25,
			},
			{
				sections_dept: "apbi",
				sections_id: "444",
				sections_avg: 84.25,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 84.25,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 84.28,
			},
			{
				sections_dept: "apbi",
				sections_id: "260",
				sections_avg: 84.29,
			},
			{
				sections_dept: "apbi",
				sections_id: "260",
				sections_avg: 84.29,
			},
			{
				sections_dept: "apbi",
				sections_id: "402",
				sections_avg: 84.3,
			},
			{
				sections_dept: "apbi",
				sections_id: "402",
				sections_avg: 84.3,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 84.3,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 84.32,
			},
			{
				sections_dept: "apbi",
				sections_id: "414",
				sections_avg: 84.33,
			},
			{
				sections_dept: "apbi",
				sections_id: "414",
				sections_avg: 84.33,
			},
			{
				sections_dept: "apsc",
				sections_id: "486",
				sections_avg: 84.35,
			},
			{
				sections_dept: "apsc",
				sections_id: "486",
				sections_avg: 84.35,
			},
			{
				sections_dept: "apsc",
				sections_id: "541",
				sections_avg: 84.35,
			},
			{
				sections_dept: "apsc",
				sections_id: "541",
				sections_avg: 84.35,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 84.56,
			},
			{
				sections_dept: "apsc",
				sections_id: "486",
				sections_avg: 84.58,
			},
			{
				sections_dept: "apsc",
				sections_id: "486",
				sections_avg: 84.58,
			},
			{
				sections_dept: "apbi",
				sections_id: "418",
				sections_avg: 84.69,
			},
			{
				sections_dept: "apbi",
				sections_id: "418",
				sections_avg: 84.69,
			},
			{
				sections_dept: "apbi",
				sections_id: "314",
				sections_avg: 84.72,
			},
			{
				sections_dept: "apbi",
				sections_id: "314",
				sections_avg: 84.72,
			},
			{
				sections_dept: "apbi",
				sections_id: "498",
				sections_avg: 84.75,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 84.76,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 84.8,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 84.83,
			},
			{
				sections_dept: "apbi",
				sections_id: "428",
				sections_avg: 84.9,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 84.9,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 84.92,
			},
			{
				sections_dept: "apbi",
				sections_id: "410",
				sections_avg: 84.92,
			},
			{
				sections_dept: "apbi",
				sections_id: "410",
				sections_avg: 84.92,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 84.93,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 84.94,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 84.98,
			},
			{
				sections_dept: "apbi",
				sections_id: "402",
				sections_avg: 85.15,
			},
			{
				sections_dept: "apbi",
				sections_id: "402",
				sections_avg: 85.15,
			},
			{
				sections_dept: "appp",
				sections_id: "501",
				sections_avg: 85.16,
			},
			{
				sections_dept: "appp",
				sections_id: "501",
				sections_avg: 85.16,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 85.2,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 85.24,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 85.27,
			},
			{
				sections_dept: "apbi",
				sections_id: "498",
				sections_avg: 85.29,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 85.3,
			},
			{
				sections_dept: "apbi",
				sections_id: "416",
				sections_avg: 85.33,
			},
			{
				sections_dept: "apbi",
				sections_id: "416",
				sections_avg: 85.33,
			},
			{
				sections_dept: "apsc",
				sections_id: "262",
				sections_avg: 85.47,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 85.55,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 85.67,
			},
			{
				sections_dept: "apbi",
				sections_id: "498",
				sections_avg: 85.75,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 85.75,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 85.75,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 85.76,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 85.85,
			},
			{
				sections_dept: "apbi",
				sections_id: "490",
				sections_avg: 85.93,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 86,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 86.12,
			},
			{
				sections_dept: "apbi",
				sections_id: "265",
				sections_avg: 86.14,
			},
			{
				sections_dept: "apbi",
				sections_id: "265",
				sections_avg: 86.14,
			},
			{
				sections_dept: "apbi",
				sections_id: "440",
				sections_avg: 86.14,
			},
			{
				sections_dept: "apbi",
				sections_id: "440",
				sections_avg: 86.14,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 86.15,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 86.21,
			},
			{
				sections_dept: "apbi",
				sections_id: "498",
				sections_avg: 86.25,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 86.26,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 86.41,
			},
			{
				sections_dept: "apbi",
				sections_id: "490",
				sections_avg: 86.42,
			},
			{
				sections_dept: "apbi",
				sections_id: "490",
				sections_avg: 86.42,
			},
			{
				sections_dept: "apbi",
				sections_id: "265",
				sections_avg: 86.57,
			},
			{
				sections_dept: "apbi",
				sections_id: "265",
				sections_avg: 86.57,
			},
			{
				sections_dept: "apbi",
				sections_id: "398",
				sections_avg: 86.64,
			},
			{
				sections_dept: "apbi",
				sections_id: "398",
				sections_avg: 86.64,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 86.65,
			},
			{
				sections_dept: "apbi",
				sections_id: "314",
				sections_avg: 86.68,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 86.7,
			},
			{
				sections_dept: "apbi",
				sections_id: "498",
				sections_avg: 86.75,
			},
			{
				sections_dept: "apbi",
				sections_id: "314",
				sections_avg: 86.76,
			},
			{
				sections_dept: "apbi",
				sections_id: "314",
				sections_avg: 86.8,
			},
			{
				sections_dept: "apbi",
				sections_id: "499",
				sections_avg: 86.88,
			},
			{
				sections_dept: "apbi",
				sections_id: "200",
				sections_avg: 86.95,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.06,
			},
			{
				sections_dept: "apsc",
				sections_id: "486",
				sections_avg: 87.07,
			},
			{
				sections_dept: "apsc",
				sections_id: "486",
				sections_avg: 87.07,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.11,
			},
			{
				sections_dept: "apbi",
				sections_id: "499",
				sections_avg: 87.17,
			},
			{
				sections_dept: "apbi",
				sections_id: "398",
				sections_avg: 87.2,
			},
			{
				sections_dept: "apbi",
				sections_id: "398",
				sections_avg: 87.2,
			},
			{
				sections_dept: "apbi",
				sections_id: "314",
				sections_avg: 87.21,
			},
			{
				sections_dept: "apbi",
				sections_id: "314",
				sections_avg: 87.21,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.21,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.24,
			},
			{
				sections_dept: "apbi",
				sections_id: "499",
				sections_avg: 87.25,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.27,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.3,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.33,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.35,
			},
			{
				sections_dept: "apbi",
				sections_id: "314",
				sections_avg: 87.37,
			},
			{
				sections_dept: "apbi",
				sections_id: "314",
				sections_avg: 87.37,
			},
			{
				sections_dept: "apbi",
				sections_id: "314",
				sections_avg: 87.37,
			},
			{
				sections_dept: "apbi",
				sections_id: "314",
				sections_avg: 87.37,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.38,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.44,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.48,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.5,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.52,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.53,
			},
			{
				sections_dept: "apbi",
				sections_id: "314",
				sections_avg: 87.6,
			},
			{
				sections_dept: "apbi",
				sections_id: "314",
				sections_avg: 87.6,
			},
			{
				sections_dept: "apbi",
				sections_id: "499",
				sections_avg: 87.64,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.64,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.67,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.67,
			},
			{
				sections_dept: "apbi",
				sections_id: "490",
				sections_avg: 87.75,
			},
			{
				sections_dept: "apsc",
				sections_id: "450",
				sections_avg: 87.81,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.87,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.92,
			},
			{
				sections_dept: "apbi",
				sections_id: "490",
				sections_avg: 87.93,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.95,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 87.95,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 88,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 88.07,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 88.1,
			},
			{
				sections_dept: "apbi",
				sections_id: "499",
				sections_avg: 88.2,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 88.25,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 88.4,
			},
			{
				sections_dept: "apbi",
				sections_id: "499",
				sections_avg: 88.5,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 88.6,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 88.62,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 88.7,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 88.75,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 88.81,
			},
			{
				sections_dept: "apsc",
				sections_id: "486",
				sections_avg: 88.94,
			},
			{
				sections_dept: "apsc",
				sections_id: "486",
				sections_avg: 88.94,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 88.95,
			},
			{
				sections_dept: "apbi",
				sections_id: "499",
				sections_avg: 89,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 89,
			},
			{
				sections_dept: "apbi",
				sections_id: "265",
				sections_avg: 89.29,
			},
			{
				sections_dept: "apbi",
				sections_id: "265",
				sections_avg: 89.29,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 89.3,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 89.38,
			},
			{
				sections_dept: "apbi",
				sections_id: "499",
				sections_avg: 89.5,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 89.62,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 89.71,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 89.83,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 89.89,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 89.95,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 90,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 90.2,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 90.22,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 90.29,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 90.33,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 90.47,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 90.7,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 90.71,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 91,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 91.29,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 91.43,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 91.81,
			},
			{
				sections_dept: "apbi",
				sections_id: "490",
				sections_avg: 91.86,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 92.24,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 92.59,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 92.74,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 93,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 94.1,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 94.17,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 94.94,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 95.05,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 95.94,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 95.95,
			},
			{
				sections_dept: "apsc",
				sections_id: "279",
				sections_avg: 96,
			},
		];
		const where = {
			IS: {
				sections_dept: "ap*",
			},
		};
		const whereNode = new WhereNode(where, "sections");
		expect(whereNode.evaluate(mockDataset)).to.have.length(mockDataset.length - 1);
	});
});
