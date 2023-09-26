import {InsightError} from "./IInsightFacade";

export class OptionNode {
	private columns: string[];
	private order: string | null;

	/**
	 * Constructor the OptionNode class
	 * @param optionClause
	 * optionClause is the option clause from the query
	 */
	constructor(optionClause: any) {
		if (!optionClause.COLUMNS || !Array.isArray(optionClause.COLUMNS)) {
			throw new InsightError("OPTIONS needs to have a columns key with an array value: it does not right now");
		}
		this.columns = optionClause.COLUMNS;
		this.order = optionClause.ORDER || null;
	}

	/**
	 * validation method for OptionNode
	 * @return boolean
	 * returns true if the COLUMNS and ORDER keys are valid, otherwise, return false
	 */

	public validate(): boolean {
		// stub
		return true;
	}

	/**
	 * Method that will process the dataset based on the OPTIONS clause
	 * Will organize the data based on it, and return an array containing the results
	 * @param dataset the dataset to organize
	 * @return any[] the organized dataset
	 */

	public evaluate(dataset: any[]): any[] {
		// stub
		return [];
	}
}
