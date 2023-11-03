import {InsightDatasetKind, InsightError, InsightResult} from "./IInsightFacade";
import {WhereNode} from "./WhereNode";
import {OptionNode} from "./OptionNode";
import {DataSet, DatasetElement} from "./DataSet";
import {GroupingProcessor} from "./GroupingProcessor";
import {ApplyProcessor} from "./ApplyProcessor";

/**
 * High level represents of a query
 * Class will delegate the validation and evaluation of the WHERE and OPTIONS clauses to the WhereNode and OptionNode
 * classes respectively.
 * performQuery in InsightFacade.ts will use the QueryNode, specifically, the validate and evaluate methods, to perform
 * a query and return the results.
 */
export class QueryNode {
	private whereNode: WhereNode;
	private optionNode: OptionNode;
	private dataSetID: string;

	/**
	 * The constructor for the QueryNode class
	 * Takes in a query as a parameter
	 * NOTES: right now, optionNode will throw it's own error, whereas I am relying on queryNode to catch WhereNode
	 * error, as the constructor for WhereNode does not throw an error
	 */
	constructor(query: any, dataSetID: string) {
		if (!query.WHERE || !query.OPTIONS) {
			throw new InsightError("Query must contain both a WHERE and an OPTIONS clause");
		}
		this.dataSetID = dataSetID;
		this.whereNode = new WhereNode(query.WHERE, this.dataSetID);
		this.optionNode = new OptionNode(query.OPTIONS, this.dataSetID
			, query.TRANSFORMATIONS?.GROUP, query.TRANSFORMATIONS?.APPLY);
	}

	/**
	 * validation method, used to ensure that both the WHERE and OPTION blocks of the query object are correct
	 * Invokes the whereNode classes validate method and the optionNode classes validate method.
	 * If both are valid, will return true
	 * else, it will return false
	 */
	public validate(): boolean {
		return this.whereNode.validate() && this.optionNode.validate();
	}

	/**
	 * Method to evaluate the dataset
	 * @param dataset[]
	 * Evaluates the query against a given dataset: filters the data using the whereNode and processes the node using
	 * the optionNode
	 */

	public evaluate(dataset: DataSet): InsightResult[] {
		const filteredResults = this.whereNode.evaluate(dataset.section);
		console.log("filtered result is", filteredResults);
		// If GROUP and APPLY clauses are provided, we will process them
		if (this.optionNode.group && this.optionNode.apply) {
			const groupingProcessor = new GroupingProcessor(filteredResults, this.optionNode.group);
			const groupedData = groupingProcessor.groupByKeys();

			const applyProcessor = new ApplyProcessor(groupedData, this.optionNode.apply, this.optionNode.group);
			const appliedData = applyProcessor.processApplyRules();

			// Convert Map to Array for further processing
			const processedResults = Array.from(appliedData.values());
			return this.optionNode.evaluate(processedResults);
		}
		return this.optionNode.evaluate(filteredResults);
	}
}


