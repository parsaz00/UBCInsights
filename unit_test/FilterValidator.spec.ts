import {expect} from "chai";
import {FilterValidator} from "../src/controller/FilterValidator";

describe("test suite for filter validator", function () {
	const datasetID = "sections";
	const filterValidator = new FilterValidator(datasetID);
	describe("validateFilterTests for MComparators", function () {
		it("should return true for a valid GT filter", function () {
			const filter = {GT: {sections_avg: 90}};
			expect(filterValidator.validateFilter(filter)).to.be.true;
		});
		it("should return false for an invalid GT filter with non-numeric value", function () {
			const filter = {GT: {sections_avg: "invalid"}};
			expect(filterValidator.validateFilter(filter)).to.be.false;
		});
		it("should return true for a valid LT filter", function () {
			const filter = {LT: {sections_avg: 90}};
			expect(filterValidator.validateFilter(filter)).to.be.true;
		});
		it("should return false for an invalid LT filter with non-numeric value", function () {
			const filter = {LT: {sections_avg: "invalid"}};
			expect(filterValidator.validateFilter(filter)).to.be.false;
		});
		it("should return true for a valid EQ filter", function () {
			const filter = {EQ: {sections_avg: 90}};
			expect(filterValidator.validateFilter(filter)).to.be.true;
		});
		it("should return false for an invalid EQ filter with non-numeric value", function () {
			const filter = {EQ: {sections_avg: "invalid"}};
			expect(filterValidator.validateFilter(filter)).to.be.false;
		});
	});
	describe("validateFilter tests for IS comparator", function () {
		it("it should return true for a valid IS comparator", function () {
			const filter = {IS: {sections_dept: "cpsc"}};
			expect(filterValidator.validateFilter(filter)).to.be.true;
		});
		it("should return false for IS comparator that is NOT a string", function () {
			const filter = {IS: {sections_dept: 100}};
			expect(filterValidator.validateFilter(filter)).to.be.false;
		});
		it("should return true for a valid IS comparator wildcard at the start", function () {
			const filter = {IS: {sections_instructor: "*s"}};
			expect(filterValidator.validateFilter(filter)).to.be.true;
		});
		it("should return true for a valid IS comparator wildcard at the end", function () {
			const filter = {IS: {sections_dept: "c*"}};
			expect(filterValidator.validateFilter(filter)).to.be.true;
		});
		it("should return true for a valid IS comparator wild at start and end", function () {
			const filter = {IS: {sections_dept: "*cpsc*"}};
			expect(filterValidator.validateFilter(filter)).to.be.true;
		});
		it("should return false for an INVALID is comparator wildcard in middle of string", function () {
			const filter = {IS: {sections_dept: "cp*sc"}};
			expect(filterValidator.validateFilter(filter)).to.be.false;
		});
	});
	describe("validateFilter tests for LComparators", function () {
		it("should return true for a valid AND logic filter with multiple filters inside", function () {
			const filter = {
				AND: [{GT: {sections_avg: 92}}, {IS: {sections_dept: "cpsc"}}],
			};
			expect(filterValidator.validateFilter(filter)).to.be.true;
		});
		it("should return true for a valid OR logic filter with multiple filters inside", function () {
			const filter = {
				OR: [{GT: {sections_avg: 95}}, {LT: {sections_avg: 52}}],
			};
			expect(filterValidator.validateFilter(filter)).to.be.true;
		});
		it("should return true for a valid AND filter with nested logic", function () {
			const filter = {
				AND: [
					{GT: {sections_avg: 95}},
					{
						OR: [
							{EQ: {sections_avg: 91}},
							{
								AND: [{GT: {sections_avg: 85}}, {IS: {sections_dept: "math"}}],
							},
						],
					},
				],
			};
			expect(filterValidator.validateFilter(filter)).to.be.true;
		});
		it("should return true for a valid OR filter with nested logic", function () {
			const filter = {
				OR: [
					{GT: {sections_avg: 93}},
					{
						AND: [{EQ: {sections_avg: 85}}, {IS: {sections_title: "*c"}}],
					},
				],
			};
			expect(filterValidator.validateFilter(filter)).to.be.true;
		});
		it("should return false for an invalid AND filter with non-array value", function () {
			const filter = {AND: {sections_avg: 91}};
			expect(filterValidator.validateFilter(filter)).to.be.false;
		});
		it("should return false for an invalid OR filter with non-array value", function () {
			const filter = {OR: {sections_dept: "cpsc"}};
			expect(filterValidator.validateFilter(filter)).to.be.false;
		});
		it("should return false for an invalid OR filter with an empty array value", function () {
			const filter = {AND: []};
			expect(filterValidator.validateFilter(filter)).to.be.false;
		});
		it("should return false for an invalid AND filter with an empty array value", function () {
			const filter = {OR: []};
			expect(filterValidator.validateFilter(filter)).to.be.false;
		});
		it("should return false for an invalid AND filter with one array value", function () {
			const filter = {AND: [{GT: {sections_avg: 92}}]};
			expect(filterValidator.validateFilter(filter)).to.be.false;
		});
		it("should return false for an invalid OR filter with one array value", function () {
			const filter = {OR: [{GT: {sections_avg: 61}}]};
			expect(filterValidator.validateFilter(filter)).to.be.false;
		});
	});
	describe("validateFilter tests for NOT/negation", function () {
		it("should return true for a valid NOT filter", function () {
			const filer = {
				NOT: {
					GT: {sections_avg: 65},
				},
			};
			expect(filterValidator.validateFilter(filer)).to.be.true;
		});
		it("should return false for a NOT filter with NO filters", function () {
			const filter = {
				NOT: {},
			};
			expect(filterValidator.validateFilter(filter)).to.be.false;
		});
		it("should return false if there is an issue with the filter itself for NOT", function () {
			const filter = {
				NOT: {GT: {sections_avg: "invalidString"}},
			};
			expect(filterValidator.validateFilter(filter)).to.be.false;
		});
	});
});
