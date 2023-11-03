import {InsightError} from "./IInsightFacade";

export class OptionNode {
	private columns: string[];
	private order: string | {dir: string; keys: string[]} | null;
	private dataSetID: string;
	private orderProvided: boolean;
	public group: string[] | null;
	public apply: any[] | null;

	/**
	 * Constructor the OptionNode class
	 * @param optionClause
	 * optionClause is the option clause from the query
	 */
	constructor(optionClause: any, dataSetID: string, groupClause?: any, applyClause?: any) {
		if (!optionClause.COLUMNS || !Array.isArray(optionClause.COLUMNS)) {
			throw new InsightError("OPTIONS needs to have a columns key with an array value: it does not right now");
		}
		if (!optionClause.COLUMNS.every((column: any) => typeof column === "string")) {
			throw new InsightError("All elements in COLUMNS must be strings");
		}
		this.dataSetID = dataSetID;
		this.columns = optionClause.COLUMNS;
		this.order = optionClause.ORDER || null;

		if (optionClause.ORDER) {
			if (typeof optionClause.ORDER === "string") {
				this.order = optionClause.ORDER;
			} else if (typeof optionClause.ORDER === "object" && optionClause.ORDER.dir && optionClause.ORDER.keys) {
				this.order = {
					dir: optionClause.ORDER.dir,
					keys: optionClause.ORDER.keys,
				};
			} else {
				this.order = null; // Set to null if ORDER is neither a string nor a valid object
			}
		} else {
			this.order = null;
		}
		this.orderProvided = "ORDER" in optionClause;
		this.group = groupClause || null;
		this.apply = applyClause || null;
		// console.log("Apply clause:", applyClause);
	}

	/**
	 * validation method for OptionNode
	 * @return boolean
	 * returns true if the COLUMNS and ORDER keys are valid, otherwise, return false
	 * CITATION: used ChatGPT to help plan logic out for grouping and extracting the TRANSFORMATION keys
	 */
	public validate(): boolean {
		return this.validateColumns() && this.validateOrder() && this.validateGroup() && this.validateApply();
	}

	private validateColumns(): boolean {
		for (let field of this.columns) {
			if (!this.isValidField(field)) {
				return false;
			}
		}
		return true;
	}

	private validateOrder(): boolean {
		if (this.order === null && this.orderProvided) {
			return false;
		}
		if (this.order !== null) {
			if (typeof this.order === "string") {
				if (!this.columns.includes(this.order)) {
					return false;
				}
			} else if (this.isOrderObject(this.order)) {
				if (this.order.dir !== "UP" && this.order.dir !== "DOWN") {
					return false;
				}
				for (let key of this.order.keys) {
					if (!this.columns.includes(key)) {
						return false;
					}
				}
			} else {
				return false; // Return false if ORDER is neither null, a string, nor a valid object
			}
		}
		return true;
	}

	private validateGroup(): boolean {
		if (this.group) {
			for (let field of this.group) {
				if (!this.columns.includes(field)) {
					return false;
				}
			}
			if (this.group.length === 0) {
				return false;
			}
		}
		return true;
	}

	private validateApply(): boolean {
		if (this.apply && this.apply.length === 0) {
			return false;
		}
		if ((this.group && !this.apply) || (this.apply && !this.group)) {
			return false;
		}
		if (this.apply) {
			for (let rule of this.apply) {
				const applyKey = Object.keys(rule)[0];
				if (!this.columns.includes(applyKey)) {
					// console.log("APPLY field not present in COLUMNS: returning false");
					return false;
				}
			}
			const applyKeys = this.apply.map((rule) => Object.keys(rule)[0]);
			const uniqueApplyKeys = [...new Set(applyKeys)];
			if (applyKeys.length !== uniqueApplyKeys.length) {
				// console.log("Duplicate apply keys detected: returning false");
				return false;
			}
			for (let rule of this.apply) {
				const applyRule = rule[Object.keys(rule)[0]];
				const operation = Object.keys(applyRule)[0];
				const key = applyRule[operation];
				if (["MAX", "MIN", "AVG", "SUM"].includes(operation) && !this.isNumericKey(key)) {
					// console.log("Non-numeric key used with a numeric operation: returning false");
					return false;
				}
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
	// Used ChatGPT for help with this method. Asked it to suggest methods that allow me to check if COLUMNS has correct
	// fields, and it suggested using Object.prototype.hasOwnProperty.call() method

	public evaluate(dataset: any[]): any[] {
		let results = dataset.map((entry) => {
			let filteredEntry: any = {};
			for (let column of this.columns) {
				const columnWithoutPrefix = this.removeDatasetIDPrefix(column);
				if (Object.prototype.hasOwnProperty.call(entry, columnWithoutPrefix)) {
					filteredEntry[column] = entry[columnWithoutPrefix];
				} else if (Object.prototype.hasOwnProperty.call(entry, column)) {
					filteredEntry[column] = entry[column];
				}
			}
			return filteredEntry;
		});
		const order = this.order;
		if (order && typeof order === "string") {
			const orderKey = order;
			results.sort((a, b) => {
				if (typeof a[orderKey] === "string") {
					if (a[orderKey] < b[orderKey]) {
						return -1;
					}
					if (a[orderKey] > b[orderKey]) {
						return 1;
					}
					return 0;
				} else {
					return a[orderKey] - b[orderKey];
				}
			});
		}
		if (order && this.isOrderObject(order)) {
			const direction = order.dir === "UP" ? 1 : -1;
			results.sort((a, b) => {
				for (let key of order.keys) {
					if (a[key] < b[key]) {
						return -1 * direction;
					}
					if (a[key] > b[key]) {
						return 1 * direction;
					}
				}
				return 0;
			});
		}
		return results;
	}

	// Ciation: Used GPT to help debug this function because it was returning false when Queries had TRANSFORMATION
	private isValidField(field: string): boolean {
		// console.log("Checking field:", field);

		const validSuffixesCourses = [
			"uuid",
			"id",
			"title",
			"instructor",
			"dept",
			"year",
			"avg",
			"pass",
			"fail",
			"audit",
		];
		const validSuffixesRooms = [
			"fullname",
			"shortname",
			"number",
			"name",
			"address",
			"type",
			"furniture",
			"href",
			"lat",
			"lon",
			"seats",
		];
		const validFieldsCourses = validSuffixesCourses.map((suffix) => `${this.dataSetID}_${suffix}`);
		const validFieldsRooms = validSuffixesRooms.map((suffix) => `${this.dataSetID}_${suffix}`);

		// Check if the field is a predefined valid field for courses or rooms
		if (validFieldsCourses.includes(field) || validFieldsRooms.includes(field)) {
			// console.log("Field is a valid predefined field:", field);
			return true;
		}
		// Check if the field is present in the apply array (if it exists)
		if (this.apply) {
			const applyKeys = this.apply.map((rule) => Object.keys(rule)[0]);
			// console.log("Apply keys:", applyKeys);  // Debugging statement
			if (applyKeys.includes(field)) {
				// console.log("Field is a valid apply field:", field);
				return true;
			}
		}
		// console.log("Field is not valid:", field);
		return false;
	}

	private removeDatasetIDPrefix(field: string): string {
		return field.split("_")[1];
	}

	private isOrderObject(
		order: string | {dir: string; keys: string[]} | null
	): order is {dir: string; keys: string[]} {
		return order !== null && typeof order === "object" && "dir" in order && "keys" in order;
	}

	public getFields(): string[] {
		return this.columns;
	}

	private isNumericKey(key: string): boolean {
		const numericKeys = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
		return numericKeys.includes(this.removeDatasetIDPrefix(key));
	}
}
