import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

// Sample data - replace with actual database queries
const properties = [
  {
    id: "1",
    title: "Modern Downtown Loft",
    price: 850000,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    address: "123 Main St, Austin, TX",
    type: "condo",
    listingDate: new Date("2024-01-15"),
    description: "Beautiful modern loft in the heart of downtown",
    images: ["/api/placeholder/400/300"],
    features: ["Gym", "Pool", "Concierge"],
  },
  {
    id: "2",
    title: "Suburban Family Home",
    price: 650000,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2800,
    address: "456 Oak Ave, Round Rock, TX",
    type: "house",
    listingDate: new Date("2024-02-01"),
    description: "Spacious family home with large backyard",
    images: ["/api/placeholder/400/300"],
    features: ["Garage", "Garden", "Modern Kitchen"],
  },
];

export const propertiesRouter = router({
  // Get all properties
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(10),
        offset: z.number().min(0).optional().default(0),
        type: z.enum(["house", "condo", "apartment", "townhouse"]).optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        bedrooms: z.number().optional(),
      }),
    )
    .query(({ input }) => {
      let filtered = [...properties];

      if (input.type) {
        filtered = filtered.filter((p) => p.type === input.type);
      }
      if (input.minPrice) {
        // @ts-ignore
        filtered = filtered.filter((p) => p.price >= input.minPrice);
      }
      if (input.maxPrice) {
        // @ts-ignore
        filtered = filtered.filter((p) => p.price <= input.maxPrice);
      }
      if (input.bedrooms) {
        // @ts-ignore
        filtered = filtered.filter((p) => p.bedrooms >= input.bedrooms);
      }

      const total = filtered.length;
      const items = filtered.slice(input.offset, input.offset + input.limit);

      return {
        items,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  // Get single property by ID
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const property = properties.find((p) => p.id === input.id);
      if (!property) {
        throw new Error("Property not found");
      }
      return property;
    }),

  // Search properties
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).optional().default(10),
      }),
    )
    .query(({ input }) => {
      const query = input.query.toLowerCase();
      const results = properties.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.address.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query),
      );

      return results.slice(0, input.limit);
    }),

  // Create a new property (protected)
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        price: z.number().positive(),
        bedrooms: z.number().min(0),
        bathrooms: z.number().min(0),
        sqft: z.number().positive(),
        address: z.string().min(1),
        type: z.enum(["house", "condo", "apartment", "townhouse"]),
        description: z.string(),
        features: z.array(z.string()).optional(),
      }),
    )
    .mutation(({ input, ctx }) => {
      const newProperty = {
        ...input,
        id: String(properties.length + 1),
        listingDate: new Date(),
        images: ["/api/placeholder/400/300"],
        features: input.features || [],
      };

      properties.push(newProperty);
      console.log("Property created by user:", ctx.user.email);

      return newProperty;
    }),

  // Get property statistics
  stats: publicProcedure.query(() => {
    const totalListings = properties.length;
    const avgPrice =
      properties.reduce((sum, p) => sum + p.price, 0) / totalListings;
    const priceRange = {
      min: Math.min(...properties.map((p) => p.price)),
      max: Math.max(...properties.map((p) => p.price)),
    };

    return {
      totalListings,
      avgPrice: Math.round(avgPrice),
      priceRange,
      byType: {
        house: properties.filter((p) => p.type === "house").length,
        condo: properties.filter((p) => p.type === "condo").length,
        apartment: properties.filter((p) => p.type === "apartment").length,
        townhouse: properties.filter((p) => p.type === "townhouse").length,
      },
    };
  }),
});
