function parseAddress(fullAddress) {
    const addressRegex = /^(.*), Austin, TX (\d{5})$/;
    const match = fullAddress.match(addressRegex);

    return {
      streetAddress: match[1],
      zipCode: match[2]
    };
  }

describe('Google Maps Navigation', () => {
    it('Searches for addresses from a file and gets if the address has Google Fiber', () => {
        let allDetails = { favorites: [] };

        const processDestination = (destination, results, address) => {
            cy.get('.tactile-searchbox-input').first()
                .clear()
                .type(`${destination}{enter}`)
                .wait(1000) // Adjust the wait time as needed
                .get('#section-directions-trip-0')
                .should('be.visible').then(($div) => {
                    const fullText = $div.text();
                    const timeRegex = /(\d+ min)/;
                    const distanceRegex = /(\d+\.\d+ miles)/;

                    const timeMatch = fullText.match(timeRegex);
                    const distanceMatch = fullText.match(distanceRegex);

                    if (!results[destination]) {
                        results[destination] = {};
                    }
                    results[destination] = {
                        time: timeMatch ? timeMatch[0] : 'N/A',
                        distance: distanceMatch ? distanceMatch[0] : 'N/A',
                    };
                });
        };

        cy.readFile('addresses.txt').then((content) => {
            const addresses = content.split('\n').filter(a => a.trim() !== '');

            cy.wrap(addresses).each((address, index, list) => {
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

                    // Proceed to write to the file
                    cy.writeFile(`individual/fiber/${address}.json`, isGoogleFiberAvailable ? 'yes' : 'no');
                  });
            });
        });
    });
});
