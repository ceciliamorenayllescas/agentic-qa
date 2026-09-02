function createCheckoutCustomer() { return { firstName: 'Ada', lastName: 'Lovelace', postalCode: '10001' }; }
function sortStringsAscending(values) { return [...values].sort((a, b) => a.localeCompare(b)); }
function sortStringsDescending(values) { return [...values].sort((a, b) => b.localeCompare(a)); }
function normalizeNumericText(value) { return Number(value.trim().replace(/[^0-9.-]/g, '')); }
function sortNumbersAscending(values) { return [...values].sort((a, b) => a - b); }
function sortNumbersDescending(values) { return [...values].sort((a, b) => b - a); }
module.exports = { createCheckoutCustomer, sortStringsAscending, sortStringsDescending, normalizeNumericText, sortNumbersAscending, sortNumbersDescending };
