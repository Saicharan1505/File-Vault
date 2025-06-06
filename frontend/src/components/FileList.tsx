


// frontend/src/components/FileList.tsx


import React, { useState } from 'react';
import { fileService } from '../services/fileService';
import { FileType } from '../types/file';
import { DocumentIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Filters {
  search: string;
  file_type: string;
  size_min: string;
  size_max: string;
  uploaded_after: string;
  uploaded_before: string;
}

export const FileList: React.FC = () => {
  const queryClient = useQueryClient();

  // Local state for filter inputs
  const [filters, setFilters] = useState<Filters>({
    search: '',
    file_type: '',
    size_min: '',
    size_max: '',
    uploaded_after: '',
    uploaded_before: '',
  });

  // A trigger counter to re-fetch when "Search" or "Clear" is clicked
  const [trigger, setTrigger] = useState(0);

  // Parse filter strings into the types expected by fileService.getFiles
  const parsedFilters = {
    search: filters.search || undefined,
    file_type: filters.file_type || undefined,
    size_min: filters.size_min ? Number(filters.size_min) * 1024 : undefined,
    size_max: filters.size_max ? Number(filters.size_max) * 1024 : undefined,
    uploaded_after: filters.uploaded_after || undefined,
    uploaded_before: filters.uploaded_before || undefined,
  };

  // useQuery to fetch files; re-runs whenever "trigger" changes
  const { data: files, isLoading, error } = useQuery<FileType[], Error>({
    queryKey: ['files', trigger],
    queryFn: () => fileService.getFiles(parsedFilters),
  });

  // Delete mutation
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => fileService.deleteFile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  // Download mutation
  const downloadMutation = useMutation<void, Error, { fileUrl: string; filename: string }>({
    mutationFn: ({ fileUrl, filename }) =>
      fileService.downloadFile(fileUrl, filename),
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleDownload = async (fileUrl: string, filename: string) => {
    try {
      await downloadMutation.mutateAsync({ fileUrl, filename });
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Handle filter input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // When Search is clicked, bump trigger to re-run the query
  const handleSearch = () => {
    setTrigger((prev) => prev + 1);
  };

  // When Clear Filters is clicked, reset filters and re-trigger
  const handleClear = () => {
    setFilters({
      search: '',
      file_type: '',
      size_min: '',
      size_max: '',
      uploaded_after: '',
      uploaded_before: '',
    });
    setTrigger((prev) => prev + 1);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">Failed to load files. Please try again.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* 1. Filename search */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Filename</label>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            placeholder="Search by name"
          />
        </div>

        {/* 2. File type filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700">File Type</label>
          <select
            name="file_type"
            value={filters.file_type}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          >
            <option value="">All</option>
            <option value="image/png">PNG</option>
            <option value="image/jpeg">JPEG</option>
            <option value="image/gif">GIF</option>
            <option value="image/svg+xml">SVG</option>
            <option value="application/pdf">PDF</option>
            <option value="text/plain">TXT</option>
            <option value="text/csv">CSV</option>
            <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">
              DOCX
            </option>
            <option value="application/msword">DOC</option>
            <option value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
              XLSX
            </option>
            <option value="application/vnd.ms-excel">XLS</option>
            <option value="application/vnd.openxmlformats-officedocument.presentationml.presentation">
              PPTX
            </option>
            <option value="application/vnd.ms-powerpoint">PPT</option>
            <option value="audio/mpeg">MP3</option>
            <option value="video/mp4">MP4</option>
            <option value="application/zip">ZIP</option>
          </select>
        </div>

        {/* 3. Min Size (KB) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Min Size (KB)</label>
          <input
            type="number"
            name="size_min"
            value={filters.size_min}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            placeholder="0"
            min="0"
          />
        </div>

        {/* 4. Max Size (KB) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Max Size (KB)</label>
          <input
            type="number"
            name="size_max"
            value={filters.size_max}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            placeholder="10240" 
            min="0"
          />
        </div>

        {/* 5. Uploaded After */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Uploaded After</label>
          <input
            type="date"
            name="uploaded_after"
            value={filters.uploaded_after}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>

        {/* 6. Uploaded Before */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Uploaded Before</label>
          <input
            type="date"
            name="uploaded_before"
            value={filters.uploaded_before}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>
      </div>

      {/* Search & Clear Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Search
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
          Clear Filters
        </button>
      </div>

      {/* File List */}
      {!files || files.length === 0 ? (
        <div className="text-center py-12">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by uploading a file</p>
        </div>
      ) : (
        <div className="mt-6 flow-root">
          <ul className="-my-5 divide-y divide-gray-200">
            {files.map((file) => (
              <li key={file.id} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <DocumentIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.original_filename}
                    </p>
                    <p className="text-sm text-gray-500">
                      {file.file_type} • {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <p className="text-sm text-gray-500">
                      Uploaded {new Date(file.uploaded_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownload(file.file, file.original_filename)}
                      disabled={downloadMutation.isPending}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={deleteMutation.isPending}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

