// Ciation: Used Chat-GPT to help with creating components and general react teachings
import React, {useState} from "react";
import ResultTable from "./ResultTable";

const Search = () => {
	const [courseTitle, setCourseTitle] = useState("");
	const [includeAvgGrade, setIncludeAvgGrade] = useState(false);
	const [includeCourseId, setCourseId] = useState("");
	const [includeProfessor, setIncludeProfessor] = useState(false);
	const [includeYearLower, setYearLower] = useState("");
	const [includeYearUpper, setYearUpper] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [result, setResults] = useState(null);
	const [error, setError] = useState(null);
	const [order, setOrder] = useState("average"); // Default order by average

	const handleSearch = async (event) => {
		event.preventDefault(); // This is to prevent default form submission behav
		setIsLoading(true);
		setError(null);
		// Initialize the WHERE clause with an empty AND array
		const whereConditions = [];

		// Add conditions for the search based on user input
		if (courseTitle) {
			whereConditions.push({ IS: { "sections_dept": courseTitle.toLowerCase().trim()} });
		}

		if (includeCourseId) {
			whereConditions.push({ IS: { "sections_id": includeCourseId }});
		}

		if (includeYearLower) {
			whereConditions.push({GT: {"sections_year" : parseInt(includeYearLower, 10)}});
		}

		if (includeYearUpper) {
			whereConditions.push({LT: {"sections_year": parseInt(includeYearUpper, 10)}});
		}


		const query = {
			WHERE: {
				AND: whereConditions
			},
			OPTIONS: {
				COLUMNS: ["sections_dept"],
				ORDER: "sections_avg"
			}
		};

		// if (includeCourseId) {
		// 	query.OPTIONS.COLUMNS.push("sections_id");
		// 	query.OPTIONS.COLUMNS.push("sections_avg");
		// } else {
		// 	query.OPTIONS.COLUMNS.push("sections_avg");
		// }
		query.OPTIONS.COLUMNS.push("sections_id");
		query.OPTIONS.COLUMNS.push("sections_avg");

		if (includeProfessor) {
			query.OPTIONS.COLUMNS.push("sections_instructor");
		}

		// Add "sections_year" to COLUMNS only if a year filter is applied
		if (includeYearLower || includeYearUpper) {
			query.OPTIONS.COLUMNS.push("sections_year");
		}

		// Set ORDER based on the selection and only if corresponding fields are filled
		if ((order === "year" && (includeYearLower || includeYearUpper)) || order === "average") {
			query.OPTIONS.ORDER = order === "year" ? "sections_year" : "sections_avg";
		} else {
			// If year is chosen but no year is provided, default back to average
			setOrder("average");
		}
		// Update the ORDER part of the OPTIONS based on the selected order
		query.OPTIONS.ORDER = order === "average" ? "sections_avg" : "sections_year";
		console.log("The query being sent to the backend is:", query);

		// Send query to backend

		try {
			const response = await fetch("http://localhost:4321/query", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(query),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			console.log("data after calling 'await response.json()' is:", data);
			setResults(data.result); // Assuming the backend response has a 'result' key
			console.log("setResults(data.results) causes data.results to be", data.result);
		} catch (err) {
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div>
			<h1>Search for Course Sections</h1>
			<form onSubmit={handleSearch}>
				<div>
					<label htmlFor="courseTitle">Course Title:</label>
					<input
						id="courseTitle"
						type="text"
						value={courseTitle}
						onChange={(e) => setCourseTitle(e.target.value)}
					/>
				</div>
				<div>
					<label htmlFor="includeCourseId">Include Course ID (number):</label>
					<input
						id = "includeCourseId"
						type = "text"
						value={includeCourseId}
						onChange={(e => setCourseId(e.target.value))}
						/>
				</div>
				<div>
					<label htmlFor="includeYearLower">Lower Year Bound:</label>
					<input
						id="includeYearLower"
						type="text"
						value={includeYearLower}
						onChange={(e) => setYearLower(e.target.value)}
					/>
				</div>
				<div>
					<label htmlFor="includeYearUpper">Upper Year Bound:</label>
					<input
						id="includeYearUpper"
						type="text"
						value={includeYearUpper}
						onChange={(e) => setYearUpper(e.target.value)}
					/>
				</div>
				<div>
					<label htmlFor="includeProfessor">Include Professor:</label>
					<input
						id="includeProfessor"
						type="checkbox"
						checked={includeProfessor}
						onChange={(e) => setIncludeProfessor(e.target.checked)}
					/>
				</div>
				<div>
					<label htmlFor="order">Order Results By:</label>
					<select
						id="order"
						value={order}
						onChange={(e) => setOrder(e.target.value)}
					>
						<option value="average">Average Grade</option>
						{/* Disable year option if year bounds are not set */}
						<option value="year" disabled={!includeYearLower && !includeYearUpper}>
							Year
						</option>
					</select>
				</div>
				<button type="submit">Search</button>
			</form>
			{/* Display error message if there is an error */}
			{error && (
				<div className="error-message">
					<p>Error: {error}</p>

				</div>
			)}
			{!isLoading && result && <ResultTable results={result} />}
		</div>
	);
};

export default Search;
