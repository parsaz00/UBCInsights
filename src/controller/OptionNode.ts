import {InsightError} from "./IInsightFacade";

export class OptionNode {
	private columns: string[];
	private order: string | null;
	private dataSetID: string;

	/**
	 * Constructor the OptionNode class
	 * @param optionClause
	 * optionClause is the option clause from the query
	 */
	constructor(optionClause: any, dataSetID: string) {
		if (!optionClause.COLUMNS || !Array.isArray(optionClause.COLUMNS)) {
			throw new InsightError("OPTIONS needs to have a columns key with an array value: it does not right now");
		}
		if (!optionClause.COLUMNS.every((column: any) => typeof column === "string")) {
			throw new InsightError("All elements in COLUMNS must be strings");
		}
		this.dataSetID = dataSetID;
		this.columns = optionClause.COLUMNS;
		this.order = optionClause.ORDER || null;
	}

	/**
	 * validation method for OptionNode
	 * @return boolean
	 * returns true if the COLUMNS and ORDER keys are valid, otherwise, return false
	 */

	public validate(): boolean {
		// Check first if all fields in COLUMN are valid
		for (let field of this.columns) {
			if (!this.isValidField(field)) {
				return false;
			}
		}
		// ORDER has to be a string and it has to exists in COLUMNS
		if (this.order !== null) {
			if (typeof this.order !== "string" || !this.columns.includes(this.order)) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Method that will process the dataset based on the OPTIONS clause
	 * Will organize the data based on it, and return an array containing the results
	 * @param dataset the dataset to organize
	 * @return any[] the organized dataset
	 */

	public evaluate(dataset: any[]): any[] {
		let results = dataset.map((entry) => {
			let filteredEntry: any = {};
			for (let column of this.columns) {
				if (Object.prototype.hasOwnProperty.call(entry, column)) {
					filteredEntry[column] = entry[column];
				}
			}
			return filteredEntry;
		});

		// Now we can order the results:
		if (this.order) {
			results.sort((a, b) => {
				// Using type assertion to ensure TypeScript knows the type
				const orderKey = this.order as string;

				if (typeof a[orderKey] === "string") {
					return a[orderKey].localeCompare(b[orderKey]);
				} else {
					return a[orderKey] - b[orderKey];
				}
			});
		}

		return results;
	}

	private isValidField(field: string) {
		const validSuffixes = ["uuid", "id", "title", "instructor", "dept", "year", "avg", "pass", "fail", "audit"];
		const validFields = validSuffixes.map((suffix) => `${this.dataSetID}_${suffix}`);
		return validFields.includes(field);
	}
}
