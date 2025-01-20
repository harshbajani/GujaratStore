import { IStore, StoreData } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const parseStringify = (value: unknown) =>
  JSON.parse(JSON.stringify(value));

export function convertToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = () => {
      resolve(fileReader.result as string);
    };
    fileReader.onerror = (error: ProgressEvent<FileReader>) => {
      reject(error);
    };
  });
}

export const formatDateTime = (isoString: string | null | undefined) => {
  if (!isoString) return "—";

  const date = new Date(isoString);

  // Get hours and adjust for 12-hour format
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "pm" : "am";

  // Convert hours to 12-hour format
  hours = hours % 12 || 12;

  // Format the time and date parts
  const time = `${hours}:${minutes.toString().padStart(2, "0")}${period}`;
  const day = date.getDate();
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getMonth()];

  return `${time}, ${day} ${month}`;
};

export const toSchemaFormat = (data: StoreData) => ({
  storeName: data.storeName,
  contact: data.contact,
  addresses: {
    address_line_1: data.address.address_line_1,
    address_line_2: data.address.address_line_2,
    locality: data.address.locality,
    pincode: data.address.pincode,
    state: data.address.state,
    landmark: data.address.landmark,
  },
  alternativeContact: data.alternativeContact,
});

// Helper function to convert from MongoDB schema to IStore interface
export const toInterfaceFormat = (store: {
  storeName: string;
  contact: string;
  addresses: {
    address_line_1: string;
    address_line_2: string;
    locality: string;
    pincode: string;
    state: string;
    landmark?: string;
  };
  alternativeContact?: string;
}): IStore | null => {
  if (!store) return null;

  return {
    storeName: store.storeName,
    contact: store.contact,
    address: {
      address_line_1: store.addresses.address_line_1,
      address_line_2: store.addresses.address_line_2,
      locality: store.addresses.locality,
      pincode: store.addresses.pincode,
      state: store.addresses.state,
      landmark: store.addresses.landmark,
    },
    alternativeContact: store.alternativeContact || "",
  };
};
