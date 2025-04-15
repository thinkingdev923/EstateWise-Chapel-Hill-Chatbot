import { Request, Response } from "express";
import Property from "../models/Property.model";

export const searchProperties = async (req: Request, res: Response) => {
  try {
    const { budget, location, urban } = req.query;
    const query: any = {};
    if (budget) {
      query.price = { $lte: Number(budget) };
    }
    if (location) {
      query["address.city"] = { $regex: new RegExp(location as string, "i") };
    }
    if (urban === "true") {
      query["address.city"] = { $regex: /Chapel Hill|Durham|Raleigh|Carrboro/i };
    }
    const properties = await Property.find(query).limit(20);
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: "Property search failed" });
  }
};
