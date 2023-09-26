import {expect} from "chai";
import "chai-as-promised";
import {InsightError} from "../../src/controller/IInsightFacade";
import {QueryNode} from "../../src/controller/QueryNode";

describe("QueryNode unit tests and validation tests", function () {
	it("should throw an InsightError if there is NO WHERE CLAUSE", function () {
		const query = {
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: "sections_avg"
			}
		};
		expect(() => new QueryNode(query)).to.throw(InsightError);
	});

	it("should throw an InsightError if there is no OPTIONS clause", function () {
		const query = {
			WHERE: {
				GT: {
					sections_avg: 97
				}
			}
		};
		expect(() => new QueryNode(query)).to.throw(InsightError);
	});

	it("should validate a correct query and return true", function () {
		const query = {
			WHERE: {
				GT: {
					sections_avg: 97
				}
			},
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: "sections_avg"
			}
		};
		const result = new QueryNode(query);
		expect(result.validate()).to.be.true;
	});
});
