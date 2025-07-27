/**
 * @jest-environment node
 */

const httpMocks = require("node-mocks-http");

/* ─── mock queryProperties ───────────────────────────────────────────── */
const fakeResults = [
  {
    id: "1",
    score: 0.9,
    metadata: JSON.stringify({
      price: 500000,
      bedrooms: 3,
      bathrooms: 2,
      livingArea: 1800,
      yearBuilt: 1990,
      homeType: "Single Family",
      homeStatus: "For Sale",
      city: "Austin",
      address: JSON.stringify({ zipcode: "78701" }),
    }),
  },
  {
    id: "2",
    score: 0.8,
    metadata: JSON.stringify({
      price: 350000,
      bedrooms: 2,
      bathrooms: 1,
      livingArea: 1200,
      yearBuilt: 0, // should be filtered out
      homeType: "Condo",
      homeStatus: "For Sale",
      city: "Austin",
      address: JSON.stringify({ zipcode: "78702" }),
    }),
  },
  {
    id: "3",
    score: 0.95,
    metadata: JSON.stringify({
      price: 750000,
      bedrooms: 4,
      bathrooms: 3,
      livingArea: 2500,
      yearBuilt: 2005,
      homeType: "Townhouse",
      homeStatus: "For Sale",
      city: "Dallas",
      address: JSON.stringify({ zipcode: "75201" }),
    }),
  },
];

const queryPropsMock = jest.fn().mockResolvedValue(fakeResults);
jest.mock("../src/scripts/queryProperties", () => ({
  queryProperties: queryPropsMock,
}));

/* ─── import after mocks ─────────────────────────────────────────────── */
const { getPropertyData } = require("../src/controllers/property.controller");

/* ─── helpers ─────────────────────────────────────────────────────────── */
const buildRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe("getPropertyData()", () => {
  beforeEach(() => jest.clearAllMocks());

  it("handles service failure with 500", async () => {
    queryPropsMock.mockRejectedValueOnce(new Error("boom"));

    const req = httpMocks.createRequest({ query: { q: "" } });
    const res = buildRes();

    await getPropertyData(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Failed to fetch property data",
    });
  });
});
