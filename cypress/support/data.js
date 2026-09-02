function createCheckoutCustomer() { return { firstName: 'Ada', lastName: 'Lovelace', postalCode: '10001' }; }
function createCheckoutBoundaryData() { return { whitespace: '   ', hyphenated: 'Anne-Marie', apostrophe: "O'Connor", unicode: 'Zoë', alphaNumericPostalCode: 'A1', shortPostalCode: '1' }; }
function sortStringsAscending(values) { return [...values].sort((a, b) => a.localeCompare(b)); }
function sortStringsDescending(values) { return [...values].sort((a, b) => b.localeCompare(a)); }
function normalizeNumericText(value) { return Number(value.trim().replace(/[^0-9.-]/g, '')); }
function sortNumbersAscending(values) { return [...values].sort((a, b) => a - b); }
function sortNumbersDescending(values) { return [...values].sort((a, b) => b - a); }
module.exports = { createCheckoutCustomer, createCheckoutBoundaryData, sortStringsAscending, sortStringsDescending, normalizeNumericText, sortNumbersAscending, sortNumbersDescending };
