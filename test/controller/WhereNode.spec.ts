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
		const whereNode = new WhereNode(where);
		expect(whereNode.validate()).to.be.true;
	});

	it("should reject a where clause that is NOT an object", function () {
		const where = "invalid";
		expect(() => new WhereNode(where)).to.throw(InsightError);
	});

	it("should reject a where clause that is NOT an object, specifically NULL", function () {
		expect(() => new WhereNode(null)).to.throw(InsightError);
	});
	describe("nested WhereNode tests for MComparators that are valid and validate function", function () {

		it("should validate a correct GT comparison", function () {
			const where = {GT: {courses_avg: 90}};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.true;
		});
		it("should validate a correct LT comparison", function () {
			const where = {LT: {courses_avg: 54}};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.true;
		});
		it("should validate a correct EQ comparison", function () {
			const where = {EQ: {courses_avg: 85}};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.true;
		});
	});
	describe("nested WhereNode tests for MComparators that are INVALID and validate function", function () {
		it("should reject a GT comparison that isn't a numeric value", function () {
			const where = {GT: {courses_avg: "string"}};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.false;
		});
		it("should reject a LT comparison that isn't a numeric value", function () {
			const where = {LT: {courses_avg: "string"}};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.false;
		});
		it("should reject a EQ comparison that isn't a numeric value", function () {
			const where = {EQ: {courses_avg: "string"}};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.false;
		});
		it("should reject a GT comparison with a missing key", function () {
			const where = {GT: {}};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.false;
		});
		it("should reject a LT comparison with a missing key", function () {
			const where = {LT: {}};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.false;
		});
		it("should reject a EQ comparison with a missing key", function () {
			const where = {EQ: {}};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.false;
		});
		it("should reject an MComparator with an INVALID MComparator", function () {
			const where = {INVALID_MCOMPARATOR: {courses_avg: 97}};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.false;
		});
		it("should reject an MComparator with an INVALID key", function () {
			const where = {
				EQ: {
					invalid_key: 97
				}
			};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.false;
		});
	});
	describe("nested WhereNode tests for LComparators and validate function", function () {
		it("should return true for the validate function for a valid AND comparator", function () {
			const where = {
				AND: [
					{GT: {courses_avg: 90}},
					{LT: {courses_avg: 95}}
				]
			};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.true;
		});
		it("should return true for the validate function for a valid OR comparator", function () {
			const where = {
				OR: [
					{GT: {courses_avg: 95}},
					{LT: {courses_avg: 62}},
				]
			};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.true;
		});
		it("should return true for the validate function for nested OR and AND comparator", function () {
			const where = {
				AND: [
					{GT: {courses_avg: 92}},
					{
						OR: [
							{EQ: {courses_avg: 85}},
							{LT: {courses_avg: 71}}
						]
					}
				]
			};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.true;
		});
		it("should reject an AND comparator and return false for an AND comparator with non-array value",
			function () {
				const where = {AND: {courses_avg: 90}};
				const whereNode = new WhereNode(where);
				expect(whereNode.validate()).to.be.false;
			});
		it("should reject an OR comparator and return false for an OR comparator with non-array value",
			function () {
				const where = {OR: {courses_avg: 90}};
				const whereNode = new WhereNode(where);
				expect(whereNode.validate()).to.be.false;
			});
		it("should reject an AND comparator and return false when the AND array is empty", function () {
			const where = {
				AND: []
			};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.false;
		});
		it("should reject an OR comparator and return false when the OR array is empty", function () {
			const where = {
				OR: []
			};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.false;
		});
		it("should reject an INVALID logic comparator and return false", function () {
			const where = {
				INVALID_LCOMPARATOR: [
					{courses_avg: 90},
					{courses_avg: 84}
				]
			};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.false;
		});
	});
	describe("tests to validate for IS comparators, testing the WhereNode validate function", function () {
		it("should accept and return true for a valid IS comparison with a string", function () {
			const where = {IS: {courses_dept: "cpsc"}};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.true;
		});
		it("should accept and return true for a valid wildcard AT START comparison", function () {
			const where = {IS: {courses_instructor: "*smith"}};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.true;
		});
		it("should accept and return true for a valid wildcard AT END comparison", function () {
			const where = {IS: {courses_title: "intro*"}};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.true;
		});
		it("should accept and return true for a valid wildcard AT START and END comparison", function () {
			const where = {IS: {courses_title: "*intro*"}};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.true;
		});
	});
	describe("tests to check for invalid IS comparisons", function () {
		it("should reject and return false for a IS comparison that is not a string", function (){
			const where = {IS: {courses_avg: 90}};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.false;
		});
		it("should reject and return false for a IS comparison that has invalid wildcard form", function() {
			const where = {IS: {courses_title: "*ma*t*h*"}};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.false;
		});
		it("should reject and return false for a IS comparison with an invalid key", function () {
			const where = {IS: {invalid_key: "cpsc"}};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.false;
		});
	});
	describe("WhereNode validate functions for Negation", function () {
		it("should validate and return true for a NOT comparison with GT that is valid", function () {
			const where = {
				NOT: {
					GT: {courses_avg: 60}
				}
			};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.true;
		});
		it("should validate and return true for a NOT comparsion with IS that is valid", function () {
			const where = {
				IS: {
					NOT: {courses_dept: "cpsc"}
				}
			};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.true;
		});
		it ("should validate and return true for a NOT nested in a NOT", function () {
			const where = {
				NOT : {
					NOT: {
						IS: {courses_dept: "cpsc"}
					}
				}
			};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.true;
		});
		it("should reject and return false for a NOT with an non object", function () {
			const where = {NOT: "invalid_object"};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.false;
		});
		it ("should reject and return false for a NOT with an empty object", function () {
			const where = {NOT: {}};
			const whereNode = new WhereNode(where);
			expect(whereNode.validate()).to.be.false;
		});
		it ("should reject a NOT with MULTIPLE FILTERS", function () {
			const where = {
				NOT: {
					GT: {
						courses_avg: 90
					},
					IS : {
						courses_dept: "cpsc"
					}
				}
			};
			const whereNode = new WhereNode(where);
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
		const whereNode = new WhereNode({});
		const result = whereNode.evaluate(mockDataSet);
		expect(result).to.have.lengthOf(mockDataSet.length);
	});
	it ("Should filter and only return courses with an average greater than 90", function () {
		let mockDataSet = [
			{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
			{courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
			{courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
		];
		const where = {
			GT: {courses_avg: 95}
		};
		const whereNode = new WhereNode(where);
		const result = whereNode.evaluate(mockDataSet);
		expect(result).to.have.lengthOf(1);
	});
	it ("Should filter and only return courses with an average less than 90", function () {
		let mockDataSet = [
			{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
			{courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
			{courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
		];
		const where = {
			LT: {
				courses_avg: 90
			}
		};
		const whereNode = new WhereNode(where);
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
				courses_avg: 99
			}
		};
		const whereNode = new WhereNode(where);
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
				courses_avg: 95
			}
		};
		const whereNode = new WhereNode(where);
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
				courses_dept: "cpsc"
			}
		};
		const whereNode = new WhereNode(where);
		const result = whereNode.evaluate(mockDataSet);
		expect(result).to.have.lengthOf(1);
	});
	it("should filter and only return course with instructor smith based on wildcard at start",
		function () {
			let mockDataSet = [
				{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
				{courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
				{courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
			];
			const where = {
				IS: {
					courses_instructor: "*smith"
				}
			};
			const whereNode = new WhereNode(where);
			const result = whereNode.evaluate(mockDataSet);
			expect(result).to.have.lengthOf(1);
		});
	it("should filter and return two items (math and cpsc course) based on *s wildcard", function () {
		let mockDataSet = [
			{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
			{courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
			{courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
		];
		const where = {
			IS: {
				courses_instructor: "*s"
			}
		};
		const whereNode = new WhereNode(where);
		const result = whereNode.evaluate(mockDataSet);
		expect(result).to.have.lengthOf(2);
	});
	// Logic Comparisons
	it("should filter and return only the CPSC course as it is in the cpsc dept AND have avg above 86",
		function () {
			let mockDataSet = [
				{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
				{courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
				{courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
			];
			const where = {
				AND: [
					{GT: {courses_avg: 86}},
					{IS: {courses_dept: "cpsc"}}
				]
			};
			const whereNode = new WhereNode(where);
			const result = whereNode.evaluate(mockDataSet);
			expect(result).to.lengthOf(1);
		});
	it("should filter and return only the CPSC course as it is in the cpsc dept AND have avg above 80",
		function () {
			let mockDataSet = [
				{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
				{courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
				{courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
			];
			const where = {
				AND: [
					{GT: {courses_avg: 80}},
					{IS: {courses_dept: "cpsc"}}
				]
			};
			const whereNode = new WhereNode(where);
			const result = whereNode.evaluate(mockDataSet);
			expect(result).to.lengthOf(1);
		});
	it("should filter and return only the math and cpwc course as it is in the cpsc dept or have avg above 84",
		function () {
			let mockDataSet = [
				{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
				{courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
				{courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
			];
			const where = {
				OR: [
					{GT: {courses_avg: 84}},
					{IS: {courses_dept: "math"}}
				]
			};
			const whereNode = new WhereNode(where);
			const result = whereNode.evaluate(mockDataSet);
			expect(result).to.lengthOf(2);
		});
	it("should filter and return the math and bio course based on NOT comparison", function () {
		let mockDataSet = [
			{courses_avg: 95, courses_dept: "cpsc", courses_instructor: "smith"},
			{courses_avg: 85, courses_dept: "math", courses_instructor: "jones"},
			{courses_avg: 75, courses_dept: "bio", courses_instructor: "brown"},
		];
		const where = {
			NOT: {
				GT: {courses_avg: 86}
			}
		};
		const whereNode = new WhereNode(where);
		const result = whereNode.evaluate(mockDataSet);
		expect(result).to.have.lengthOf(2);
	});
});
