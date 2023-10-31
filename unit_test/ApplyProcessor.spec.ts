import {expect} from "chai";
import "chai-as-promised";
import {GroupingProcessor} from "../src/controller/GroupingProcessor";
import {InsightError} from "../src/controller/IInsightFacade";
import {ApplyProcessor} from "../src/controller/ApplyProcessor";

describe("Test suite for ApplyProcessor", function () {
	let groupedData: Map<string, any[]>;
	let applyRules: any[];

	beforeEach(function () {
		// Sample grouped data for testing
		groupedData = new Map([
			["CS_310", [
				{ "id": 1, "dept": "CS", "course": "310", "avg": 90 },
				{ "id": 2, "dept": "CS", "course": "310", "avg": 85 }
			]],
			["MATH_200", [
				{ "id": 3, "dept": "MATH", "course": "200", "avg": 75 }
			]]
		]);
	});

	it("Should calculate MAX correctly", function () {
		applyRules = [{ "maxAvg": { "MAX": "avg" } }];
		const processor = new ApplyProcessor(groupedData, applyRules);
		const result = processor.processApplyRules();
		expect(result.get("CS_310")?.maxAvg).to.equal(90);
		expect(result.get("MATH_200")?.maxAvg).to.equal(75);
	});

	it("Should calculate MIN correctly", function () {
		applyRules = [{ "minAvg": { "MIN": "avg" } }];
		const processor = new ApplyProcessor(groupedData, applyRules);
		const result = processor.processApplyRules();
		expect(result.get("CS_310")?.minAvg).to.equal(85);
		expect(result.get("MATH_200")?.minAvg).to.equal(75);
	});

	it("Should calculate AVG correctly", function () {
		applyRules = [{ "avgValue": { "AVG": "avg" } }];
		const processor = new ApplyProcessor(groupedData, applyRules);
		const result = processor.processApplyRules();
		expect(result.get("CS_310")?.avgValue).to.equal(87.5);
		expect(result.get("MATH_200")?.avgValue).to.equal(75);
	});

	it("Should calculate COUNT correctly", function () {
		applyRules = [{ "countDept": { "COUNT": "dept" } }];
		const processor = new ApplyProcessor(groupedData, applyRules);
		const result = processor.processApplyRules();
		expect(result.get("CS_310")?.countDept).to.equal(1); // Only 1 unique "CS" value
		expect(result.get("MATH_200")?.countDept).to.equal(1);
	});

	it("Should calculate SUM correctly", function () {
		applyRules = [{ "sumAvg": { "SUM": "avg" } }];
		const processor = new ApplyProcessor(groupedData, applyRules);
		const result = processor.processApplyRules();
		expect(result.get("CS_310")?.sumAvg).to.equal(175); // 90 + 85
		expect(result.get("MATH_200")?.sumAvg).to.equal(75);
	});
	it("Should handle empty grouped data", function () {
		applyRules = [{ "maxAvg": { "MAX": "avg" } }];
		const processor = new ApplyProcessor(new Map(), applyRules);
		const result = processor.processApplyRules();
		expect(result.size).to.equal(0);
	});

	it("Should handle multiple apply rules", function () {
		applyRules = [
			{ "maxAvg": { "MAX": "avg" } },
			{ "minAvg": { "MIN": "avg" } }
		];
		const processor = new ApplyProcessor(groupedData, applyRules);
		const result = processor.processApplyRules();
		expect(result.get("CS_310")?.maxAvg).to.equal(90);
		expect(result.get("CS_310")?.minAvg).to.equal(85);
	});

	it("Should handle non-numeric keys for COUNT", function () {
		applyRules = [{ "countDept": { "COUNT": "dept" } }];
		const processor = new ApplyProcessor(groupedData, applyRules);
		const result = processor.processApplyRules();
		expect(result.get("CS_310")?.countDept).to.equal(1); // Only 1 unique "CS" value
	});

	it("Should throw error for non-numeric keys for MAX", function () {
		applyRules = [{ "maxDept": { "MAX": "dept" } }];
		const processor = new ApplyProcessor(groupedData, applyRules);
		expect(() => processor.processApplyRules()).to.throw(Error, "Invalid key for MAX operation");
	});

	it("Should handle groups with a single record", function () {
		applyRules = [{ "avgValue": { "AVG": "avg" } }];
		const singleGroupData = new Map([
			["MATH_200", [{ "id": 3, "dept": "MATH", "course": "200", "avg": 75 }]]
		]);
		const processor = new ApplyProcessor(singleGroupData, applyRules);
		const result = processor.processApplyRules();
		expect(result.get("MATH_200")?.avgValue).to.equal(75);
	});

	it("Should handle non-existent keys gracefully", function () {
		applyRules = [{ "maxNonExistent": { "MAX": "nonExistentKey" } }];
		const processor = new ApplyProcessor(groupedData, applyRules);
		expect(() => processor.processApplyRules()).to.throw(InsightError
			, "Invalid key for MAX operation: nonExistentKey");
	});
});
