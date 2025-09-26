/**
 * Example tRPC Client Usage
 *
 * This file demonstrates how frontend clients can connect to the tRPC API.
 * tRPC provides end-to-end type safety between backend and frontend.
 */

import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "./routers";

// Create tRPC client
const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:3001/trpc",
      // Optional: Add authentication headers
      headers() {
        return {
          authorization: "Bearer YOUR_TOKEN_HERE",
        };
      },
    }),
  ],
});

// Example usage:
async function exampleUsage() {
  try {
    // 1. Get property list
    const properties = await trpc.properties.list.query({
      limit: 10,
      minPrice: 500000,
      maxPrice: 1000000,
      type: "house",
    });
    console.log("Properties:", properties);

    // 2. Get specific property
    const property = await trpc.properties.byId.query({ id: "1" });
    console.log("Property details:", property);

    // 3. Search properties
    const searchResults = await trpc.properties.search.query({
      query: "downtown",
      limit: 5,
    });
    console.log("Search results:", searchResults);

    // 4. Get property statistics
    const stats = await trpc.properties.stats.query();
    console.log("Property stats:", stats);

    // 5. Get market trends
    const trends = await trpc.analytics.marketTrends.query({
      location: "Austin, TX",
      period: "month",
    });
    console.log("Market trends:", trends);

    // 6. Get price prediction
    const prediction = await trpc.analytics.pricePrediction.query({
      address: "123 Main St",
      features: {
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1800,
        yearBuilt: 2015,
      },
    });
    console.log("Price prediction:", prediction);

    // 7. Get neighborhood insights
    const insights = await trpc.analytics.neighborhoodInsights.query({
      zipCode: "78701",
    });
    console.log("Neighborhood insights:", insights);

    // 8. Calculate investment metrics
    const metrics = await trpc.analytics.investmentMetrics.query({
      propertyPrice: 500000,
      monthlyRent: 3000,
      downPayment: 20,
      interestRate: 6.5,
      loanTerm: 30,
    });
    console.log("Investment metrics:", metrics);

    // 9. Create a new property (requires authentication)
    const newProperty = await trpc.properties.create.mutate({
      title: "New Listing",
      price: 750000,
      bedrooms: 3,
      bathrooms: 2,
      sqft: 2000,
      address: "789 Oak St",
      type: "house",
      description: "Beautiful new listing",
      features: ["Pool", "Garage"],
    });
    console.log("Created property:", newProperty);
  } catch (error) {
    console.error("tRPC error:", error);
  }
}

// For React/Next.js usage:
/**
 * In a React component:
 *
 * import { trpc } from '~/utils/trpc';
 *
 * function PropertyList() {
 *   const { data, isLoading, error } = trpc.properties.list.useQuery({
 *     limit: 10,
 *   });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       {data?.items.map(property => (
 *         <div key={property.id}>{property.title}</div>
 *       ))}
 *     </div>
 *   );
 * }
 */

export { trpc, exampleUsage };
