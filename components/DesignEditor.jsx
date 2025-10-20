"use client";

import React, { useState, useRef } from "react";
import { Reorder } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { Upload, Type, Sparkles, Trash2, Palette } from "lucide-react";

const LAYER_TYPES = { IMAGE: "IMAGE", TEXT: "TEXT" };
const PARTS = ["FRONT", "BACK", "LEFT_SLEEVE", "RIGHT_SLEEVE"];

export default function DesignEditor() {
  const { user } = useUser();
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [part, setPart] = useState("FRONT");
  const [aiPrompt, setAiPrompt] = useState("");
  const fileInputRef = useRef();
  const canvasRef = useRef();

  const [partLayers, setPartLayers] = useState({
    FRONT: [],
    BACK: [],
    LEFT_SLEEVE: [],
    RIGHT_SLEEVE: [],
  });

  const addLayer = (layer) => {
    setPartLayers((prev) => {
      const newLayer = {
        ...layer,
        id: crypto.randomUUID(),
        order: prev[part].length,
        x: 50,
        y: 50,
        rotation: 0,
        scale: 1,
        ref: React.createRef(),
      };
      if (layer.layerType === LAYER_TYPES.TEXT) newLayer.color = "black";
      return { ...prev, [part]: [...prev[part], newLayer] };
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    addLayer({ layerType: LAYER_TYPES.IMAGE, imageUrl: previewUrl });
  };

  const addTextLayer = () => {
    const text = prompt("Enter text:");
    if (text) addLayer({ layerType: LAYER_TYPES.TEXT, text });
  };

  const generateAIImage = () => {
    if (!aiPrompt) return;
    alert("AI image generation: " + aiPrompt);
    const simulatedUrl = "https://via.placeholder.com/150";
    addLayer({
      layerType: LAYER_TYPES.IMAGE,
      imageUrl: simulatedUrl,
    });
  };

  const removeLayer = (id) => {
    setPartLayers((prev) => ({
      ...prev,
      [part]: prev[part].filter((l) => l.id !== id),
    }));
    setSelectedLayer(null);
  };

  const updateLayer = (id, changes) => {
    setPartLayers((prev) => ({
      ...prev,
      [part]: prev[part].map((l) => (l.id === id ? { ...l, ...changes } : l)),
    }));
  };

  const startDrag = (layer, e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initX = layer.x;
    const initY = layer.y;

    const onMouseMove = (ev) =>
      updateLayer(layer.id, {
        x: initX + (ev.clientX - startX),
        y: initY + (ev.clientY - startY),
      });
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const startScale = (layer, e) => {
    e.stopPropagation();
    const rect = layer.ref.current.getBoundingClientRect();
    const startDist = Math.hypot(
      e.clientX - rect.left - rect.width / 2,
      e.clientY - rect.top - rect.height / 2
    );
    const startScale = layer.scale;

    const onMouseMove = (ev) => {
      const dist = Math.hypot(
        ev.clientX - rect.left - rect.width / 2,
        ev.clientY - rect.top - rect.height / 2
      );
      updateLayer(layer.id, {
        scale: Math.max(0.1, startScale * (dist / startDist)),
      });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const startRotate = (layer, e) => {
    e.stopPropagation();
    const rect = layer.ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const startAngle =
      Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
    const startRotation = layer.rotation || 0;

    const onMouseMove = (ev) => {
      const angle =
        Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI);
      updateLayer(layer.id, { rotation: startRotation + (angle - startAngle) });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const changeColor = () => {
    if (selectedLayer?.layerType === LAYER_TYPES.TEXT) {
      const color = prompt("Enter color:");
      if (color) updateLayer(selectedLayer.id, { color });
    } else alert("Select a text layer to change color.");
  };

  const saveDesign = () => {
    if (!user) return alert("Please log in first.");
    alert("Design saved successfully!");
  };

  const layersToRender = partLayers[part] || [];

  // ✅ Mask images according to part
  const maskSrc = `/masks/${part.toUpperCase()}.png`;

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-500 to-gray-600">
      {/* Sidebar */}
      <div className="w-20 flex flex-col items-center bg-white shadow-lg p-4 space-y-6">
        <button
          onClick={() => fileInputRef.current.click()}
          className="p-3 bg-blue-100 rounded-full hover:bg-blue-200"
        >
          <Upload className="h-6 w-6 text-blue-600" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={addTextLayer}
          className="p-3 bg-green-100 rounded-full hover:bg-green-200"
        >
          <Type className="h-6 w-6 text-green-600" />
        </button>
        <button
          onClick={generateAIImage}
          className="p-3 bg-purple-100 rounded-full hover:bg-purple-200"
        >
          <Sparkles className="h-6 w-6 text-purple-600" />
        </button>
        <button
          onClick={() => selectedLayer && removeLayer(selectedLayer.id)}
          className="p-3 bg-red-100 rounded-full hover:bg-red-200"
        >
          <Trash2 className="h-6 w-6 text-red-600" />
        </button>
        <button
          onClick={changeColor}
          className="p-3 bg-yellow-100 rounded-full hover:bg-yellow-200"
        >
          <Palette className="h-6 w-6 text-yellow-600" />
        </button>
      </div>

      {/* Main canvas */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Part selector */}
        <div className="flex space-x-2 absolute top-4 bg-white shadow-md rounded-full p-2">
          {PARTS.map((p) => (
            <button
              key={p}
              onClick={() => setPart(p)}
              className={`px-4 py-2 rounded-full font-medium ${
                part === p
                  ? "bg-blue-500 text-white"
                  : "bg-transparent text-gray-700 hover:bg-gray-100"
              }`}
            >
              {p.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Masked canvas */}
        <div
          ref={canvasRef}
          className="relative w-[480px] h-[480px] mt-16 rounded-lg overflow-hidden"
        >
          {/* Masked area */}
          <div
            className="absolute inset-0"
            style={{
              WebkitMaskImage: `url(${maskSrc})`,
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskSize: "contain",
              WebkitMaskPosition: "center",
              maskImage: `url(${maskSrc})`,
              maskRepeat: "no-repeat",
              maskSize: "contain",
              maskPosition: "center",
            }}
          >
            {/* Mockup image */}
            <img
              src={`/mockups/${part.toUpperCase()}.png`}
              className="absolute w-full h-full object-contain opacity-100 pointer-events-none"
              alt={part}
            />

            {/* Design Layers (masked) */}
            {layersToRender.map((layer) => (
              <div
                key={layer.id}
                ref={layer.ref}
                style={{
                  position: "absolute",
                  left: `${layer.x}px`,
                  top: `${layer.y}px`,
                  width: "120px",
                  height: "120px",
                  transform: `rotate(${layer.rotation}deg) scale(${layer.scale})`,
                  transformOrigin: "center",
                  cursor: "grab",
                  zIndex: layer.order,
                }}
                onMouseDown={(e) => startDrag(layer, e)}
                onClick={() => setSelectedLayer(layer)}
              >
                {layer.layerType === LAYER_TYPES.IMAGE ? (
                  <img
                    src={layer.imageUrl}
                    className="w-full h-full object-contain pointer-events-none"
                    alt="layer"
                  />
                ) : (
                  <span
                    className="text-lg font-bold pointer-events-none"
                    style={{ color: layer.color }}
                  >
                    {layer.text}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* ✨ Overlay for handles and borders (not masked) */}
          {selectedLayer &&
            (() => {
              const layer = selectedLayer;
              return (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${layer.x}px`,
                    top: `${layer.y}px`,
                    width: "120px",
                    height: "120px",
                    transform: `rotate(${layer.rotation}deg) scale(${layer.scale})`,
                    transformOrigin: "center",
                    zIndex: 999,
                  }}
                >
                  {/* Rounded rectangle border */}
                  <div
                    className="absolute inset-0 border-2 border-blue-400 rounded-md pointer-events-none"
                    style={{
                      boxShadow: "0 0 6px rgba(0,0,255,0.3)",
                    }}
                  ></div>

                  {/* Handles (interactive, so pointer-events enabled) */}
                  <div
                    onMouseDown={(e) => startScale(layer, e)}
                    className="absolute -bottom-3 -right-3 w-5 h-5 bg-green-500 rounded-full cursor-nwse-resize shadow pointer-events-auto"
                  />
                  <div
                    onMouseDown={(e) => startRotate(layer, e)}
                    className="absolute -top-3 -right-3 w-5 h-5 bg-blue-500 rounded-full cursor-pointer shadow pointer-events-auto"
                  />
                </div>
              );
            })()}
        </div>
        {/* Prompt + Save */}
        <div className="flex gap-4 mt-6">
          <div className="flex space-x-3 bg-white shadow-md rounded-full p-3 w-[400px]">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="flex-1 p-2 border-none outline-none bg-transparent"
              placeholder="Enter AI prompt..."
            />
            <button
              onClick={generateAIImage}
              className="px-5 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600"
            >
              Go
            </button>
          </div>
          <button
            onClick={saveDesign}
            className="px-7 py-2 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 shadow-md"
          >
            Order
          </button>
        </div>
      </div>

      {/* Layers panel */}
      <div className="w-40 bg-white shadow-lg p-4 overflow-y-auto">
        <h2 className="font-bold text-lg mb-4 text-gray-800">Layers</h2>
        <Reorder.Group
          axis="y"
          values={layersToRender}
          onReorder={(newOrder) =>
            setPartLayers((prev) => ({
              ...prev,
              [part]: newOrder.map((l, i) => ({ ...l, order: i })),
            }))
          }
        >
          {layersToRender.map((layer) => (
            <Reorder.Item
              key={layer.id}
              value={layer}
              className={`flex items-center p-3 mb-3 rounded-lg border transition ${
                selectedLayer?.id === layer.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
              onClick={() => setSelectedLayer(layer)}
            >
              {layer.layerType === LAYER_TYPES.IMAGE ? (
                <img
                  src={layer.imageUrl}
                  className="w-12 h-10 object-cover rounded"
                  alt="layer"
                />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded text-gray-600 font-bold">
                  T
                </div>
              )}
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>
    </div>
  );
}
