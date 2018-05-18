// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const input = document.querySelector("input");
document.querySelector("form").addEventListener("submit", function(e) {
	e.preventDefault();
	input.placeholder = input.value;
	input.value = "";
});