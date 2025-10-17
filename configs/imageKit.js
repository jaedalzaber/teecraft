// import ImageKit from 'imageKit'
'use client'

import {
    ImageKitAbortError,
    ImageKitInvalidRequestError,
    ImageKitServerError,
    ImageKitUploadNetworkError,
    upload,
} from "@imagekit/next";
// var imageKit = new ImageKit(
//     {
//         publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
//         privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
//         urlEndPoint: process.env.IMAGEKIT_URL_ENDPOINT

//     }
// )

// export default imageKit

export const authenticator = async () => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"; // fallback for local dev
    const response = await fetch(`${baseUrl}/api/upload-auth`);
    if (!response.ok) {
      // If the server response is not successful, extract the error text for debugging.
      const errorText = await response.text();
      throw new Error(
        `Request failed with status ${response.status}: ${errorText}`
      );
    }

    // Parse and destructure the response JSON for upload credentials.
    const data = await response.json();
    const { signature, expire, token, publicKey } = data;
    return { signature, expire, token, publicKey };
  } catch (error) {
    // Log the original error for debugging before rethrowing a new error.
    console.error("Authentication error:", error);
    throw new Error("Authentication request failed");
  }
};

export const handleUpload = async (file, filename) => {
  // Retrieve authentication parameters for the upload.
  let authParams;
  try {
    authParams = await authenticator();
  } catch (authError) {
    console.error("Failed to authenticate for upload:", authError);
    return;
  }
  const { signature, expire, token, publicKey } = authParams;

  let uploadResponse;
  // Call the ImageKit SDK upload function with the required parameters and callbacks.
  try {
    uploadResponse = await upload({
      // Authentication parameters
      expire,
      token,
      signature,
      publicKey,
      file,
      fileName: filename, // Optionally set a custom file name
      // Progress callback to update upload progress state
      onProgress: (event) => {
      },
      // Abort signal to allow cancellation of the upload if needed.
      abortSignal: AbortController.signal,
    });
    console.log("Upload response:", uploadResponse);
  } catch (error) {
    // Handle specific error types provided by the ImageKit SDK.
    if (error instanceof ImageKitAbortError) {
      console.error("Upload aborted:", error.reason);
    } else if (error instanceof ImageKitInvalidRequestError) {
      console.error("Invalid request:", error.message);
    } else if (error instanceof ImageKitUploadNetworkError) {
      console.error("Network error:", error.message);
    } else if (error instanceof ImageKitServerError) {
      console.error("Server error:", error.message);
    } else {
      // Handle any other errors that may occur.
      console.error("Upload error:", error);
    }
  }

  return uploadResponse;
};
