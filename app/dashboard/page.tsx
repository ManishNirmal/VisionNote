"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import { ImageIcon, Loader2 } from "lucide-react";

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

  useEffect(() => {
    // Initialize Editor.js
    const initEditor = async () => {
      if (editorInstanceRef.current) return;

      const EditorJS = (await import('@editorjs/editorjs')).default;
      const Header = (await import('@editorjs/header')).default;
      const List = (await import('@editorjs/list')).default;
      const LinkTool = (await import('@editorjs/link')).default;
      const InlineCode = (await import('@editorjs/inline-code')).default;
      const ImageTool = (await import('@editorjs/image')).default;

      if (editorRef.current) {
        editorInstanceRef.current = new EditorJS({
          holder: editorRef.current,
          tools: {
            header: {
              // @ts-ignore - EditorJS type compatibility
              class: Header,
              config: {
                levels: [1, 2, 3, 4, 5, 6],
                defaultLevel: 2
              }
            },
            list: {
              // @ts-ignore - EditorJS type compatibility
              class: List,
              inlineToolbar: true,
            },
            // @ts-ignore - EditorJS type compatibility
            linkTool: LinkTool,
            // @ts-ignore - EditorJS type compatibility
            inlineCode: InlineCode,
            image: {
              // @ts-ignore - EditorJS type compatibility
              class: ImageTool,
              config: {
                endpoints: {
                  byFile: '/api/uploadImage', // Backend endpoint for image upload
                  byUrl: '/api/fetchUrl', // Backend endpoint to fetch image by URL
                },
                field: 'image',
                types: 'image/*',
              }
            },
          },
          placeholder: 'Type your description here...',
          minHeight: 400,
        });
      }
    };

    initEditor();

    return () => {
      if (editorInstanceRef.current && editorInstanceRef.current.destroy) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Fetch the image URL from the API
    const fetchImage = async () => {
      setIsLoading(true);
      setImageError(false);
      try {
        const response = await fetch('https://n8n.olevel.ai/webhook/2247c50d-c23d-48e4-8ab6-12072aef03dd', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch image data');
        }

        const data = await response.json();

        // Assuming the API returns an object with an imageUrl or url field
        // Adjust based on actual API response structure
        const url = data.imageUrl || data.url || data.image || data;

        if (typeof url === 'string') {
          setImageUrl(url);
        } else if (Array.isArray(data) && data.length > currentImageIndex) {
          setImageUrl(data[currentImageIndex].url || data[currentImageIndex]);
        } else {
          console.error('Unexpected data format:', data);
          setImageError(true);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading image:", error);
        setImageError(true);
        setIsLoading(false);
      }
    };

    fetchImage();
  }, [currentImageIndex]);

  const handlePrevious = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleNext = () => {
    setCurrentImageIndex(currentImageIndex + 1);
  };

  const handleSave = async () => {
    if (!user) {
      alert('Please sign in to save');
      return;
    }

    if (!editorInstanceRef.current) {
      alert('Editor not initialized');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const savedData = await editorInstanceRef.current.save();

      // Convert Editor.js data to markdown
      const edjsParser = (await import('editorjs-parser')).default;
      const parser = new edjsParser();
      const markdownContent = parser.parse(savedData);

      const payload = {
        userId: user.id,
        context: markdownContent,
        fileId: imageUrl || `image_${currentImageIndex}`,
      };

      const response = await fetch('https://n8n.olevel.ai/webhook-test/e1cb44f7-31e7-41d1-b550-34510ea8ab28', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save data');
      }

      setSaveSuccess(true);
      console.log('Data saved successfully:', payload);

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!editorInstanceRef.current) {
      alert('Editor not initialized');
      return;
    }

    const savedData = await editorInstanceRef.current.save();
    console.log("Publishing data...", { content: savedData, currentImageIndex });
    // TODO: Implement publish functionality
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex justify-end mb-4">
          <UserButton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Section - Image Display */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[400px] flex flex-col items-center justify-center">
              {isLoading ? (
                <>
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                  <p className="text-gray-600">Loading image...</p>
                </>
              ) : imageError ? (
                <>
                  <div className="bg-red-50 rounded-full p-8 mb-5">
                    <ImageIcon className="w-16 h-16 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Error loading image</h3>
                  <p className="text-gray-500 text-center max-w-xs">
                    Failed to load the image. Please try again.
                  </p>
                </>
              ) : imageUrl ? (
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Vision annotation image"
                    className="max-w-full max-h-[500px] object-contain rounded-lg"
                    onError={() => setImageError(true)}
                  />
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 rounded-full p-8 mb-5">
                    <ImageIcon className="w-16 h-16 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No images yet</h3>
                  <p className="text-gray-500 text-center max-w-xs">
                    Images will appear here once loaded from your data source
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentImageIndex === 0}
                className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-all"
              >
                Next
              </button>
            </div>
          </div>

          {/* Right Section - Text Area */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Enter your text
              </label>
              <div
                ref={editorRef}
                id="editorjs"
                className="border border-gray-200 rounded-xl p-4 min-h-[400px]"
              />
            </div>

            <div className="flex gap-3 justify-end items-center">
              {saveSuccess && (
                <span className="text-green-600 font-medium text-sm">
                  ✓ Saved successfully!
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-7 py-3 bg-white border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
              <button
                onClick={handlePublish}
                className="px-7 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-all shadow-sm"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
