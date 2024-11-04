import PocketBase from "pocketbase";

const pb = new PocketBase("https://pocketbase.pastewords.com");

// Configure default options
pb.autoCancellation(false);

// Add request options
pb.beforeSend = function (url, options) {
  options.headers = {
    ...options.headers,
    Accept: "application/json",
  };
  return { url, options };
};

export { pb };
