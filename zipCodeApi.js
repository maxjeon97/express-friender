const BASE_API_URL = "https://www.zipcodeapi.com/rest";

/** Calls Zip Code API to get all zip codes in specified radius of a user
 *
 * Takes zipCode and radius
 * Returns array of {zip_code, distance, city, state}
 */

async function getZipCodesInRadius(zipCode, radius) {
  const response = await fetch(
    `${BASE_API_URL}/${process.env.ZIPCODE_API_KEY}/radius.json/${zipCode}/${radius}/mile`
  );

  const data = await response.json();
  return data.zip_codes;
}

module.exports = {
  getZipCodesInRadius
};