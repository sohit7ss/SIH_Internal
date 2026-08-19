// lib/cloudinary.ts
export const CLOUDINARY_CLOUD_NAME = "iqopmmgg";
export const CLOUDINARY_UPLOAD_PRESET = "classroom_app_unsigned";
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

/**
 * Uploads a local file (recording, PDF, slide image) to Cloudinary.
 * @param fileUri - local URI from expo-av / expo-document-picker / expo-image-picker
 * @param fileName - a name for the file, e.g. "lecture_123_recording.mp4"
 * @returns the public secure_url to store in Firestore (e.g. Lecture.recordingUrl)
 */
export async function uploadToCloudinary(fileUri: string, fileName: string): Promise<string> {
    const formData = new FormData();
    formData.append("file", {
        uri: fileUri,
        name: fileName,
        type: "application/octet-stream", // Cloudinary auto-detects actual type
    } as any);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Cloudinary upload failed: ${errText}`);
    }

    const data = await response.json();
    return data.secure_url; // this is what you save into Firestore
}