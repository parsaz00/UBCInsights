// import {InsightError} from "./IInsightFacade";
//
// export class GroupingProcessor {
// 	// NEED TO UPDATE BASED ON ACTUAL STRUCUTRE and types Zehao uses
// 	private dataset: any[];
// 	private groupKeys: any[];
// 	private groupedData: Map<string, any[]>;
// 	/**
// 	 * Constructor
// 	 * @param {Array} dataset : The dataset for which we need to perform the grouping process
// 	 * @param {Array} groupKeys : The keys that will inform how the dataset will be grouped
// 	 */
// 	constructor(dataset: any[], groupKeys: any[]) {
// 		this.dataset = dataset;
// 		this.groupKeys = groupKeys;
// 		this.groupedData = new Map();
// 	}
//
// 	/**
// 	 * Function that will group the dataset based on the provided groupKeys
// 	 * @returns {Map} : Returns a Map where each key is will be a unique combination of group key values and
// 	 * 					each value is an array of records that will match the specific combination
// 	 */
// 	public groupByKeys() {
// 		if (this.dataset.length == 0) {
// 			return this.groupedData;
// 		}
//
// 		for (const key of this.groupKeys) {
// 			if (!this.dataset[0].hasOwnProperty(key)) {
// 				throw new InsightError(`Invalid group key: ${key}`);
// 			}
// 		}
//
// 		for (const [index, record] of this.dataset.entries()) {
// 			// 1. Extract the values of the group keys
// 			const groupValues: any[] = this.groupKeys.map(key => {
// 				const strippedKey = key.replace(/^sections_/, ''); // strip the 'sections_' prefix
// 				return record[strippedKey];
// 			});
//
// 			// 2. Convert combo of values into a string
// 			let groupString = groupValues.join("_");
//
// 			// If groupKeys is empty, use the index as the groupString
// 			if (this.groupKeys.length === 0) {
// 				groupString = index.toString();
// 			}
//
// 			// 3. Check if combo exists in groupData map structure
// 			if (this.groupedData.has(groupString)) {
// 				// 4. If it exists, push the current record to the corresponding array
// 				this.groupedData.get(groupString)!.push(record);
// 			} else {
// 				// 5. If it does not exist, create a new array for this combo and push the current record
// 				this.groupedData.set(groupString, [record]);
// 			}
// 		}
//
// 		return this.groupedData;
// 	}
//
// }
import {InsightError} from "./IInsightFacade";

export class GroupingProcessor {
	private dataset: any[];
	private groupKeys: any[];
	private groupedData: Map<string, any[]>;

	constructor(dataset: any[], groupKeys: any[]) {
		this.dataset = dataset;
		this.groupKeys = groupKeys;
		this.groupedData = new Map();
	}

	public groupByKeys(): Map<string, any[]> {
		if (this.dataset.length === 0) {
			return this.groupedData;
		}

		for (const key of this.groupKeys) {
			const strippedKey = this.stripPrefix(key);
			if (!Object.prototype.hasOwnProperty.call(this.dataset[0], strippedKey)) {
				// console.log(`DEBUG: Stripped key is ${strippedKey}, original key was ${key}`);
				// console.log("DEBUG: First record in dataset:", this.dataset[0]);
				throw new InsightError(`Invalid group key: ${key}`);
			}
		}

		for (const [index, record] of this.dataset.entries()) {
			const groupValues: any[] = this.groupKeys.map((key) => {
				const strippedKey = this.stripPrefix(key);
				return record[strippedKey];
			});

			let groupString = groupValues.join("_");
			if (this.groupKeys.length === 0) {
				groupString = index.toString();
			}

			if (this.groupedData.has(groupString)) {
				const groupArray = this.groupedData.get(groupString);
				if (groupArray) {
					groupArray.push(record);
				}
			} else {
				this.groupedData.set(groupString, [record]);
			}
		}

		return this.groupedData;
	}

	private stripPrefix(key: string): string {
		const parts = key.split("_");
		if (parts.length > 1) {
			parts.shift();
			return parts.join("_");
		}
		return key;
	}
}


