// export interface File {
//   id: string;
//   original_filename: string;
//   file_type: string;
//   size: number;
//   uploaded_at: string;
//   file: string;
// } 
// frontend/src/types/file.ts

export interface FileType {
  id: string;
  file: string;               // URL of the uploaded file
  original_filename: string;
  file_type: string;
  size: number;               // size in bytes
  uploaded_at: string;        // ISO timestamp
  sha256_hash: string;
  deduplicated: boolean;      // new: true if this upload was blocked as a duplicate
  storage_savings: number;    // new: bytes saved (file size) when deduplicated
}
