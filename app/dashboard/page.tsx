"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import {
  ImageIcon,
  Loader2,
  ZoomIn,
  ZoomOut,
  Crop,
  UnfoldHorizontal,
  UnfoldVertical,
  Save,
  FileDown,
  Send,
} from "lucide-react";
import ReactCrop, { type Crop as CropType } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

export default function DashboardPage() {
  const { user } = useUser();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const editorRef = useRef<any>(null);
  const editorInstanceRef = useRef<any>(null);

  const [splitDirection, setSplitDirection] = useState<"horizontal" | "vertical">("horizontal");
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<CropType>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [isCropping, setIsCropping] = useState(false);

  // For panning / dragging
const [isDragging, setIsDragging] = useState(false);
const [position, setPosition] = useState({ x: 0, y: 0 });
const dragStart = useRef({ x: 0, y: 0 });


  useEffect(() => {
    const initEditor = async () => {
      if (editorInstanceRef.current) return;
      const EditorJS = (await import("@editorjs/editorjs")).default;
      const Header = (await import("@editorjs/header")).default;
      const List = (await import("@editorjs/list")).default;
      const LinkTool = (await import("@editorjs/link")).default;
      const InlineCode = (await import("@editorjs/inline-code")).default;
      const ImageTool = (await import("@editorjs/image")).default;

      const Quote = (await import("@editorjs/quote")).default;
      const CodeTool = (await import("@editorjs/code")).default;
      const Table = (await import("@editorjs/table")).default;

      if (editorRef.current) {
        editorInstanceRef.current = new EditorJS({
          holder: editorRef.current,
          tools: {
            header: { class: Header, inlineToolbar: true },
            list: { class: List, inlineToolbar: true },
            linkTool: LinkTool,
            inlineCode: InlineCode,
            quote: Quote,
            code: CodeTool,
            table: Table,
            image: {
              class: ImageTool,
              config: {
                endpoints: {
                  byFile: "/api/uploadImage",
                  byUrl: "/api/fetchUrl",
                },
              },
            },
          },
          placeholder: "Type your description here...",
          minHeight: 400,
        });
      }
    };
    initEditor();
    return () => {
      editorInstanceRef.current?.destroy();
      editorInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const fetchImage = async () => {
      setIsLoading(true);
      setImageError(false);
      try {
        const payload = { userId: user?.id };

        const response = await fetch(
          "https://n8n.olevel.ai/webhook/getRandomImage",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) throw new Error("Failed to fetch image");
        const responseData = await response.json();

        if (responseData) {
          const imageUrl = responseData.image;
          if (typeof imageUrl === "string") {
            setImageUrl(imageUrl);
          } else {
            setImageError(true);
          }

          if (responseData.data && editorInstanceRef.current) {
            try {
              const parsedData = JSON.parse(responseData.data);
              await editorInstanceRef.current.clear();

              if (parsedData.savedData) {
                const editorData =
                  typeof parsedData.savedData === "string"
                    ? JSON.parse(parsedData.savedData)
                    : parsedData.savedData;

                if (Array.isArray(editorData)) {
                  await editorInstanceRef.current.blocks.render(editorData);
                } else if (editorData.blocks) {
                  await editorInstanceRef.current.render(editorData);
                }
              } else if (parsedData.context) {
                editorInstanceRef.current.blocks.insert("paragraph", {
                  text: parsedData.context,
                });
              }
            } catch (e) {
              console.error("Failed to parse/load saved editor data", e);
            }
          }
        } else {
          setImageError(true);
        }
      } catch (err) {
        setImageError(true);
      }
      setIsLoading(false);
    };

    fetchImage();
  }, [currentImageIndex]);

  const handleCropAndAddToEditor = () => {
    if (!completedCrop || !imgRef.current) return;
    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const base64Image = canvas.toDataURL("image/jpeg");
    if (editorInstanceRef.current) {
      editorInstanceRef.current.blocks.insert("image", {
        file: { url: base64Image },
      });
    }
  };

  const handleSave = async () => {
    if (!user) return alert("Please sign in.");
    if (!editorInstanceRef.current) return alert("Editor not ready.");

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const savedData = await editorInstanceRef.current.save();
      const edjsHTML = (await import("editorjs-html")).default;
      const htmlToMdModule = await import("html-to-md");
      const html2md = htmlToMdModule.default;

      const parser = edjsHTML();
      let html = parser.parse(savedData);
      if (Array.isArray(html)) html = html.join("");
      else if (typeof html !== "string") html = String(html);

      const markdownContent = html2md(html);

      const fileId = imageUrl
        ?.split("/")
        .pop()
        ?.replace(".jpg", "")
        ?.replace(".jpeg", "")
        ?.replace(".png", "");

      const payload = {
        userId: user.id,
        context: markdownContent,
        fileId: fileId,
        savedData: savedData,
        pageIndex: currentImageIndex,
      };

      const response = await fetch(
        "https://n8n.olevel.ai/webhook/saveData",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Failed to save");

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Save failed.");
    } finally {
      setIsSaving(false);
    }
  };
// Mouse down / touch start
const handleDragStart = (e: any) => {
  e.preventDefault();
  setIsDragging(true);

  const clientX = e.clientX || e.touches?.[0]?.clientX;
  const clientY = e.clientY || e.touches?.[0]?.clientY;

  dragStart.current = {
    x: clientX - position.x,
    y: clientY - position.y,
  };
};

// Mouse move / touch move
const handleDragMove = (e: any) => {
  if (!isDragging) return;

  const clientX = e.clientX || e.touches?.[0]?.clientX;
  const clientY = e.clientY || e.touches?.[0]?.clientY;

  setPosition({
    x: clientX - dragStart.current.x,
    y: clientY - dragStart.current.y,
  });
};

// Mouse up / touch end
const handleDragEnd = () => {
  setIsDragging(false);
};

  const handleSaveAsMarkdown = async () => {
    if (!editorInstanceRef.current) return alert("Editor not ready.");

    try {
      const savedData = await editorInstanceRef.current.save();
      const edjsHTML = (await import("editorjs-html")).default;
      const htmlToMdModule = await import("html-to-md");
      const html2md = htmlToMdModule.default;

      const parser = edjsHTML();
      let html = parser.parse(savedData);

      if (Array.isArray(html)) html = html.join("");
      else if (typeof html !== "string") html = String(html);

      const markdownContent = html2md(html);

      const blob = new Blob([markdownContent], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "note.md";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to save markdown.");
    }
  };

  const handlePublish = async () => {
    const savedData = await editorInstanceRef.current.save();
    console.log("Publishing data...", { content: savedData, currentImageIndex });
  };

  const handlePrevious = () => {
    if (currentImageIndex > 0) setCurrentImageIndex((i) => i - 1);
  };

  const handleNext = () => {
    setCurrentImageIndex((i) => i + 1);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow-sm z-10">
        <div className="flex justify-between items-center py-2 px-4">
          <h1 className="text-xl font-bold text-gray-800">VisionNote</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() =>
                setSplitDirection(
                  splitDirection === "horizontal" ? "vertical" : "horizontal"
                )
              }
              className="p-2 rounded-md hover:bg-gray-200"
            >
              {splitDirection === "horizontal" ? (
                <UnfoldVertical className="text-gray-800" />
              ) : (
                <UnfoldHorizontal className="text-gray-800" />
              )}
            </button>
            <UserButton />
          </div>
        </div>
      </header>

      {/* 
      ==============================
      NEW MOBILE LAYOUT FIX
      ==============================
      */}
      <main
        className={`
          flex-1 flex 
          flex-col 
          md:flex-row
        `}
      >
        {/* Image Panel */}
        <div
          className="
            w-full 
            md:w-1/2 
            h-1/2 
            md:h-full 
            p-4 
            overflow-auto
          "
        >
          <div className="bg-white rounded-xl shadow-md h-full flex flex-col">
            <div className="p-2 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Image</h2>
              <div className="flex items-center space-x-2">
                <button onClick={() => setZoom(z => z + 0.1)} className="p-2 rounded-md hover:bg-gray-200"><ZoomIn size={20} className="text-gray-800" /></button>
                <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-2 rounded-md hover:bg-gray-200"><ZoomOut size={20} className="text-gray-800" /></button>
                <button 
                  onClick={() => {
                    if (isCropping) {
                      handleCropAndAddToEditor();
                    }
                    setIsCropping(!isCropping);
                  }} 
                  className={`p-2 rounded-md hover:bg-gray-200 ${isCropping ? 'bg-blue-200' : ''}`}
                >
                  {isCropping ? 'Paste Crop' : <Crop size={20} className="text-gray-800" />}
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              {isLoading ? <Loader2 className="animate-spin" /> : imageError ? <ImageIcon /> : (
                isCropping ? (
              
                  <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)}>
  <img
    ref={imgRef}
    src={imageUrl}
    crossOrigin="anonymous"
    onMouseDown={handleDragStart}
    onMouseMove={handleDragMove}
    onMouseUp={handleDragEnd}
    onMouseLeave={handleDragEnd}
    onTouchStart={handleDragStart}
    onTouchMove={handleDragMove}
    onTouchEnd={handleDragEnd}
    style={{
      transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
      cursor: isDragging ? "grabbing" : "grab",
      transition: isDragging ? "none" : "transform 0.05s linear",
    }}
    alt="Source"
  />
</ReactCrop>


         
                ) : (
                  <img
                    ref={imgRef}
                    src={imageUrl}
                    crossOrigin="anonymous"
                    onMouseDown={handleDragStart}
                    onMouseMove={handleDragMove}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                    onTouchStart={handleDragStart}
                    onTouchMove={handleDragMove}
                    onTouchEnd={handleDragEnd}
                    style={{
                      transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                      cursor: isDragging ? "grabbing" : "grab",
                      transition: isDragging ? "none" : "transform 0.05s linear",
                    }}
                    alt="Source"
                  />
                )
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 p-4">
              <button
                onClick={handlePrevious}
                disabled={currentImageIndex === 0 || isLoading}
                className="w-full px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Editor Panel */}
        <div
          className="
            w-full 
            md:w-1/2 
            h-1/2 
            md:h-full 
            p-4 
            overflow-auto
          "
        >
          <div className="bg-white rounded-xl shadow-md h-full flex flex-col">
            <div className="p-2 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Editor</h2>
              <div className="flex items-center space-x-2">
                <button onClick={handleSave} className="p-2 rounded-md hover:bg-gray-200"><Save size={20} className="text-gray-800" /></button>
                <button onClick={handleSaveAsMarkdown} className="p-2 rounded-md hover:bg-gray-200"><FileDown size={20} className="text-gray-800" /></button>
                <button onClick={handlePublish} className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"><Send size={20} className="text-gray-800" /></button>
              </div>
            </div>

            <div ref={editorRef} id="editorjs" className="flex-1 p-8 pl-17" />
          </div>
        </div>
      </main>
    </div>
  );
}
