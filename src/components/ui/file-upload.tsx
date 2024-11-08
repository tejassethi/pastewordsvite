"use client";

import { cn } from "../../lib/utils";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  IconCopy,
  IconDownload,
  IconUpload,
  IconLoader2,
} from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";
import { pb } from "../../lib/pocketbaseClient";

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

export const FileUpload = ({
  onChange,
}: {
  onChange?: (file: File | null) => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [words, setWords] = useState<string>("");
  const [uploaded, setUploaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloadedFile, setDownloadedFile] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);
  const [canUpload, setCanUpload] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileChange = async (newFile: File | null) => {
    if (!canUpload) {
      setError(
        "You've already uploaded a file. Please refresh to upload a new one."
      );
      return;
    }

    if (newFile && newFile.size > 20 * 1024 * 1024) {
      setError("Max 20MB");
      return;
    }
    setFile(newFile);
    setError(null);
    if (onChange) {
      onChange(newFile);
    }

    if (newFile) {
      setIsLoading(true);
      try {
        const records = await pb.collection("uploads").getList(1, 1, {
          filter: 'file = ""',
          sort: "@random",
          $autoCancel: false,
          requestKey: null,
        });

        if (records.totalItems === 0) {
          throw new Error("Please try again later.");
        }

        const formData = new FormData();
        formData.append("file", newFile);

        const record = await pb
          .collection("uploads")
          .update(records.items[0].id, formData, {
            requestKey: null,
          });

        console.log("Upload successful:", record);
        setUploaded(true);
        setWords(record.word);
        setCanUpload(false);
      } catch (error) {
        console.error("Error uploading file:", error);
        setError("Error uploading file: " + (error as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClick = () => {
    if (canUpload) {
      fileInputRef.current?.click();
    } else {
      setError(
        "You've already uploaded a file. Please refresh to upload a new one."
      );
    }
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    maxSize: 20 * 1024 * 1024,
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (canUpload) {
        handleFileChange(acceptedFiles[0] || null);
      } else {
        setError(
          "You've already uploaded a file. Please refresh to upload a new one."
        );
      }
    },
    onDropRejected: (fileRejections) => {
      const errorMessage =
        fileRejections[0]?.errors[0]?.message || "File upload failed";
      setError(errorMessage);
      alert(errorMessage);
    },
  });

  const handleDownload = async () => {
    if (!words) {
      setError("Please enter words to download a file");
      return;
    }

    try {
      const records = await pb.collection("uploads").getList(1, 1, {
        filter: `word = "${words}"`,
      });

      if (records.totalItems > 0) {
        const record = records.items[0];
        const fileUrl = pb.files.getUrl(record, record.file);

        setDownloadUrl(fileUrl);
        setDownloadedFile({
          name: record.file,
          size: 0,
          type: "application/files",
        });
        setError(null);
      } else {
        setError("No file found for these words");
      }
    } catch (error) {
      console.error("Error fetching file:", error);
      setError("Error fetching file. Please try again.");
    }
  };

  const handleCopyWord = () => {
    navigator.clipboard.writeText(words).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
    });
  };

  const handleDeleteAndDownloadFile = async () => {
    if (!downloadUrl || !downloadedFile || !words) {
      setError("No file available to download");
      return;
    }

    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = downloadedFile.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      setError("Error downloading file. Please try again.");
      return;
    }

    try {
      // Find and delete the record
      const records = await pb.collection("uploads").getList(1, 1, {
        filter: `word = "${words}"`,
      });

      if (records.totalItems > 0) {
        await pb.collection("uploads").delete(records.items[0].id);
      }

      // Reset the state
      setDownloadUrl(null);
      setDownloadedFile(null);
      setWords("");
      setUploaded(false);
      setCanUpload(true);
      setFile(null);
      setError(null);
      setCopied(false);
      setIsLoading(false);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleDownload();
    }
  };

  return (
    <div className="w-[80%] lg:w-full max-w-xl mx-auto">
      {!downloadUrl && (
        <div className="w-full" {...getRootProps()}>
          <motion.div
            onClick={handleClick}
            whileHover="animate"
            className=" group/file block rounded-lg cursor-pointer w-full relative overflow-hidden"
          >
            <input
              ref={fileInputRef}
              id="file-upload-handle"
              type="file"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full mt-10 max-w-xl mx-auto">
                {file ? (
                  <>
                    <motion.div
                      layoutId="file-upload"
                      className={cn(
                        "relative overflow-hidden z-40 bg-neutral-900 flex flex-col items-start justify-start md:h-24 p-4 mt-4 w-full mx-auto rounded-md",
                        "shadow-sm"
                      )}
                    >
                      <div className="flex justify-between w-full items-center gap-4">
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          layout
                          className="text-base text-neutral-300 truncate max-w-xs"
                        >
                          {file.name}
                        </motion.p>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          layout
                          className="rounded-lg px-2 py-1 w-fit flex-shrink-0 text-sm bg-neutral-800 text-white shadow-input"
                        >
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </motion.p>
                      </div>

                      <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-neutral-400">
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          layout
                          className="px-1 py-0.5 rounded-md bg-neutral-800 "
                        >
                          {file.type}
                        </motion.p>

                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          layout
                        >
                          modified{" "}
                          {new Date(file.lastModified).toLocaleDateString()}
                        </motion.p>
                      </div>
                    </motion.div>
                  </>
                ) : (
                  <motion.div
                    layoutId="file-upload"
                    variants={mainVariant}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    className={cn(
                      "relative group-hover/file:shadow-2xl z-40 bg-neutral-900 flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md",
                      "shadow-[0px_10px_50px_rgba(0,0,0,0.1)]"
                    )}
                  >
                    {isDragActive ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-neutral-600 flex flex-col items-center"
                      >
                        Drop it
                        <IconUpload className="w-6 h-6 text-[#999] " />
                      </motion.p>
                    ) : (
                      <div className="flex flex-col items-center space-2">
                        <IconUpload className="w-6 h-6 text-[#999] mb-2" />
                      </div>
                    )}
                  </motion.div>
                )}

                {!file && (
                  <motion.div
                    variants={secondaryVariant}
                    className="absolute opacity-0 border border-dashed border-[#273968] inset-0 z-30 bg-transparent flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md"
                  ></motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {downloadUrl && (
        <motion.div
          layoutId="file-upload"
          className="relative mt-10 overflow-hidden z-40 bg-neutral-900 flex flex-col items-start justify-start md:h-24 p-4 w-full mx-auto rounded-md shadow-sm"
        >
          <div className="flex justify-between w-full items-center gap-4">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              layout
              className="text-base text-neutral-300 truncate max-w-xs"
            >
              {downloadedFile?.name}
            </motion.p>
          </div>

          <div className="flex text-sm md:flex-row flex-col items-center w-full mt-2 justify-between text-neutral-400">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              layout
              className="px-1 py-0.5 rounded-mdbg-neutral-800"
            >
              {downloadedFile?.type}
            </motion.p>

            <div className="absolute right-4 lg:top-1/2 bottom-0 transform -translate-y-1/2">
              <button onClick={handleDeleteAndDownloadFile}>
                <IconDownload className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="mt-6 flex items-center justify-center space-x-4">
        {isLoading ? (
          <div className="py-4 px-4 w-full max-w-md text-base z-50 bg-[#171717] rounded-md text-[#999999] text-center border-slate-800 flex items-center justify-center">
            <IconLoader2 className="w-5 h-5 animate-spin mr-2" />
            <span>Generating words...</span>
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder="Paste Your Words"
              value={words}
              onChange={(e) => {
                const value = e.target.value.replace(/[^a-zA-Z]/g, "");
                setWords(value.slice(0, 10));
              }}
              onKeyDown={handleKeyDown}
              className="py-4 px-4 w-full max-w-md text-base placeholder:text-[#999999] focus:outline-none font-bold z-50 bg-[#171717] rounded-md uppercase text-[#999999] text-center border-slate-800"
            />
            {uploaded && (
              <button
                onClick={handleCopyWord}
                className="py-4 px-6 bg-[#171717] text-[#999999] hover:bg-[#171717]/50 rounded-md font-bold transition-colors duration-200 z-40"
                title="Copy word"
              >
                <IconCopy className="w-5 h-5" />
              </button>
            )}
            {!uploaded && !downloadUrl && (
              <button
                onClick={handleDownload}
                tabIndex={0}
                className="py-4 px-6 bg-[#171717] text-[#999999] hover:bg-[#171717]/50 rounded-md font-bold transition-colors duration-200 z-40"
              >
                <IconDownload className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      </div>
      {copied && (
        <p className="text-[#999999] text-sm mt-2 text-center">Word copied!</p>
      )}
      {error && (
        <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
      )}
    </div>
  );
};
