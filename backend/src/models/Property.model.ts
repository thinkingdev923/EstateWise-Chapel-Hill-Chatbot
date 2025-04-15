import mongoose, { Schema, Document } from "mongoose";

export interface IProperty extends Document {
  zpid: number;
  city: string;
  state: string;
  homeStatus: string;
  address: {
    streetAddress: string;
    city: string;
    state: string;
    zipcode: string;
    neighborhood?: string | null;
    community?: string | null;
    subdivision?: string | null;
  };
  bedrooms: number;
  bathrooms: number;
  price: number;
  yearBuilt: number;
  latitude: number;
  longitude: number;
  livingArea: number;
  homeType: string;
  listingDataSource: string;
  description: string;
}

const AddressSchema: Schema = new Schema(
  {
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipcode: { type: String, required: true },
    neighborhood: { type: String, default: null },
    community: { type: String, default: null },
    subdivision: { type: String, default: null },
  },
  { _id: false }
);

const PropertySchema: Schema = new Schema({
  zpid: { type: Number, required: true, unique: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  homeStatus: { type: String, required: true },
  address: { type: AddressSchema, required: true },
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  price: { type: Number, required: true },
  yearBuilt: { type: Number, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  livingArea: { type: Number, required: true },
  homeType: { type: String, required: true },
  listingDataSource: { type: String, required: true },
  description: { type: String, default: "" },
});

export default mongoose.model<IProperty>("Property", PropertySchema);
