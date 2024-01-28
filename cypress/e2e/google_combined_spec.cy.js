function parseAddress(fullAddress) {
    const addressRegex = /^(.*), Austin, TX (\d{5})$/;
    const match = fullAddress.match(addressRegex);
    return {
      streetAddress: match[1],
      zipCode: match[2]
    };
  }

describe('Google Maps and Fiber Check', () => {
    it('Searches for addresses from a file and gets directions to multiple destinations', () => {
        const POINTS_OF_INTEREST = ['HEB', 'Austin, TX'];
        let allDetails = { favorites: [] };

        const processAddressFiber = (results, address) => {
            const addressObj = parseAddress(address);
            cy.visit('https://fiber.google.com/cities/austin/')
                .get('input[name="street_address"]').eq(1).type(addressObj.streetAddress)
                .get('input[name="zip_code"]').eq(1).type(addressObj.zipCode)
                .get('.address-checker__submit').eq(1).click();

            let isGoogleFiberAvailable = true;

            cy.get('body').then($body => {
                // Check if 'h1.cta-title' exists in the body
                if ($body.find('h1.cta-title').length > 0) {
                    const $header = $body.find('h1.cta-title');
                    if ($header.text().includes("Google Fiber isn’t available for this address")) {
                        isGoogleFiberAvailable = false;
                    }
                }
                results.isGoogleFiberAvailable = isGoogleFiberAvailable;
            });
        }

        const processDestination = (destination, results, address) => {
            // Process each address
            cy.visit('https://www.google.com/maps')
                .get('#searchboxinput').type(`${address}{enter}`)
                .wait(1000)
                .get('button[aria-label^="Directions to"]', { timeout: 10000 })
                .should('be.visible')
                .click({ force: true });

            cy.get('.tactile-searchbox-input').first()
                .clear()
                .type(`${destination}{enter}`)
                .wait(1000) // Adjust the wait time as needed
                .get('#section-directions-trip-0')
                .should('be.visible')
                .wait(1000).then(($div) => {
                    const fullText = $div.text();
                    const timeRegex = /(\d+ min)/;
                    const distanceRegex = /(\d+\.\d+ miles)/;

                    const timeMatch = fullText.match(timeRegex);
                    const distanceMatch = fullText.match(distanceRegex);

                    if (!results[destination]) {
                        results[destination] = {};
                    }
                    results[destination].time = timeMatch ? timeMatch[0] : 'N/A';
                    results[destination].distance = distanceMatch ? distanceMatch[0] : 'N/A';
                });
        };

        cy.readFile('addresses.txt').then((content) => {
            const addresses = content.split('\n').filter(a => a.trim() !== '');

            cy.wrap(addresses).each((address, index, list) => {
                let details = {};

                processAddressFiber(details, address);
                cy.wrap(POINTS_OF_INTEREST).each((destination) => {
                    processDestination(destination, details, address);
                }).then(() => {
                    allDetails.favorites.push({ [address]: details });
                    // Save individual file
                    cy.writeFile(`individual/${address}.json`, JSON.stringify(details));

                    // Check if it's the last address and then write to the combined file
                    if (index === list.length - 1) {
                        cy.writeFile('favorite-details.json', JSON.stringify(allDetails));
                    }
                });
            });
        });
    });
});

