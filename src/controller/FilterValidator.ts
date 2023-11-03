/**
 * Class to handle all the different filters for a query
 * Purpose is to break code up and have specific focuses in each class
 * Further, makes the recursive handling of the LComparator arrays much easier to handle
 */
export class FilterValidator {
	private dataSetID: string;
	/**
	 * Default constructor
	 */
	constructor(dataSetID: string) {
		this.dataSetID = dataSetID;
	}

	/**
	 * Method to determine the filter type and handle the validation accordingly
	 * @param filter
	 */
	public validateFilter(filter: any): boolean {
		if (typeof filter !== "object" || filter == null) {
			console.log("first if of ValidateFilter");
			return false;
		}
		const keys = Object.keys(filter);

		if (keys.length !== 1) {
			console.log("2nd if of ValidateFilter");
			return false;
		}
		const key = keys[0];

		switch (key) {
			case "AND":
				return this.validateLComparator(filter[key]);
			case "OR":
				return this.validateLComparator(filter[key]);
			case "GT":
				return this.validateMComparator(filter);
			case "LT":
				return this.validateMComparator(filter);
			case "EQ":
				return this.validateMComparator(filter);
			case "IS":
				return this.validateSComparator(filter);
			case "NOT":
				return this.validateNegation(filter[key]);
			case "GROUP":
				return this.isValidGroup(filter[key]);
			case "APPLY":
				return this.isValidApply(filter[key]);
			case "ORDER":
				return this.isValidSort(filter[key]);
			default:
				return false;
		}
	}

	// Validate LCOMPARATOR (AND, OR)
	private validateLComparator(filters: any[]): boolean {
		// first let's check if the filter is indeed an array as it has to be for LComparators
		if (!Array.isArray(filters)) {
			return false;
		}

		// The array needs to have a length of at least one
		if (filters.length < 1) {
			return false;
		}

		// Every filter in the array needs to be valid
		for (const filter of filters) {
			if (!this.validateFilter(filter)) {
				return false;
			}
		}
		return true;
	}

	// Validate MCOMPARATOR (GT, LT, EQ)
	// Citation: Used chat GPT to create innerFilter part so that MComparator works with Negation
	//           GPT suggested this fix, and I followed it
	private validateMComparator(filter: any): boolean {
		// CHECK if the filter is a valid object and not null
		const comparatorKey = Object.keys(filter)[0];
		const innerFilter = filter[comparatorKey];
		if (typeof innerFilter !== "object" || innerFilter === null) {
			return false;
		}
		// Check if the filter has EXACTLY one key-pair value
		const keys = Object.keys(innerFilter);
		if (keys.length !== 1) {
			return false;
		}

		const key = keys[0];
		const value = innerFilter[key];

		// Check if the key is a valid field
		// Will likely update based on Zach implementation
		if (!this.isValidField(key)) {
			return false;
		}

		// Ensure that type of value is numeric
		if (typeof value !== "number") {
			return false;
		}
		return true;
	}

	// FIRST PART BEFORE underscore is dynamic
	// Citation: Used ChatGPT to figure out how to write the syntax for map (`${this.dataSetID}_${suffix}`)
	private isValidField(field: string): boolean {
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
		return validFieldsCourses.includes(field) || validFieldsRooms.includes(field);
	}

	// Validate SCOMPARATOR (IS)
	// Citation: same as MComparator, used ChatGPT to get help on dealing with SComparator when it is in NOT filter,
	// 			 and it suggested the using this arrangement with innerFilter
	private validateSComparator(filter: any): boolean {
		const comparatorKey = Object.keys(filter)[0];
		const innerFilter = filter[comparatorKey];
		// Check if the filter is an object and not null, if either is false, return false
		if (typeof innerFilter !== "object" || innerFilter === null) {
			return false;
		}
		// Check if the filter has EXACTLY one key-pair value
		const keys = Object.keys(innerFilter);
		if (keys.length !== 1) {
			return false;
		}
		const key = keys[0];
		const value = innerFilter[key];

		// Check if the key is a valid field
		if (!this.isValidField(key)) {
			return false;
		}

		// Check if typeof value is a string
		if (typeof value !== "string") {
			return false;
		}

		// // Check if value is empty string
		// if (value === "") {
		// 	return false;
		// }

		// Check wildcard constraint
		if (!this.isValidWildCard(value)) {
			return false;
		}
		return true;
	}

	// Validate NEGATION (NOT)
	// Citation: same as MComparator, used ChatGPT to get help on dealing with validNegation,
	// 			 and it suggested the using this arrangement with innerFilter
	private validateNegation(filter: any): boolean {
		if (typeof filter !== "object" || filter === null) {
			return false;
		}
		// The NOT filter should have exactly one other filter inside it
		const keys = Object.keys(filter);
		if (keys.length !== 1) {
			return false;
		}
		// Validate the inner filter
		const innerFilterKey = keys[0];
		const innerFilterValue = filter[innerFilterKey];
		const fullFilter = {[innerFilterKey]: innerFilterValue};
		return this.validateFilter(fullFilter);
	}

	private isValidWildCard(value: string) {
		// Count the number of * in the string
		const count = (value.match(/\*/g) || []).length;
		// If there is more than two *, it is invalid
		if (count > 2) {
			return false;
		}
		// If there is 1 *, it should be at the start or end of the string
		if (count === 1 && value[0] !== "*" && value[value.length - 1] !== "*") {
			return false;
		}
		// If there are 2 *, they should be at the start and at the end of the string
		if (count === 2 && (value[0] !== "*" || value[value.length - 1] !== "*")) {
			return false;
		}
		return true;
	}

	// NEW METHODS FOR C2

	private isValidGroup(group: any[]): boolean {
		if (!Array.isArray(group)) {
			return false;
		}
		for (const key of group) {
			if (!this.isValidField(key)) {
				return false;
			}
		}
		return true;
	}

	private isValidApply(apply: any[]): boolean {
		if (!Array.isArray(apply)) {
			return false;
		}
		let applyKeys: string[] = [];
		for (const rule of apply) {
			const applyKey = Object.keys(rule)[0];
			if (applyKeys.includes(applyKey)) {
				return false; // duplicate key found
			}
			applyKeys.push(applyKey);

			const token = Object.keys(rule[applyKey])[0];
			const key = rule[applyKey][token];

			if (!["MAX", "MIN", "AVG", "COUNT", "SUM"].includes(token)) {
				return false;
			}
			if (["MAX", "MIN", "AVG", "SUM"].includes(token) && !this.isValidMField(key)) {
				return false;
			}
			if (token === "COUNT" && !this.isValidField(key)) {
				return false;
			}
		}
		return true;
	}

	private isValidSort(sort: any): boolean {
		if (typeof sort === "string") {
			return this.isValidField(sort);
		}

		if (typeof sort !== "object" || sort === null) {
			return false;
		}

		const direction = sort["dir"];
		const keys = sort["keys"];

		if (!["UP", "DOWN"].includes(direction)) {
			return false;
		}

		if (!Array.isArray(keys) || keys.length === 0) {
			return false;
		}

		for (const key of keys) {
			if (!this.isValidField(key)) {
				return false;
			}
		}
		return true;
	}

	private isValidMField(field: string): boolean {
		const validMFields = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
		return validMFields.includes(field.split("_")[1]);
	}
}
