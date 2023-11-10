import {expect} from "chai";
import "chai-as-promised";
import {GroupingProcessor} from "../src/controller/GroupingProcessor";
import {InsightError} from "../src/controller/IInsightFacade";

describe("test suite for GroupingProcessor", function () {
	let dataset: any[];
	let groupKeys: any[];

	beforeEach(function () {
		// Sample dataset for testing
		dataset = [
			{id: 1, dept: "CS", course: "310"},
			{id: 2, dept: "CS", course: "310"},
			{id: 3, dept: "MATH", course: "200"},
		];
		groupKeys = ["dept", "course"];
	});

	it("Should group dataset by given keys", function () {
		const processor = new GroupingProcessor(dataset, groupKeys);
		const result = processor.groupByKeys();
		expect(result.get("CS_310")?.length).to.equal(2);
		expect(result.get("MATH_200")?.length).to.equal(1);
	});

	it("Should return empty map for empty dataset", function () {
		const processor = new GroupingProcessor([], groupKeys);
		const result = processor.groupByKeys();
		expect(result.size).to.equal(0);
	});

	it("Should handle dataset with no matching group keys", function () {
		const processor = new GroupingProcessor(dataset, ["nonexistentKey"]);
		expect(() => processor.groupByKeys()).to.throw(InsightError, "Invalid group key: nonexistentKey");
	});

	it("Should group by single key", function () {
		const singleKey = ["dept"];
		const processor = new GroupingProcessor(dataset, singleKey);
		const result = processor.groupByKeys();
		expect(result.get("CS")?.length).to.equal(2);
		expect(result.get("MATH")?.length).to.equal(1);
	});
	it("Should group records with same group key values but different other values", function () {
		const extendedDataset = [...dataset, {id: 4, dept: "CS", course: "310", instructor: "John"}];
		const processor = new GroupingProcessor(extendedDataset, groupKeys);
		const result = processor.groupByKeys();
		expect(result.get("CS_310")?.length).to.equal(3);
	});

	it("Should throw error for mixed valid and invalid group keys", function () {
		const mixedKeys = ["dept", "nonexistentKey"];
		const processor = new GroupingProcessor(dataset, mixedKeys);
		expect(() => processor.groupByKeys()).to.throw(InsightError, "Invalid group key: nonexistentKey");
	});

	it("Should group duplicate dataset records correctly", function () {
		const duplicateDataset = [...dataset, {id: 1, dept: "CS", course: "310"}];
		const processor = new GroupingProcessor(duplicateDataset, groupKeys);
		const result = processor.groupByKeys();
		expect(result.get("CS_310")?.length).to.equal(3);
	});

	it("Should handle empty group keys", function () {
		const processor = new GroupingProcessor(dataset, []);
		const result = processor.groupByKeys();
		expect(result.size).to.equal(3); // Each record becomes its own group
	});

	it("Should throw error for dataset records missing some group keys", function () {
		const incompleteDataset = [
			{id: 1, dept: "CS"},
			{id: 2, course: "310"},
			{id: 3, dept: "MATH", course: "200"},
		];
		const processor = new GroupingProcessor(incompleteDataset, groupKeys);
		expect(() => processor.groupByKeys()).to.throw(InsightError); // The error message can be more specific if needed
	});
});
