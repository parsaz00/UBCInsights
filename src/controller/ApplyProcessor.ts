import {InsightError} from "./IInsightFacade";
import Decimal from "decimal.js";

// CITATION: ChatGPT was used to help with big-picture logic and structure of this class
// ApplyProcessor class: Used to process APPLY rules on grouped data
export class ApplyProcessor {
	private groupedData: Map<string, any[]>; // each key represents a unique combo of group key values
	private applyRules: any[]; // Array of apply rules extracted from query. Each rule specifies aggregation op on a key
	private groupKeys: string[];

	/**
	 * CONSTRUCTOR
	 * @param {Map} groupedData : The grouped data obtain from the GroupingProcessor
	 * @param {Array} applyRules: The apply rules obtained from the query
	 */
	constructor(groupedData: Map<string, any[]>, applyRules: any[], groupKeys: string[]) {
		this.groupedData = groupedData;
		this.applyRules = applyRules;
		this.groupKeys = groupKeys;
	}

	/**
	 * Function that will process the apply rules on the grouped data
	 * @returns {Map}: Returns a Map where each key is a unique combination of group key values
	 * and each value is an object with the aggregated data based on the apply rules
	 * For each group of records: calculates the aggregated result based on apply rules
	 * Extracts grouped files from group jye by splitting the key on "_"
	 * Determines the aggregation op for each apply rule and calls corresponding method to perform op
	 */
	public processApplyRules(): Map<string, any> {
		const result = new Map<string, any[]>();

		this.groupedData.forEach((group, groupKey) => {
			const aggregatedResult: any = {};

			// Extract the grouped fields from the groupKey
			const groupKeyValues = groupKey.split("_");

			this.groupKeys.forEach((key: string, index: number) => {
				if (index < groupKeyValues.length) {
					// Ensure we don't go out of bounds
					aggregatedResult[key] = groupKeyValues[index];
				}
			});

			this.applyRules.forEach((applyRule) => {
				const applyKey = Object.keys(applyRule)[0];
				const token = Object.keys(applyRule[applyKey])[0];
				const key = applyRule[applyKey][token];

				switch (token) {
					case "MAX":
						aggregatedResult[applyKey] = this.max(group, key);
						break;
					case "MIN":
						aggregatedResult[applyKey] = this.min(group, key);
						break;
					case "AVG":
						aggregatedResult[applyKey] = this.avg(group, key);
						break;
					case "COUNT":
						aggregatedResult[applyKey] = this.count(group, key);
						break;
					case "SUM":
						aggregatedResult[applyKey] = this.sum(group, key);
						break;
				}
			});
			result.set(groupKey, aggregatedResult);
		});
		return result;
	}

	/**
	 * Calculate the maximum value of a key in a group
	 * @param {Array} group : The group of records
	 * @param {string} key : The key to be aggregated
	 * @returns {number} : The maximum value
	 */
	private max(group: any[], key: string): number {
		const strippedKey = this.stripDatasetID(key);
		if (!Object.prototype.hasOwnProperty.call(group[0], strippedKey) || typeof group[0][strippedKey] !== "number") {
			throw new InsightError(`Invalid key for MAX operation: ${key}`);
		}
		return Math.max(...group.map((record) => record[strippedKey]));
	}
	/**
	 * Calculate the maximum value of a key in a group
	 * @param {Array} group : The group of records
	 * @param {string} key : The key to be aggregated
	 * @returns {number} : The minimum value
	 */

	private min(group: any[], key: string): number {
		const strippedKey = this.stripDatasetID(key);
		if (!Object.prototype.hasOwnProperty.call(group[0], strippedKey) || typeof group[0][strippedKey] !== "number") {
			throw new InsightError(`Invalid key for MIN operation: ${key}`);
		}
		return Math.min(...group.map((record) => record[strippedKey]));
	}
	/**
	 * Calculate the maximum value of a key in a group
	 * @param {Array} group : The group of records
	 * @param {string} key : The key to be aggregated
	 * @returns {number} : The avg value
	 */

	private avg(group: any[], key: string): number {
		const strippedKey = this.stripDatasetID(key);
		if (!Object.prototype.hasOwnProperty.call(group[0], strippedKey) || typeof group[0][strippedKey] !== "number") {
			throw new InsightError(`Invalid key for AVG operation: ${key}`);
		}

		// Convert each value to a Decimal and sum them up
		let total = new Decimal(0);
		group.forEach((record) => {
			total = total.add(new Decimal(record[strippedKey]));
		});

		// Calculate the average
		const numRows = group.length;
		let avg = total.toNumber() / numRows;

		// Round the average to the second decimal digit
		return Number(avg.toFixed(2));
	}

	/**
	 * Count the values
	 * @param {Array} group : The group of records
	 * @param {string} key : The key to be aggregated
	 * @returns {number} : The count
	 */
	private count(group: any[], key: string): number {
		const strippedKey = this.stripDatasetID(key);
		if (!Object.prototype.hasOwnProperty.call(group[0], strippedKey)) {
			throw new InsightError(`Key does not exist in the dataset: ${key}`);
		}
		const uniqueValues = new Set(group.map((record) => record[strippedKey]));
		return uniqueValues.size;
	}

	/**
	 * Calculate the sum value
	 * @param {Array} group : The group of records
	 * @param {string} key : The key to be aggregated
	 * @returns {number} : The sum value
	 */
	private sum(group: any[], key: string): number {
		const strippedKey = this.stripDatasetID(key);
		if (!Object.prototype.hasOwnProperty.call(group[0], strippedKey) || typeof group[0][strippedKey] !== "number") {
			throw new InsightError(`Invalid key for SUM operation: ${key}`);
		}
		const sum = group.reduce((acc, record) => acc + record[strippedKey], 0);
		return parseFloat(sum.toFixed(2));
	}

	// Based on data structure used to store data, we need to remove the dataset id then perform ops
	private stripDatasetID(key: string): string {
		const parts = key.split("_");
		if (parts.length > 1) {
			parts.shift();
			return parts.join("_");
		}
		return key;
	}
}
