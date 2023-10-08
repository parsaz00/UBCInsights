import {InsightError, ResultTooLargeError} from "./IInsightFacade";
import {FilterValidator} from "./FilterValidator";

// Sources used:
// 1. ChatGPT and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty
// 		used for Object.prototype.hasOwnProperty.call() method in private helper methods for evaluate
//		ChatGPT recommend this method, and the linked website was used to read and understand the method
export class WhereNode {
	private filter: any;
	private filterValidator: FilterValidator;
	private dataSetID: string;

	/**
	 * constructor for WhereNode class
	 * will throw an InsightError if the WHERE is not a valid JSON object,
	 * If there is no where clause, it means we don't have one and so all entries match
	 * @param whereClause
	 * @param dataSetID
	 */
	constructor(whereClause: any, dataSetID: string) {
		if (typeof whereClause !== "object" || whereClause === null) {
			throw new InsightError("WHERE clause must be a valid JSON object, and it is currently not");
		}
		// check if the WHERE clause is empty, in which case, filter matches all results
		if (Object.keys(whereClause).length === 0) {
			this.filter = null;
		} else {
			this.filter = whereClause;
		}
		this.dataSetID = dataSetID; // Initialize the dataSetID member
		this.filterValidator = new FilterValidator(this.dataSetID); // Initialize the FilterValidator with the dataSetID
	}

	/**
	 * Validation method to ensure that the WHERE clause is correct
	 * Need to recursively check for nested logic comparisons: MComparison,SComparison, and negations also need
	 * to be validated
	 * If where clause is valid, return true, otherwise return false
	 * @return boolean
	 */

	public validate(): boolean {
		// Base Case: if the filter is null, it means we don't have one, and so we will return all the results
		if (this.filter === null) {
			console.log("null filter was returned");
			return true;
		}

		// Use the FilterValidator to validate the filter
		return this.filterValidator.validateFilter(this.filter);
	}

	/**
	 * Method to evaluate and filter the dataset
	 * It will be filtered based on logic comparison and(or) MComparison, SComparison, and negation
	 * Returns the filtered dataset
	 * @param dataset
	 * @return any[]
	 */

	public evaluate(dataset: any[]): any[] {
		// Base Case: if the filter is null, we return the entire dataset
		if (this.filter === null) {
			return dataset;
		}

		// declare variable that will hold the filtered results
		let filteredResult: any[] = [];
		const filterKey = Object.keys(this.filter)[0];
		const filterValue = this.filter[filterKey];

		// switch case to handle the different types of filters
		switch (filterKey) {
			case "GT":
				filteredResult = this.evaluateGT(filterValue, dataset);
				break;
			case "LT":
				filteredResult = this.evaluateLT(filterValue, dataset);
				break;
			case "EQ":
				filteredResult = this.evaluateEQ(filterValue, dataset);
				break;
			case "IS":
				filteredResult = this.evaluateIS(filterValue, dataset);
				break;
			case "AND":
				filteredResult = this.evaluateAND(filterValue, dataset);
				break;
			case "OR":
				filteredResult = this.evaluateOR(filterValue, dataset);
				break;
			case "NOT":
				filteredResult = this.evaluateNOT(filterValue, dataset);
				break;
			default:
				return [];
		}
		if (filteredResult.length > 5000) {
			throw new ResultTooLargeError("More than 5000 results found");
		}
		return filteredResult;
	}

	private evaluateGT(filterValue: any, dataset: any[]) {
		// First, we need to obtain both the field and the value of the GT filter
		const field = Object.keys(filterValue)[0];
		const value = filterValue[field];

		// Filter the results
		const filteredResults = dataset.filter((entry) => {
			// Ensure the field exists in the entry and its value is greater than the specified value
			return Object.prototype.hasOwnProperty.call(entry, field) && entry[field] > value;
		});
		return filteredResults;
	}
	private evaluateLT(filterValue: any, dataset: any[]) {
		// First, we need to obtain both the field and the value of the GT filter
		const field = Object.keys(filterValue)[0];
		const value = filterValue[field];

		// Filter the results
		const filteredResults = dataset.filter((entry) => {
			// Ensure the field exists in the entry and its value is greater than the specified value
			return Object.prototype.hasOwnProperty.call(entry, field) && entry[field] < value;
		});

		return filteredResults;
	}

	private evaluateEQ(filterValue: any, dataset: any[]) {
		// First, we need to obtain both the field and the value of the GT filter
		const field = Object.keys(filterValue)[0];
		const value = filterValue[field];

		// Filter the results
		const filteredResults = dataset.filter((entry) => {
			// Ensure the field exists in the entry and its value is greater than the specified value
			return Object.prototype.hasOwnProperty.call(entry, field) && entry[field] === value;
		});

		return filteredResults;
	}

	private evaluateIS(filterValue: any, dataset: any[]) {
		const field = Object.keys(filterValue)[0];
		const value = filterValue[field];

		// First let's check wildcards
		const startsWithWildCard = value.startsWith("*");
		const endsWithWildCard = value.endsWith("*");

		// Remove wildcards for comparison
		const newValue = value.replace(/^\*|\*$/g, "");

		return dataset.filter((entry) => {
			// Ensure the field exists in the entry
			if (!Object.prototype.hasOwnProperty.call(entry, field)) {
				return false;
			}
			const entryValue = entry[field];

			// EXACT MATCH
			if (!startsWithWildCard && !endsWithWildCard) {
				return entryValue === newValue;
			}

			// Starts with match
			if (!startsWithWildCard && endsWithWildCard) {
				return entryValue.startsWith(newValue);
			}

			// Ends with match
			if (startsWithWildCard && !endsWithWildCard) {
				return entryValue.endsWith(newValue);
			}
			// Contains
			if (startsWithWildCard && endsWithWildCard) {
				return entryValue.includes(newValue);
			}
			return false;
		});
	}

	private evaluateAND(filterValue: any, dataset: any[]) {
		let currentResults = dataset;

		for (let filter of filterValue) {
			const whereNode = new WhereNode(filter, this.dataSetID);
			currentResults = whereNode.evaluate(currentResults);
		}

		return currentResults;
	}

	/**
	 *
	 * @param filterValue
	 * @param dataset
	 * @private
	 * Create an empty array that will hold the results that match ANY of the filers
	 * Iterate over every single filter value in the array for OR
	 * For every filter in the OR[], create a new WhereNode which will be used to evaluate the filter against the OG
	 * dataset
	 * At the end: merge the results of each evaluation of the filter into the array we init at the start,  no dups
	 */
	private evaluateOR(filterValue: any, dataset: any[]) {
		let orFilterResult: any[] = [];
		for (let filter of filterValue) {
			const whereNode = new WhereNode(filter, this.dataSetID);
			const filteredResults = whereNode.evaluate(dataset);

			// merge all the results, ensuring no dups
			for (let result of filteredResults) {
				if (!orFilterResult.includes(result)) {
					orFilterResult.push(result);
				}
			}
		}
		return orFilterResult;
	}

	/**
	 *
	 * @param filterValue
	 * @param dataset
	 * @private
	 * Let's iterate over all the dataset, store everything that matches the filter, iterate over the dataset again
	 * and add everything that isn't in the filteredResult
	 */
	private evaluateNOT(filterValue: any, dataset: any[]) {
		const whereNode = new WhereNode(filterValue, this.dataSetID);
		const filteredResults = whereNode.evaluate(dataset);
		let notFilteredResults: any[] = [];
		for (let entry of dataset) {
			if (!filteredResults.includes(entry)) {
				notFilteredResults.push(entry);
			}
		}
		return notFilteredResults;
	}
}
