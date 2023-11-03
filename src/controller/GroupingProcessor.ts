// CITATION: ChatGPT was used to help with big-picture logic and structure of this class

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
