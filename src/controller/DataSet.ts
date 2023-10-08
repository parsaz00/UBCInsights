import {InsightDatasetKind} from "./IInsightFacade";

export class DataSet {
	public id: string;
	public section: Section[];
	public kind: InsightDatasetKind;
	public numRows: number;

	constructor(datasetID: string, section: Section[], setkind: InsightDatasetKind, NoR: number) {
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
}

export class Section {
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
		Audit: number
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
	}
}
