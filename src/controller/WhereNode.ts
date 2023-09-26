import {InsightError} from "./IInsightFacade";

export class WhereNode {
	private filter: any;

	/**
	 * constructor for WhereNode class
	 * will throw an InsightError if the WHERE is not a valid JSON object,
	 * If there is no where clause, it means we don't have one and so all entries match
	 * @param whereClause
	 */
	constructor(whereClause: any) {
		if (typeof whereClause !== "object" || whereClause === null) {
			throw new InsightError("WHERE clause must be a valid JSON object, and it is currently not");
		}
		// check if the WHERE clause is empty, in which case, filter matches all results
		if (Object.keys(whereClause).length === 0) {
			this.filter = null;
		} else {
			this.filter = whereClause;
		}
	}

	/**
	 * Validation method to ensure that the WHERE clause is correct
	 * Need to recursively check for nested logic comparisons: MComparison,SComparison, and negations also need
	 * to be validated
	 * If where clause is valid, return true, otherwise return false
	 * @return boolean
	 */

	public validate(): boolean {
		// if filter is null, we
		return true;
	}

	/**
	 * Method to evaluate and filter the dataset
	 * It will be filtered based on logic comparison and(or) MComparison, SComparison, and negation
	 * Returns the filtered dataset
	 * @param dataset
	 * @return any[]
	 */

	public evaluate(dataset: any[]): any[] {
		// stub
		return [];
	}
}
