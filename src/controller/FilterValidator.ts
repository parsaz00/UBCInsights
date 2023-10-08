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
			return false;
		}
		const keys = Object.keys(filter);

		if (keys.length !== 1) {
			return false;
		}
		const key = keys[0];

		switch (key) {
			case "AND":
				return this.validateLComparator(filter[key]);
			case "OR":
				return this.validateLComparator(filter[key]);
			case "GT":
				return this.validateMComparator(filter[key]);
			case "LT":
				return this.validateMComparator(filter[key]);
			case "EQ":
				return this.validateMComparator(filter[key]);
			case "IS":
				return this.validateSComparator(filter[key]);
			case "NOT":
				return this.validateNegation(filter[key]);
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
		if (filters.length < 2) {
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
	private validateMComparator(filter: any): boolean {
		// CHECK if the filter is a valid object and not null
		if (typeof filter !== "object" || filter === null) {
			return false;
		}
		// Check if the filter has EXACTLY one key-pair value
		const keys = Object.keys(filter);
		if (keys.length !== 1) {
			return false;
		}

		const key = keys[0];
		const value = filter[key];

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
	private isValidField(field: string): boolean {
		const validSuffixes = ["uuid", "id", "title", "instructor", "dept", "year", "avg", "pass", "fail", "audit"];
		const validFields = validSuffixes.map((suffix) => `${this.dataSetID}_${suffix}`);
		return validFields.includes(field);
	}

	// Validate SCOMPARATOR (IS)
	private validateSComparator(filter: any): boolean {
		// Check if the filter is an object and not null, if either is false, return false
		if (typeof filter !== "object" || filter === null) {
			return false;
		}
		// Check if the filter has EXACTLY one key-pair value
		const keys = Object.keys(filter);
		if (keys.length !== 1) {
			return false;
		}
		const key = keys[0];
		const value = filter[key];

		// Check if the key is a valid field
		// Will likely update based on Zach implementation
		if (!this.isValidField(key)) {
			return false;
		}

		// Check if typeof value is a string
		if (typeof value !== "string") {
			return false;
		}

		// Check wildcard constraint
		if (!this.isValidWildCard(value)) {
			return false;
		}
		return true;
	}

	// Validate NEGATION (NOT)
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
		return this.validateFilter(filter);
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
}
