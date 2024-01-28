describe('Google Maps Navigation', () => {
    it('Searches for addresses from a file and gets directions to multiple destinations', () => {
        const POINTS_OF_INTEREST = ['HEB', 'Austin, TX'];
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
                let details = {};

                // Process each address
                cy.visit('https://www.google.com/maps')
                    .get('#searchboxinput').type(`${address}{enter}`)
                    .wait(1000)
                    .get('button[aria-label^="Directions to"]', { timeout: 10000 })
                    .should('be.visible')
                    .click({ force: true });

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
