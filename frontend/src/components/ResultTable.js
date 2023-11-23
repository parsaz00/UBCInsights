import React from "react";

const ResultTable = ({ results }) => {
	if (!results || results.length === 0) {
		// If there are no results, inform the user

		return <p style={{ color: 'red' }}>No results were found: check inputs and try again. Year/Department might be invalid</p>;

	}

	// Get headers from the first result object keys
	const headers = Object.keys(results[0]);

	return (
		<table className="result-table">
			<thead className="result-table-header">
			<tr>
				{headers.map((header, index) => (
					<th key={index} className="result-table-header-cell">{header.replace("sections_", "")}</th>
				))}
			</tr>
			</thead>
			<tbody className="result-table-body">
			{results.map((row, rowIndex) => (
				<tr key={rowIndex} className="result-table-row">
					{headers.map((header, columnIndex) => (
						<td key={`${rowIndex}-${columnIndex}`} className="result-table-cell">{row[header]}</td>
					))}
				</tr>
			))}
			</tbody>
		</table>
	);

};

export default ResultTable;
