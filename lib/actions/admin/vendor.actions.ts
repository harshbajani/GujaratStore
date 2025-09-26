"use server";

import { VendorService } from "@/services/vendor.service";
import { revalidatePath } from "next/cache";

export type VendorUpdateData = Partial<{
  name: string;
  email: string;
  phone: string;
  password: string;
  store: {
    storeName?: string;
    contact?: string;
    addresses?: {
      address_line_1: string;
      address_line_2: string;
      locality: string;
      pincode: string;
      state: string;
      landmark?: string;
    };
    alternativeContact?: string;
  };
  bankDetails?: BankDetails;
  vendorIdentity?: {
    aadharCardNumber?: string;
    aadharCardDoc?: string | File;
    panCard?: string;
    panCardDoc?: string | File;
  };
  businessIdentity?: {
    MSMECertificate?: string | File;
    UdhyamAadhar?: string | File;
    Fassai?: string | File;
    CorporationCertificate?: string | File;
    OtherDocuments?: string | File;
  };
  // Shiprocket integration fields
  shiprocket_pickup_location?: string;
  shiprocket_pickup_location_added?: boolean;
}>;
// Upload file helper function
const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `File upload failed: ${errorData.message || response.statusText}`
    );
  }

  const result = await response.json();
  return result.fileId;
};

export async function createVendor(
  data: VendorUpdateData & { password: string; isVerified?: boolean }
) {
  const result = await VendorService.createVendor(data);

  if (result.success) {
    revalidatePath("/admin/vendor");
  }

  return result;
}

export async function createVendorWithFiles(
  formData: FormData
) {
  try {
    // Extract basic vendor data
    const vendorData: any = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      password: formData.get("password") as string,
      isVerified: formData.get("isVerified") === "true",
      emailVerified: formData.get("emailVerified") === "true",
      store: {
        storeName: formData.get("store.storeName") as string,
        contact: formData.get("store.contact") as string,
        addresses: {
          address_line_1: formData.get("store.addresses.address_line_1") as string,
          address_line_2: formData.get("store.addresses.address_line_2") as string,
          locality: formData.get("store.addresses.locality") as string,
          pincode: formData.get("store.addresses.pincode") as string,
          state: formData.get("store.addresses.state") as string,
          landmark: formData.get("store.addresses.landmark") as string,
        },
        alternativeContact: formData.get("store.alternativeContact") as string,
      },
      bankDetails: {
        bankName: formData.get("bankDetails.bankName") as string,
        bankCode: formData.get("bankDetails.bankCode") as string,
        ifscCode: formData.get("bankDetails.ifscCode") as string,
        accountHolderName: formData.get("bankDetails.accountHolderName") as string,
        accountNumber: formData.get("bankDetails.accountNumber") as string,
        accountType: formData.get("bankDetails.accountType") as string,
      },
    };

    // Handle identity verification files
    const identityData: any = {};
    const aadharFile = formData.get("identity.aadharCardDoc") as File;
    const panFile = formData.get("identity.panCardDoc") as File;
    
    if (aadharFile && aadharFile.size > 0) {
      identityData.aadharCardDoc = await uploadFile(aadharFile);
    }
    if (panFile && panFile.size > 0) {
      identityData.panCardDoc = await uploadFile(panFile);
    }
    
    identityData.aadharCardNumber = formData.get("identity.aadharCardNumber") as string;
    identityData.panCard = formData.get("identity.panCard") as string;
    
    if (Object.keys(identityData).length > 0) {
      vendorData.identity = identityData;
    }

    // Handle business verification files
    const businessData: any = {};
    const msmeFile = formData.get("businessIdentity.MSMECertificate") as File;
    const udhyamFile = formData.get("businessIdentity.UdhyamAadhar") as File;
    const fssaiFile = formData.get("businessIdentity.Fassai") as File;
    const corpFile = formData.get("businessIdentity.CorporationCertificate") as File;
    const otherFile = formData.get("businessIdentity.OtherDocuments") as File;
    
    if (msmeFile && msmeFile.size > 0) {
      businessData.MSMECertificate = await uploadFile(msmeFile);
    }
    if (udhyamFile && udhyamFile.size > 0) {
      businessData.UdhyamAadhar = await uploadFile(udhyamFile);
    }
    if (fssaiFile && fssaiFile.size > 0) {
      businessData.Fassai = await uploadFile(fssaiFile);
    }
    if (corpFile && corpFile.size > 0) {
      businessData.CorporationCertificate = await uploadFile(corpFile);
    }
    if (otherFile && otherFile.size > 0) {
      businessData.OtherDocuments = await uploadFile(otherFile);
    }
    
    if (Object.keys(businessData).length > 0) {
      vendorData.businessIdentity = businessData;
    }

    const result = await VendorService.createVendor(vendorData);

    if (result.success) {
      revalidatePath("/admin/vendor");
    }

    return result;
  } catch (error) {
    console.error("Create vendor with files error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create vendor",
    };
  }
}

export async function getAllVendors() {
  return await VendorService.getAllVendors();
}

