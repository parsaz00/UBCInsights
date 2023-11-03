import {InsightDatasetKind, InsightError} from "./IInsightFacade";

export class DataSet {
	public id: string;
	public section: DatasetElement[];
	public kind: InsightDatasetKind;
	public numRows: number;

	constructor(datasetID: string, section: DatasetElement[], setkind: InsightDatasetKind, NoR: number) {
		this.id = datasetID;
		this.section = section;
		this.kind = setkind;
		this.numRows = NoR;
	}
}

export class DataSetManager {
	public map: Map<string, DataSet>;

	constructor() {
		this.map = new Map<string, DataSet>();
	}

	public static extractDatasetIDFromQuery(query: any): string | null {
		let datasetID = this.extractFromWhere(query);
		if (datasetID) {
			return datasetID;
		}
		return this.extractFromOptions(query);
	}

	// Citation: Chat GPT used to help create the logic and implementation for this method and extractFromOptions
	public static extractFromWhere(query: any): string | null {
		if (query && query.WHERE) {
			for (let condition in query.WHERE) {
				const value = query.WHERE[condition];
				if (typeof value === "object" && !Array.isArray(value)) {
					const field = Object.keys(value)[0];
					const parts = field.split("_");
					if (parts.length > 1) {
						return parts[0];
					}
					if (condition === "NOT") {
						return this.extractDatasetIDFromQuery({WHERE: value});
					}
				} else if (Array.isArray(value)) {
					for (let subCondition of value) {
						const id = this.extractDatasetIDFromQuery({WHERE: subCondition});
						if (id) {
							return id;
						}
					}
				}
			}
		}
		return null;
	}

	public static extractFromOptions(query: any): string | null {
		if (query && query.OPTIONS && query.OPTIONS.COLUMNS) {
			for (let column of query.OPTIONS.COLUMNS) {
				const parts = column.split("_");
				if (parts.length > 1) {
					return parts[0];
				}
			}
		}
		return null;
	}

	public static getDataSetID(query: any): string {
		return DataSetManager.extractDatasetIDFromQuery(query) || "";
	}

	public static getDataset(dataSetID: string, map: Map<string, DataSet>): DataSet {
		const dataset = map.get(dataSetID);
		if (!dataset) {
			throw new InsightError(`Dataset was not found for ID: ${dataSetID}`);
		}
		return dataset;
	}

	public static validateAgainstSchema(jsonData: any, schema: any): boolean {
		const {properties, required} = schema;
		for (const key of required) {
			if (!(key in jsonData)) {
				return false; // Required property is missing
			}
			const propertySchema = properties[key];
			const isTypeMismatch =
				(propertySchema.type === "string" && typeof jsonData[key] !== "string") ||
				(propertySchema.type === "number" && typeof jsonData[key] !== "number");
			if (isTypeMismatch) {
				return false;
			}
		}
		return true; // Validation passed
	}

	public static identifierSwitch(obj: any): DatasetSection {
		let year: number;
		year = (obj.Section === "overall") ? 1900 : Number(obj.Year);
		return new DatasetSection(String(obj.id) || "", obj.Course || "", obj.Title || "",
			obj.Professor || "", obj.Subject || "", year || 0, obj.Avg || 0,
			obj.Pass || 0, obj.Fail || 0, obj.Audit || 0);
	}

}
export class DatasetElement {}
export class DatasetSection extends DatasetElement {
	public uuid: string;
	public id: string;
	public title: string;
	public instructor: string;
	public dept: string;
	public year: number;
	public avg: number;
	public pass: number;
	public fail: number;
	public audit: number;

	constructor(
		uuid: string,
		id: string,
		title: string,
		instructor: string,
		dept: string,
		year: number,
		avg: number,
		pass: number,
		fail: number,
		audit: number
	) {
		super();
		this.uuid = uuid;
		this.id = id;
		this.title = title;
		this.instructor = instructor;
		this.dept = dept;
		this.year = year;
		this.avg = avg;
		this.pass = pass;
		this.fail = fail;
		this.audit = audit;
	}
}

export class DatasetRoom extends DatasetElement {
	public fullname: string;
	public shortname: string;
	public number: string;
	public name: string;
	public address: string;
	public lat: number;
	public lon: number;
	public seats: number;
	public type: string;
	public furniture: string;
	public href: number;

	constructor(
		fullname: string,
		shortname: string,
		number: string,
		name: string,
		address: string,
		lat: number,
		lon: number,
		seats: number,
		type: string,
		furniture: string,
		href: number
	) {
		super();
		this.fullname = fullname;
		this.shortname = shortname;
		this.number = number;
		this.name = name;
		this.address = address;
		this.lat = lat;
		this.lon = lon;
		this.seats = seats;
		this.type = type;
		this.furniture = furniture;
		this.href = href;
	}
}

export class TempSection {
	public id: string;
	public Course: string;
	public Title: string;
	public Professor: string;
	public Subject: string;
	public Year: number;
	public Avg: number;
	public Pass: number;
	public Fail: number;
	public Audit: number;
	public Section: string;

	constructor(
		id: string,
		Course: string,
		Title: string,
		Professor: string,
		Subject: string,
		Year: number,
		Avg: number,
		Pass: number,
		Fail: number,
		Audit: number,
		Section: string
	) {
		this.id = id;
		this.Course = Course;
		this.Title = Title;
		this.Professor = Professor;
		this.Subject = Subject;
		this.Year = Year;
		this.Avg = Avg;
		this.Pass = Pass;
		this.Fail = Fail;
		this.Audit = Audit;
		this.Section = Section;
	}
}
