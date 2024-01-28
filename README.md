# Relocator Helper

Automate the assessment of prospective properties by evaluating nearby Points of Interest (POIs) and Google Fiber availability using Cypress.

## Overview

This tool processes a list of addresses and checks their proximity to predefined POIs like grocery stores and downtown areas. It also verifies Google Fiber availability at these locations. Results are saved in `favorite-details.json`.

```
{
  "favorites": [
    {
      "123 Main St, Austin, TX 78729": {
        "isGoogleFiberAvailable": false,
        "HEB": { "time": "5 min", "distance": "1.8 miles" },
        "Austin, TX": { "time": "22 min", "distance": "15.9 miles" }
      }
    },
    ...
  ]
}
```

## Setup

### Dependencies

- Cypress (Install using `npm install`)
- A file named `addresses.txt` in the root directory

### Configuration

Modify the `google_*` Cypress scripts to customize the list of POIs as per your requirement.

## Usage

Run the script with:

`npx cypress open`
