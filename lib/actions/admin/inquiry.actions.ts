"use server";
import mongoose from "mongoose";
import Inquiry from "../../models/inquiry.model";
import { connectToDB } from "../../mongodb";

export const getAllInquiry = async () => {
  await connectToDB();
  try {
    const inquiries = await Inquiry.find({})
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const transformedInquiries = inquiries.map((inquiry) => ({
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      message: inquiry.message,
    }));

    return transformedInquiries;
  } catch (error) {
    console.error("Failed to fetch inquiries:", error);
    throw error;
  }
};

export const getInquiryById = async () => {};

export const createInquiry = async (formData: FormData) => {
  await connectToDB();

  try {
    const validatedData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      message: formData.get("message") as string,
    };

    const inquiry = await Inquiry.create(validatedData);
    return { success: true, inquiry };
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      console.error("Validation Error:", error);
      throw new Error("Validation failed. Check the input data.");
    }

    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      const message =
        duplicateField === "email"
          ? "This email is already registered."
          : "This phone number is already registered.";
      throw new Error(message);
    }

    console.error("Failed to create inquiry:", error);
    throw new Error("Failed to create the inquiry");
  }
};

export const updateInquiry = async () => {};

export const deleteInquiry = async () => {};
