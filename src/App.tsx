import { useState, FormEvent } from "react";
import { pb } from "./lib/pocketbaseClient";
import { IconCopy, IconDownload } from "@tabler/icons-react";

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [words, setWords] = useState<string>("");
  const [downloadInput, setDownloadInput] = useState("");
  const [downloadedFile, setDownloadedFile] = useState<{
    name: string;
    url: string;
    recordId: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFileChange = async (newFile: File | null) => {
    if (selectedFile) {
      setError(
        "You've already uploaded a file. Please refresh to upload a new one."
      );
      return;
    }

    if (newFile && newFile.size > 20 * 1024 * 1024) {
      setError("Max 20MB");
      return;
    }
    setSelectedFile(newFile);
    setError(null);

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
      } catch (error) {
        console.error("Error uploading file:", error);
        setError("Error uploading file: " + (error as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDownload = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!downloadInput.trim()) {
      setError("Please enter words to download a file");
      return;
    }

    setIsLoading(true);
    try {
      const records = await pb.collection("uploads").getList(1, 1, {
        filter: `word = "${downloadInput.trim()}"`,
      });

      if (records.totalItems > 0) {
        const record = records.items[0];
        const fileUrl = pb.files.getUrl(record, record.file);

        setDownloadedFile({
          name: record.file,
          url: fileUrl,
          recordId: record.id,
        });
        setWords(record.word);
        setError(null);
      } else {
        setError("No file found for these words");
      }
    } catch (error) {
      console.error("Error fetching file:", error);
      setError("Error fetching file. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadClick = async () => {
    if (!downloadedFile) return;

    try {
      const response = await fetch(downloadedFile.url);
      if (!response.ok) throw new Error("Network response was not ok");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(
        new Blob([blob], {
          type:
            response.headers.get("content-type") || "application/octet-stream",
        })
      );

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = downloadedFile.name;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      if ("recordId" in downloadedFile) {
        await pb.collection("uploads").delete(downloadedFile.recordId);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      setError("Error downloading file. Please try again.");
    }
  };

  return (
    <>
      <div className=" h-dvh w-screen bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="grid grid-cols-1 xl:grid-cols-2 h-full w-full container mx-auto p-10 lg:p-0">
          <div className="h-full w-full flex flex-col justify-center items-center col-span-1">
            <div className="flex flex-col justify-center items-center">
              <div className="flex flex-col items-center lg:items-start">
                <p className="text-[#4f46e5] text-xs lg:text-sm font-semibold bg-[#EFF2FF] border-2 border-[#4f46e5] px-2 mb-2">
                  Trusted by 10,000+ Users Worldwide
                </p>
                <div className="text-black text-4xl lg:text-6xl text-center lg:text-left font-extrabold relative lg:text-nowrap">
                  <p>
                    Share files in 1 click.{" "}
                    <span className="text-[#4f46e5] text-3xl lg:text-4xl lg:absolute lg:-bottom-10 lg:right-0 italic">
                      literally
                    </span>
                  </p>
                </div>
                <p className="text-[#525252] pb-2 lg:pb-0 text-center lg:text-left leading-7 w-full lg:w-3/4 text-sm lg:text-base">
                  No signup, no compression, just words.
                </p>
              </div>
              <div className=" flex-col lg:flex lg:flex-row items-center gap-4 hidden ">
                <div className="mt-6 lg:mt-14 font-bold bg-indigo-500 mb-1  text-white w-fit transition-all shadow-[3px_3px_0px_black] flex items-center gap-2 px-2">
                  <span className="p-2 animate-[slideDown_1s_ease-in-out_0.1s]">
                    1
                  </span>
                  <span className="p-2 animate-[slideDown_1s_ease-in-out_0.2s]">
                    0
                  </span>
                  <span className="p-2 animate-[slideDown_1s_ease-in-out_0.3s]">
                    0
                  </span>
                  <span className="p-2 animate-[slideDown_1s_ease-in-out_0.4s]">
                    1
                  </span>
                  <span className="p-2 animate-[slideDown_1s_ease-in-out_0.5s]">
                    5
                  </span>
                  <span className="p-2 animate-[slideDown_1s_ease-in-out_0.6s]">
                    0
                  </span>
                  <span className="p-2 animate-[slideDown_1s_ease-in-out_0.7s]">
                    0
                  </span>
                </div>
                <p className="w-full flex justify-center mt-2 lg:mt-14 text-gray-600">
                  Join the community <br /> with over 1M+ shares
                </p>
              </div>
            </div>
          </div>
          <div className="h-full w-full col-span-1 flex justify-center items-start lg:items-center">
            <div className="flex flex-col gap-4 justify-between lg:justify-center h-full">
              <div>
                <div className="w-72 bg-white shadow-[0px_10px_50px_rgba(0,0,0,0.1)] flex flex-col p-4">
                  <p className="font-bold text-xl">Send</p>
                  {!selectedFile && !downloadedFile ? (
                    <label className="mt-4 cursor-pointer">
                      <div className="border-2 border-dashed border-indigo-500 px-4 h-20 flex flex-col justify-center items-center hover:bg-indigo-50 transition-colors">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) =>
                            handleFileChange(e.target.files?.[0] || null)
                          }
                        />
                        <p className="text-indigo-500 font-semibold">
                          Choose a file
                        </p>
                        <p className="text-gray-500 text-sm mt-1">Max 20MB</p>
                      </div>
                    </label>
                  ) : downloadedFile ? (
                    <div className="mt-4 h-20 flex flex-col justify-center items-center p-4 bg-indigo-50">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <svg
                            className="w-8 h-8 text-indigo-500 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-700 truncate mr-2">
                              {downloadedFile.name}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleDownloadClick}
                          className="h-10 min-w-10 flex items-center justify-center bg-indigo-500 shadow-[3px_3px_0px_black]"
                        >
                          <IconDownload className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 h-20 flex flex-col justify-center items-center p-4 bg-indigo-50">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <svg
                            className="w-8 h-8 text-indigo-500 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-700 truncate">
                              {selectedFile?.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {selectedFile?.type.split("/")[1]}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {((selectedFile?.size || 1) / 1024 / 1024).toFixed(2)}{" "}
                          MB
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="w-72 bg-white shadow-[0px_10px_50px_rgba(0,0,0,0.1)] flex flex-col p-4 relative">
                  <p className="font-bold text-xl">Receive</p>
                  <div className="mt-4 flex items-center gap-2 ">
                    {isLoading ? (
                      <div className="flex-1 h-10 w-full border text-black text-center border-gray-300 flex items-center justify-center">
                        <span className="mr-2 text-sm text-indigo-500">
                          {downloadedFile
                            ? "Fetching File"
                            : " Generating Words"}
                        </span>
                        <svg
                          className="animate-spin h-5 w-5 text-indigo-500"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </div>
                    ) : uploaded ? (
                      <div className="flex w-full flex-row gap-2">
                        <p className="h-10 w-full border text-black flex items-center justify-center border-gray-300">
                          {words}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(words);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000); // Hide after 2 seconds
                          }}
                          className="h-10 min-w-10 flex items-center justify-center bg-indigo-500 shadow-[3px_3px_0px_black]"
                        >
                          <IconCopy className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    ) : downloadedFile ? (
                      <p className="h-10 w-full border text-black flex items-center justify-center border-gray-300">
                        {words}
                      </p>
                    ) : (
                      <form
                        onSubmit={handleDownload}
                        className="flex w-full flex-row gap-2"
                      >
                        <input
                          type="text"
                          value={downloadInput}
                          onChange={(e) => {
                            const value = e.target.value
                              .replace(/[^a-zA-Z]/g, "")
                              .slice(0, 15);
                            setDownloadInput(value);
                          }}
                          className="flex-1 h-10 w-full border lowercase placeholder:capitalize text-black text-center border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Paste your words"
                          maxLength={15}
                        />
                        <button
                          type="submit"
                          className="h-10 min-w-10 flex items-center justify-center bg-indigo-500 shadow-[3px_3px_0px_black]"
                        >
                          <IconDownload className="w-5 h-5 text-white" />
                        </button>
                      </form>
                    )}
                  </div>
                  {error && (
                    <div className="absolute -bottom-8 right-0 left-0 mx-auto">
                      <p className="text-red-500 text-sm text-center">
                        {error}
                      </p>
                    </div>
                  )}
                  {copied && (
                    <div className="absolute -bottom-8 right-0 left-0 mx-auto">
                      <p className="text-gray-500 text-sm text-center">
                        Copied to clipboard
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full flex-col justify-center items-center gap-4 lg:hidden ">
                <div className="flex flex-col items-center">
                  <div className="mt-6 font-bold bg-indigo-500 mb-1 text-white w-fit transition-all shadow-[3px_3px_0px_black] flex items-center gap-2 px-2">
                    <span className="p-1 lg:p-2 animate-[slideDown_1s_ease-in-out_0.1s]">
                      1
                    </span>
                    <span className="p-1 lg:p-2 animate-[slideDown_1s_ease-in-out_0.2s]">
                      0
                    </span>
                    <span className="p-1 lg:p-2 animate-[slideDown_1s_ease-in-out_0.3s]">
                      0
                    </span>
                    <span className="p-1 lg:p-2 animate-[slideDown_1s_ease-in-out_0.4s]">
                      1
                    </span>
                    <span className="p-1 lg:p-2 animate-[slideDown_1s_ease-in-out_0.5s]">
                      5
                    </span>
                    <span className="p-1 lg:p-2 animate-[slideDown_1s_ease-in-out_0.6s]">
                      0
                    </span>
                    <span className="p-1 lg:p-2 animate-[slideDown_1s_ease-in-out_0.7s]">
                      0
                    </span>
                  </div>
                  <p className="w-full flex justify-center mt-2 lg:mt-14 text-gray-600 text-sm lg:text-base">
                    Join the community <br /> with over 1M+ shares
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
