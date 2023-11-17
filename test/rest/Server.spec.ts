import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import {expect} from "chai";
import request, {Response} from "supertest";
import {InsightDatasetKind} from "../../src/controller/IInsightFacade";
import * as fs from "fs";
import {clearDisk} from "../TestUtil";

describe("Facade D3", function () {

	let facade: InsightFacade;
	let server: Server;

	before(async function () {
		facade = new InsightFacade();
		server = new Server(4321);
		await server.start();
	});

	after(async function () {
		await server.stop();
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what is going on
		console.info(`Starting Test: ${this.currentTest?.title}`);
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what is going on
		console.info(`Finished Test: ${this.currentTest?.title}`);
		clearDisk();
	});

	// Sample on how to format PUT requests

	// it("PUT test for courses dataset", function () {
	// 	try {
	// 		return request(SERVER_URL)
	// 			.put(ENDPOINT_URL)
	// 			.send(ZIP_FILE_DATA)
	// 			.set("Content-Type", "application/x-zip-compressed")
	// 			.then(function (res: Response) {
	// 				// some logging here please!
	// 				expect(res.status).to.be.equal(200);
	// 			})
	// 			.catch(function (err) {
	// 				// some logging here please!
	// 				expect.fail();
	// 			});
	// 	} catch (err) {
	// 		// and some more logging here!
	// 	}
	// });

	describe("Server PUT /dataset/:id/:kind", function () {
		const SERVER_URL = "http://localhost:4321";

		it("should add a sections dataset correctly and successfully", async function () {
			const datasetId = `id-${new Date().getTime()}`; // Temporary unique ID for each test
			const datasetKind = InsightDatasetKind.Sections;
			const datasetConent = fs.readFileSync("test/resources/archives/pair.zip");

			const result = await request(SERVER_URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(datasetConent)
				.set("Content-Type", "application/x-zip-compressed");

			expect(result.status).to.be.equal(200);
			expect(result.body.result).to.include(datasetId);
		});
		it("should add a rooms dataset correctly and successfully", async function () {
			const datasetId = `id-${new Date().getTime()}`; // Temporary unique ID for each test
			const datasetKind = InsightDatasetKind.Rooms;
			const datasetConent = fs.readFileSync("test/resources/archives/campus.zip");

			const result = await request(SERVER_URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(datasetConent)
				.set("Content-Type", "application/x-zip-compressed");

			expect(result.status).to.be.equal(200);
			expect(result.body.result).to.include(datasetId);
		});
		it("should reject adding a dataset with an underscore", async function () {
			const invalidId = "invalid_id";
			const datasetKind = InsightDatasetKind.Sections;
			const datasetContent = fs.readFileSync("test/resources/archives/pair.zip");

			const result = await request(SERVER_URL)
				.put(`/dataset/${invalidId}/${datasetKind}`)
				.send(datasetContent)
				.set("Content-Type", "application/x-zip-compressed");
			expect(result.status).to.be.equal(400);
		});
		it("should reject unsupported dataset kind", async function () {
			const datasetId = "id5";
			const unsupportedKind = "unsupported_kind";
			const datasetContent = fs.readFileSync("test/resources/archives/pair.zip");

			const result = await request(SERVER_URL)
				.put(`/dataset/${datasetId}/${unsupportedKind}`)
				.send(datasetContent)
				.set("Content-Type", "application/x-zip-compressed");

			expect(result.status).to.be.equal(400);
		});
		it("should reject duplicate dataset", async function () {
			const datasetId = "id6";
			const datasetKind = InsightDatasetKind.Sections;
			const datasetContent = fs.readFileSync("test/resources/archives/pair.zip");

			// First attempt (should succeed)
			await request(SERVER_URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(datasetContent)
				.set("Content-Type", "application/x-zip-compressed");

			// Second attempt (should fail)
			const result = await request(SERVER_URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(datasetContent)
				.set("Content-Type", "application/x-zip-compressed");

			expect(result.status).to.be.equal(400);
		});
		it("should reject invalid dataset file", async function () {
			const datasetId = "id7";
			const datasetKind = InsightDatasetKind.Sections;
			const invalidDatasetContent = Buffer.from("This is not a valid zip file");

			const result = await request(SERVER_URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(invalidDatasetContent)
				.set("Content-Type", "application/x-zip-compressed");

			expect(result.status).to.be.equal(400);
		});
	});

	describe("Server DELETE /dataset/:id ", function () {
		const SERVER_URL = "http://localhost:4321";

		it("should delete a dataset correctly and responsd with success", async function () {
			// Add dataset
			const datasetId = `id-${new Date().getTime()}`;
			const datasetKind = InsightDatasetKind.Sections;
			const datasetContent = fs.readFileSync("test/resources/archives/pair.zip");

			let result = await request(SERVER_URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(datasetContent)
				.set("Content-Type", "application/x-zip-compressed");

			expect(result.status).to.be.equal(200);

			// Delete the same dataset
			const result1 = await request(SERVER_URL).delete(`/dataset/${datasetId}`);
			expect(result1.status).to.be.equal(200);
			expect(result1.body.result).to.be.equal(datasetId);
		});
		it("should delete a ROOMS dataset correctly and responsd with success", async function () {
			// Add dataset
			const datasetId = `id-${new Date().getTime()}`;
			const datasetKind = InsightDatasetKind.Rooms;
			const datasetContent = fs.readFileSync("test/resources/archives/campus.zip");

			let result = await request(SERVER_URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(datasetContent)
				.set("Content-Type", "application/x-zip-compressed");

			expect(result.status).to.be.equal(200);

			// Delete the same dataset
			const result1 = await request(SERVER_URL).delete(`/dataset/${datasetId}`);
			expect(result1.status).to.be.equal(200);
			expect(result1.body.result).to.be.equal(datasetId);
		});

		it("should return $)$ for deleting a dataset that does NOT exist", async function () {
			const invalidId = "nonExistentId";
			const result = await request(SERVER_URL).delete(`/dataset/${invalidId}`);
			expect(result.status).to.be.equal(404);
		});

		it("should return 400 for deleting a dataset with invalid ID", async function () {
			const invalidId = "invalid_id";
			const result = await request(SERVER_URL).delete(`/dataset/${invalidId}`);
			expect(result.status).to.be.equal(400);
		});

		it("should return 404 when trying to delete the same dataset twice", async function () {
			const datasetId = `id-${new Date().getTime()}`;
			const datasetKind = InsightDatasetKind.Sections;
			const datasetContent = fs.readFileSync("test/resources/archives/pair.zip");

			// Add dataset
			await request(SERVER_URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(datasetContent)
				.set("Content-Type", "application/x-zip-compressed");

			// First deletion (should succeed)
			let result = await request(SERVER_URL).delete(`/dataset/${datasetId}`);
			expect(result.status).to.be.equal(200);

			// Second deletion (should fail)
			result = await request(SERVER_URL).delete(`/dataset/${datasetId}`);
			expect(result.status).to.be.equal(404);
		});
	});

	describe("test suite for POST /query for SECTIONS", function () {
		const SERVER_URL = "http://localhost:4321";
		const datasetId = "sections";
		const datasetKind = InsightDatasetKind.Sections;
		let datasetContent = null; // To be loaded before tests

		before(async function () {
			// Load dataset content
			datasetContent = fs.readFileSync("test/resources/archives/pair.zip");
			// Add the dataset
			await request(SERVER_URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(datasetContent)
				.set("Content-Type", "application/x-zip-compressed");
		});

		it("should successfully execute a valid query", async function () {
			const query = {
				WHERE: {
					GT: {
						sections_avg: 97,
					},
				},
				OPTIONS: {
					COLUMNS: ["sections_dept", "sections_avg"],
					ORDER: "sections_avg",
				},
			};
			const result = await request(SERVER_URL).post("/query").send(query);
			console.log(result);
			expect(result.status).to.be.equal(200);
			expect(result.body).to.have.property("result");
		});
		it("should return empty result for a valid query with no matches", async function () {
			const query = {
				WHERE: {
					GT: {
						sections_avg: 101,
					},
				},
				OPTIONS: {
					COLUMNS: ["sections_dept", "sections_avg"],
					ORDER: "sections_avg",
				},
			};
			const result = await request(SERVER_URL).post("/query").send(query);
			expect(result.status).to.be.equal(200);
			expect(result.body.result).to.be.an("array").that.is.empty;
		});
		it("should return 400 for malformed query string for GT", async function () {
			const query = {
				WHERE: {
					GT: {
						sections_avg: "hello",
					},
				},
				OPTIONS: {
					COLUMNS: ["sections_dept", "sections_avg"],
					ORDER: "sections_avg",
				},
			};
			const result = await request(SERVER_URL).post("/query").send(query);
			expect(result.status).to.be.equal(400);
		});
		it("should return 400 for malformed query number for IS", async function () {
			const query = {
				WHERE: {
					IS: {
						sections_dept: 97,
					},
				},
				OPTIONS: {
					COLUMNS: ["sections_dept", "sections_avg"],
					ORDER: "sections_avg",
				},
			};
			const result = await request(SERVER_URL).post("/query").send(query);
			expect(result.status).to.be.equal(400);
		});
		it("should return 400 for query on non-existing dataset", async function () {
			const query = {
				WHERE: {
					IS: {
						adsfasd_dept: 101,
					},
				},
				OPTIONS: {
					COLUMNS: ["adsfasd_dept", "adsfasd_avg"],
					ORDER: "adsfasd_avg",
				},
			};
			const result = await request(SERVER_URL).post("/query").send(query);
			expect(result.status).to.be.equal(400);
		});

		it("should return 400 for empty query", async function () {
			const result = await request(SERVER_URL).post("/query").send({});
			expect(result.status).to.be.equal(400);
		});

		it("should return 400 for missing query in request body", async function () {
			const result = await request(SERVER_URL).post("/query");
			expect(result.status).to.be.equal(400);
		});
	});

	describe("Server DELETE /dataset/:id ", function () {
		const SERVER_URL = "http://localhost:4321";

		it("should delete a dataset correctly and responsd with success", async function () {
			// Add dataset
			const datasetId = `id-${new Date().getTime()}`;
			const datasetKind = InsightDatasetKind.Sections;
			const datasetContent = fs.readFileSync("test/resources/archives/pair.zip");

			let result = await request(SERVER_URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(datasetContent)
				.set("Content-Type", "application/x-zip-compressed");

			expect(result.status).to.be.equal(200);

			// Delete the same dataset
			const result1 = await request(SERVER_URL).delete(`/dataset/${datasetId}`);
			expect(result1.status).to.be.equal(200);
			expect(result1.body.result).to.be.equal(datasetId);
		});
		it("should delete a ROOMS dataset correctly and responsd with success", async function () {
			// Add dataset
			const datasetId = `id-${new Date().getTime()}`;
			const datasetKind = InsightDatasetKind.Rooms;
			const datasetContent = fs.readFileSync("test/resources/archives/campus.zip");

			let result = await request(SERVER_URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(datasetContent)
				.set("Content-Type", "application/x-zip-compressed");

			expect(result.status).to.be.equal(200);

			// Delete the same dataset
			const result1 = await request(SERVER_URL).delete(`/dataset/${datasetId}`);
			expect(result1.status).to.be.equal(200);
			expect(result1.body.result).to.be.equal(datasetId);
		});

		it("should return $)$ for deleting a dataset that does NOT exist", async function () {
			const invalidId = "nonExistentId";
			const result = await request(SERVER_URL).delete(`/dataset/${invalidId}`);
			expect(result.status).to.be.equal(404);
		});

		it("should return 400 for deleting a dataset with invalid ID", async function () {
			const invalidId = "invalid_id";
			const result = await request(SERVER_URL).delete(`/dataset/${invalidId}`);
			expect(result.status).to.be.equal(400);
		});

		it("should return 404 when trying to delete the same dataset twice", async function () {
			const datasetId = `id-${new Date().getTime()}`;
			const datasetKind = InsightDatasetKind.Sections;
			const datasetContent = fs.readFileSync("test/resources/archives/pair.zip");

			// Add dataset
			await request(SERVER_URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(datasetContent)
				.set("Content-Type", "application/x-zip-compressed");

			// First deletion (should succeed)
			let result = await request(SERVER_URL).delete(`/dataset/${datasetId}`);
			expect(result.status).to.be.equal(200);

			// Second deletion (should fail)
			result = await request(SERVER_URL).delete(`/dataset/${datasetId}`);
			expect(result.status).to.be.equal(404);
		});
	});

	describe("test suite for POST /query for ROOMS", function () {
		const SERVER_URL = "http://localhost:4321";
		const datasetId = "rooms";
		const datasetKind = InsightDatasetKind.Rooms;
		let datasetContent = null; // To be loaded before tests

		before(async function () {
			// Load dataset content
			datasetContent = fs.readFileSync("test/resources/archives/campus.zip");
			// Add the dataset
			await request(SERVER_URL)
				.put(`/dataset/${datasetId}/${datasetKind}`)
				.send(datasetContent)
				.set("Content-Type", "application/x-zip-compressed");
		});

		it("should successfully execute a valid query", async function () {
			const query = {
				WHERE: {
					AND: [
						{
							IS: {
								rooms_furniture: "*Tables*",
							},
						},
						{
							GT: {
								rooms_seats: 300,
							},
						},
					],
				},
				OPTIONS: {
					COLUMNS: ["rooms_shortname", "maxSeats"],
					ORDER: {
						dir: "DOWN",
						keys: ["maxSeats"],
					},
				},
				TRANSFORMATIONS: {
					GROUP: ["rooms_shortname"],
					APPLY: [
						{
							maxSeats: {
								MAX: "rooms_seats",
							},
						},
					],
				},
			};
			const result = await request(SERVER_URL).post("/query").send(query);
			console.log(result);
			expect(result.status).to.be.equal(200);
			expect(result.body).to.have.property("result");
		});
		it("should return empty result for a valid query with no matches", async function () {
			const query = {
				WHERE: {
					AND: [
						{
							IS: {
								rooms_furniture: "*Tables*",
							},
						},
						{
							GT: {
								rooms_seats: 1000000000000000000,
							},
						},
					],
				},
				OPTIONS: {
					COLUMNS: ["rooms_shortname", "maxSeats"],
					ORDER: {
						dir: "DOWN",
						keys: ["maxSeats"],
					},
				},
				TRANSFORMATIONS: {
					GROUP: ["rooms_shortname"],
					APPLY: [
						{
							maxSeats: {
								MAX: "rooms_seats",
							},
						},
					],
				},
			};
			const result = await request(SERVER_URL).post("/query").send(query);
			expect(result.status).to.be.equal(200);
			expect(result.body.result).to.be.an("array").that.is.empty;
		});
		it("should return 400 for malformed query string for GT", async function () {
			const query = {
				WHERE: {
					AND: [
						{
							IS: {
								rooms_furniture: "*Tables*",
							},
						},
						{
							GT: {
								rooms_seats: "oops",
							},
						},
					],
				},
				OPTIONS: {
					COLUMNS: ["rooms_shortname", "maxSeats"],
					ORDER: {
						dir: "DOWN",
						keys: ["maxSeats"],
					},
				},
				TRANSFORMATIONS: {
					GROUP: ["rooms_shortname"],
					APPLY: [
						{
							maxSeats: {
								MAX: "rooms_seats",
							},
						},
					],
				},
			};
			const result = await request(SERVER_URL).post("/query").send(query);
			expect(result.status).to.be.equal(400);
		});
		it("should return 400 for malformed query number for IS", async function () {
			const query = {
				WHERE: {
					AND: [
						{
							IS: {
								rooms_furniture: 2123,
							},
						},
						{
							GT: {
								rooms_seats: 300,
							},
						},
					],
				},
				OPTIONS: {
					COLUMNS: ["rooms_shortname", "maxSeats"],
					ORDER: {
						dir: "DOWN",
						keys: ["maxSeats"],
					},
				},
				TRANSFORMATIONS: {
					GROUP: ["rooms_shortname"],
					APPLY: [
						{
							maxSeats: {
								MAX: "rooms_seats",
							},
						},
					],
				},
			};
			const result = await request(SERVER_URL).post("/query").send(query);
			expect(result.status).to.be.equal(400);
		});

		it("should return 400 for missing query in request body", async function () {
			const result = await request(SERVER_URL).post("/query");
			expect(result.status).to.be.equal(400);
		});
	});

	// The other endpoints work similarly. You should be able to find all instructions at the supertest documentation
});
