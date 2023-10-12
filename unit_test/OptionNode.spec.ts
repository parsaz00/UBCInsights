import {expect} from "chai";
import "chai-as-promised";
import {InsightDatasetKind, InsightError} from "../src/controller/IInsightFacade";
import {OptionNode} from "../src/controller/OptionNode";
import {DataSet, Section} from "../src/controller/DataSet";

describe("Test suite for the OptionNode class", function () {
	describe("Constructor Tests for OptionNode", function () {
		it("should init with valid COLUMNS and no ORDER", function () {
			const option = {COLUMNS: ["sections_avg", "sections_dept"]};
			!expect(() => new OptionNode(option, "sections")).to.not.throw();
		});
		it("should init with valid COLUMNs and valid ORDER", function () {
			const option = {
				COLUMNS: ["sections_avg", "sections_dept"],
				ORDER: "sections_avg",
			};
			expect(() => new OptionNode(option, "sections")).to.not.throw();
		});
		it("should throw an InsightError if COLUMNS key is missing", function () {
			const option = {ORDER: "sections_avg"};
			expect(() => new OptionNode(option, "sections")).to.throw(InsightError);
		});
		it("should throw an InsightError if COLUMNS key is NOT an array", function () {
			const option = {COLUMNS: "sections_avg", ORDER: "sections_avg"};
			expect(() => new OptionNode(option, "sections")).to.throw(InsightError);
		});
		it("should throw an InsightError if any of the elements in COLUMNS is not a string", function () {
			const option = {COLUMNS: ["sections_avg", 92]};
			expect(() => new OptionNode(option, "sections")).to.throw(InsightError);
		});
	});

	describe("tests for OptionNodeValidate", function () {
		it("should return true if COLUMNS contains valid fields and no ORDER is specified", function () {
			const option = {COLUMNS: ["sections_avg", "sections_dept"]};
			const optionNode = new OptionNode(option, "sections");
			expect(optionNode.validate()).to.be.true;
		});
		it("should return true if COLUMNS contains valid fields and ORDER is present", function () {
			const option = {
				COLUMNS: ["sections_avg", "sections_dept"],
				ORDER: "sections_avg",
			};
			const optionNode = new OptionNode(option, "sections");
			expect(optionNode.validate()).to.be.true;
		});
		it("should return true for the following: ", function () {
			const option = {
				COLUMNS: [
					"sections_dept",
					"sections_id",
					"sections_avg"
				],
				ORDER: "sections_avg"
			};
			const tempNode = new OptionNode(option, "sections");
			const result = tempNode.validate();
			expect(result).to.be.true;
		});
		it("should return false if the COLUMNS contains fields that are NOT present in the dataset", function () {
			const option = {COLUMNS: ["sections_avg", "invalid_field"]};
			const optionNode = new OptionNode(option, "sections");
			expect(optionNode.validate()).to.be.false;
		});
		it("should return false if the ORDER is not one of the COLUMNS fields", function () {
			const option = {
				COLUMNS: ["sections_avg", "sections_dept"],
				ORDER: "sections_instructor",
			};
			const optionNode = new OptionNode(option, "sections");
			expect(optionNode.validate()).to.be.false;
		});
		it("should return false if ORDER is not a string", function () {
			const option = {
				COLUMNS: ["sections_avg", "sections_dept"],
				ORDER: 195,
			};
			const optionNode = new OptionNode(option, "sections");
			expect(optionNode.validate()).to.be.false;
		});
	});

	describe("tests for OptionNode evaluate method", function () {
		it("should return dataset as is (in OG form) when only COLUMNS is provided", function () {
			const dataset: Section[] = [
				{
					uuid: "someUUID1",
					id: "someID1",
					title: "someTitle1",
					instructor: "someInstructor1",
					dept: "math",
					year: 2021,
					avg: 85,
					pass: 90,
					fail: 5,
					audit: 0
				},
				{
					uuid: "someUUID1",
					id: "someID1",
					title: "someTitle1",
					instructor: "someInstructor1",
					dept: "cpsc",
					year: 2021,
					avg: 95,
					pass: 90,
					fail: 5,
					audit: 0
				},
				{
					uuid: "someUUID1",
					id: "someID1",
					title: "someTitle1",
					instructor: "someInstructor1",
					dept: "bio",
					year: 2021,
					avg: 75,
					pass: 90,
					fail: 5,
					audit: 0
				}
			];
			const datasetObject: DataSet = {
				id: "sections",
				section: dataset,
				kind: InsightDatasetKind.Sections,
				numRows: dataset.length
			};
			const option = {COLUMNS: ["sections_avg", "sections_dept"]};
			const optionNode = new OptionNode(option, "sections");
			const result = optionNode.evaluate(dataset);
			const expected = [
				{
					sections_avg: 85,
					sections_dept: "math"
				},
				{
					sections_avg: 95,
					sections_dept: "cpsc"
				},
				{
					sections_avg: 75,
					sections_dept: "bio"
				}
			];
			expect(result).to.deep.equal(expected);
		});
		it("should return dataset organized by order when COLUMNS and ORDER is provided", function () {
			const dataset: Section[] = [
				{
					uuid: "someUUID1",
					id: "someID1",
					title: "someTitle1",
					instructor: "someInstructor1",
					dept: "math",
					year: 2021,
					avg: 85,
					pass: 90,
					fail: 5,
					audit: 0
				},
				{
					uuid: "someUUID1",
					id: "someID1",
					title: "someTitle1",
					instructor: "someInstructor1",
					dept: "cpsc",
					year: 2021,
					avg: 95,
					pass: 90,
					fail: 5,
					audit: 0
				},
				{
					uuid: "someUUID1",
					id: "someID1",
					title: "someTitle1",
					instructor: "someInstructor1",
					dept: "bio",
					year: 2021,
					avg: 75,
					pass: 90,
					fail: 5,
					audit: 0
				}
			];
			const datasetObject: DataSet = {
				id: "sections",
				section: dataset,
				kind: InsightDatasetKind.Sections,
				numRows: dataset.length
			};
			const option = {
				COLUMNS: ["sections_avg", "sections_dept"],
				ORDER: "sections_avg",
			};
			const optionNode = new OptionNode(option, "sections");
			const result = optionNode.evaluate(dataset);
			const expected = [
				{
					sections_avg: 75,
					sections_dept: "bio"
				},
				{
					sections_avg: 85,
					sections_dept: "math"
				},
				{
					sections_avg: 95,
					sections_dept: "cpsc"
				}
			];
			expect(result).to.deep.equal(expected);
		});
		it("should return an empty array when the dataset is empty", function () {
			const mockDataset: any[] = [];
			const option = {
				COLUMNS: ["sections_avg", "sections_dept"],
				ORDER: "sections_avg",
			};
			const optionNode = new OptionNode(option, "sections");
			const result = optionNode.evaluate(mockDataset);
			expect(result).to.deep.equal([]);
		});
		it("should correctly sort the dataset if there are duplicate values for the ORDER field", function () {
			const dataset: Section[] = [
				{
					uuid: "someUUID1",
					id: "someID1",
					title: "someTitle1",
					instructor: "someInstructor1",
					dept: "math",
					year: 2021,
					avg: 85,
					pass: 90,
					fail: 5,
					audit: 0
				},
				{
					uuid: "someUUID1",
					id: "someID1",
					title: "someTitle1",
					instructor: "someInstructor1",
					dept: "cpsc",
					year: 2021,
					avg: 85,
					pass: 90,
					fail: 5,
					audit: 0
				},
				{
					uuid: "someUUID1",
					id: "someID1",
					title: "someTitle1",
					instructor: "someInstructor1",
					dept: "bio",
					year: 2021,
					avg: 75,
					pass: 90,
					fail: 5,
					audit: 0
				}
			];
			const datasetObject: DataSet = {
				id: "sections",
				section: dataset,
				kind: InsightDatasetKind.Sections,
				numRows: dataset.length
			};
			const option = {COLUMNS: ["sections_avg", "sections_dept"], ORDER: "sections_avg"};
			const optionNode = new OptionNode(option, "sections");
			const result = optionNode.evaluate(dataset);
			expect(result).to.deep.equal([
				{sections_avg: 75, sections_dept: "bio"},
				{sections_avg: 85, sections_dept: "math"},
				{sections_avg: 85, sections_dept: "cpsc"},
			]);
		});
	});
});