export async function getVendorById(id: string) {
  return await VendorService.getVendorById(id);
}

export async function updateVendorById(id: string, data: VendorUpdateData) {
  const result = await VendorService.updateVendor(id, data);

  if (result.success) {
    revalidatePath("/admin/vendor");
  }

  return result;
}

export async function updateVendorWithFiles(
  id: string,
  formData: FormData
) {
  try {
    // Extract basic vendor data
    const vendorData: any = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      isVerified: formData.get("isVerified") === "true",
      emailVerified: formData.get("emailVerified") === "true",
      store: {
        storeName: formData.get("store.storeName") as string,
        contact: formData.get("store.contact") as string,
        addresses: {
          address_line_1: formData.get("store.addresses.address_line_1") as string,
          address_line_2: formData.get("store.addresses.address_line_2") as string,
          locality: formData.get("store.addresses.locality") as string,
          pincode: formData.get("store.addresses.pincode") as string,
          state: formData.get("store.addresses.state") as string,
          landmark: formData.get("store.addresses.landmark") as string,
        },
        alternativeContact: formData.get("store.alternativeContact") as string,
      },
      bankDetails: {
        bankName: formData.get("bankDetails.bankName") as string,
        bankCode: formData.get("bankDetails.bankCode") as string,
        ifscCode: formData.get("bankDetails.ifscCode") as string,
        accountHolderName: formData.get("bankDetails.accountHolderName") as string,
        accountNumber: formData.get("bankDetails.accountNumber") as string,
        accountType: formData.get("bankDetails.accountType") as string,
      },
    };

    // Handle identity verification files
    const identityData: any = {};
    const aadharFile = formData.get("identity.aadharCardDoc") as File;
    const panFile = formData.get("identity.panCardDoc") as File;
    
    if (aadharFile && aadharFile.size > 0) {
      identityData.aadharCardDoc = await uploadFile(aadharFile);
    } else {
      // Keep existing file if no new file uploaded
      const existingAadhar = formData.get("identity.aadharCardDoc.existing") as string;
      if (existingAadhar) identityData.aadharCardDoc = existingAadhar;
    }
    
    if (panFile && panFile.size > 0) {
      identityData.panCardDoc = await uploadFile(panFile);
    } else {
      // Keep existing file if no new file uploaded
      const existingPan = formData.get("identity.panCardDoc.existing") as string;
      if (existingPan) identityData.panCardDoc = existingPan;
    }
    
    identityData.aadharCardNumber = formData.get("identity.aadharCardNumber") as string;
    identityData.panCard = formData.get("identity.panCard") as string;
    
    if (Object.keys(identityData).length > 0) {
      vendorData.identity = identityData;
    }

    // Handle business verification files
    const businessData: any = {};
    const msmeFile = formData.get("businessIdentity.MSMECertificate") as File;
    const udhyamFile = formData.get("businessIdentity.UdhyamAadhar") as File;
    const fssaiFile = formData.get("businessIdentity.Fassai") as File;
    const corpFile = formData.get("businessIdentity.CorporationCertificate") as File;
    const otherFile = formData.get("businessIdentity.OtherDocuments") as File;
    
    if (msmeFile && msmeFile.size > 0) {
      businessData.MSMECertificate = await uploadFile(msmeFile);
    } else {
      const existing = formData.get("businessIdentity.MSMECertificate.existing") as string;
      if (existing) businessData.MSMECertificate = existing;
    }
    
    if (udhyamFile && udhyamFile.size > 0) {
      businessData.UdhyamAadhar = await uploadFile(udhyamFile);
    } else {
      const existing = formData.get("businessIdentity.UdhyamAadhar.existing") as string;
      if (existing) businessData.UdhyamAadhar = existing;
    }
    
    if (fssaiFile && fssaiFile.size > 0) {
      businessData.Fassai = await uploadFile(fssaiFile);
    } else {
      const existing = formData.get("businessIdentity.Fassai.existing") as string;
      if (existing) businessData.Fassai = existing;
    }
    
    if (corpFile && corpFile.size > 0) {
      businessData.CorporationCertificate = await uploadFile(corpFile);
    } else {
      const existing = formData.get("businessIdentity.CorporationCertificate.existing") as string;
      if (existing) businessData.CorporationCertificate = existing;
    }
    
    if (otherFile && otherFile.size > 0) {
      businessData.OtherDocuments = await uploadFile(otherFile);
    } else {
      const existing = formData.get("businessIdentity.OtherDocuments.existing") as string;
      if (existing) businessData.OtherDocuments = existing;
    }
    
    if (Object.keys(businessData).length > 0) {
      vendorData.businessIdentity = businessData;
    }

    const result = await VendorService.updateVendor(id, vendorData);

    if (result.success) {
      revalidatePath("/admin/vendor");
    }

    return result;
  } catch (error) {
    console.error("Update vendor with files error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update vendor",
    };
  }
}

export async function deleteVendor(id: string) {
  const result = await VendorService.deleteVendor(id);

  if (result.success) {
    revalidatePath("/admin/vendor");
  }

  return result;
}
