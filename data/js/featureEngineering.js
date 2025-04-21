export function computeFeatures(records) {
  const currentYear = new Date().getFullYear();
  return records.map((r) => {
    const price = r.price;
    const area = r.livingArea || 1;
    const yearBuilt = r.yearBuilt || currentYear;
    const beds = r.bedrooms || 0;
    const baths = r.bathrooms || 0;
    return {
      ...r,
      pricePerSqft: price / area,
      age: currentYear - yearBuilt,
      bedroomBathRatio: baths > 0 ? beds / baths : beds,
      logPrice: Math.log1p(price),
      priceAreaInteraction: (price / area) * (beds + baths),
    };
  });
}
