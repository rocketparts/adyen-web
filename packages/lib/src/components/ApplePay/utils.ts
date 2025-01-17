export function resolveSupportedVersion(latestVersion: number): number | null {
    const versions = [];
    for (let i = latestVersion; i > 0; i--) {
        versions.push(i);
    }

    try {
        return versions.find(v => v && window.ApplePaySession && ApplePaySession.supportsVersion(v));
    } catch (error) {
        console.warn(error);
        return null;
    }
}

export function mapBrands(brands) {
    const brandMapping = {
        mc: 'masterCard',
        amex: 'amex',
        visa: 'visa',
        elodebit: 'elo',
        elo: 'elo',
        interac: 'interac',
        discover: 'discover',
        jcb: 'jcb',
        electron: 'electron',
        maestro: 'maestro',
        girocard: 'girocard',
        cartebancaire: 'cartesBancaires',
        eftpos_australia: 'eftpos'
    };

    return brands.reduce((accumulator, item) => {
        if (!!brandMapping[item] && !accumulator.includes(brandMapping[item])) {
            accumulator.push(brandMapping[item]);
        }
        return accumulator;
    }, []);
}

/**
 * ApplePay formats address into two lines (US format). First line includes house number and street name.
 * Second line includes unit/suite/apartment number if applicable.
 * This function formats it into Adyen's Address format (house number separate from street).
 */
export function formatBillingAddress(billingContact: ApplePayJS.ApplePayPaymentContact) {
    let street = '';
    let houseNumberOrName = '';
    if (billingContact.addressLines && billingContact.addressLines.length) {
        const splitAddress = splitAddressLine(billingContact.addressLines[0]);
        street = splitAddress.streetAddress;
        houseNumberOrName = splitAddress.houseNumber;
    }

    if (billingContact.addressLines && billingContact.addressLines.length > 1) {
        street += ` ${billingContact.addressLines[1]}`;
    }

    return {
        city: billingContact.locality,
        country: billingContact.countryCode,
        houseNumberOrName,
        postalCode: billingContact.postalCode,
        stateOrProvince: billingContact.administrativeArea,
        street: street
    };
}

const splitAddressLine = (addressLine: string) => {
    // The \d+ captures the digits of the house number, and \w* allows for any letter suffixes (like "123B")
    // Everything after the space is considered the street address.
    const parts = addressLine.match(/^(\d+\w*)\s+(.+)/);
    if (parts) {
        return { houseNumber: parts[1] || '', streetAddress: parts[2] || addressLine };
    } else {
        return { houseNumber: '', streetAddress: addressLine };
    }
};
