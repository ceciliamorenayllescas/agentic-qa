# Environments

## SauceDemo

**Environment:** Public test environment

**Base URL:** https://www.saucedemo.com/

**Application type:** Web

**Access:** Browser

**Testing mode:** External / black-box

## Configuration

The base URL should be supplied through:

`TEST_BASE_URL`

Credentials should be supplied through environment variables.

Do not store passwords or authentication tokens in this file.

## Browser Targets

The MVP should support:

* Desktop Chromium
* Mobile Chromium emulation

## Evidence

Test evidence should be stored under:

`artifacts/`

Potential evidence includes:

* Screenshots
* Playwright traces
* Videos
* Test reports
