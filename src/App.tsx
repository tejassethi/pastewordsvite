import { BackgroundBeams } from "./components/ui/background-beams";
import { FileUpload } from "./components/ui/file-upload";

function App() {
  return (
    <>
      <div className="h-screen w-screen bg-black text-white">
        <div className="flex flex-col items-center justify-end h-[30%] lg:h-2/5 ">
          <h2 className="text-4xl relative z-20 lg:text-7xl font-bold text-center text-white font-sans tracking-tight">
            Share files with simple words.
          </h2>
          <h5 className="lg:text-xl text-lg  text-center text-neutral-400 pt-2 px-5">
            No Log in. No Compression. No Emails. Just words.
          </h5>
        </div>
        <div className="flex flex-col items-center justify-start h-[70%] lg:h-3/5">
          <FileUpload />
        </div>
      </div>
      <BackgroundBeams />
    </>
  );
}

export default App;
