

import axios from 'axios';
import { FileType } from '../types/file';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const fileService = {
  // Fetch list of files with optional filters & search
  async getFiles(filters?: {
    search?: string;
    file_type?: string;
    size_min?: number;
    size_max?: number;
    uploaded_after?: string;  // YYYY-MM-DD
    uploaded_before?: string; // YYYY-MM-DD
  }): Promise<FileType[]> {
    // Build query string from filters
    const params = new URLSearchParams();
    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.file_type) params.append('file_type', filters.file_type);
      if (filters.size_min != null) params.append('size_min', filters.size_min.toString());
      if (filters.size_max != null) params.append('size_max', filters.size_max.toString());
      if (filters.uploaded_after) params.append('uploaded_after', filters.uploaded_after);
      if (filters.uploaded_before) params.append('uploaded_before', filters.uploaded_before);
    }
    const queryString = params.toString();
    const url = queryString ? `${API_URL}/files/?${queryString}` : `${API_URL}/files/`;
    const response = await axios.get(url);
    return response.data;
  },

  async uploadFile(file: File): Promise<FileType> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_URL}/files/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteFile(id: string): Promise<void> {
    await axios.delete(`${API_URL}/files/${id}/`);
  },

  // Download a file (no change needed)
  async downloadFile(fileUrl: string, filename: string): Promise<void> {
    const response = await axios.get(fileUrl, { responseType: 'blob' });
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Fetch storage stats (optional for UI)
  async getStorageStats(): Promise<{
    total_physical: number;
    total_logical: number;
    total_savings: number;
  }> {
    const response = await axios.get(`${API_URL}/storage-stats/`);
    return response.data;
  },
};
