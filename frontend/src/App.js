import logo from './logo.svg';
import './App.css';
import React from "react";
import Search from "./components/Search";

function App() {
	return (
		<div className="App">
			<header className="App-header">
				<Search /> {/* Integrate the Search component */}
			</header>
		</div>
	);
}

export default App;
