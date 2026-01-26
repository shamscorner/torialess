<script lang="ts">
  import {
    Upload,
    Palette,
    Settings,
    X,
    Code,
    Trash2,
    AlertCircle,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Move,
  } from "@lucide/svelte";

  let svgContent = $state("");
  let bgColor = $state("#171717");
  let isPanelOpen = $state(true);
  let dragActive = $state(false);
  let error = $state<string | null>(null);

  const DEFAULT_SCALE = 0.5;

  let transform = $state({ x: 0, y: 0, scale: DEFAULT_SCALE });
  let isDragging = $state(false);
  let dragStart = $state({ x: 0, y: 0 });

  let fileInputRef: HTMLInputElement | null = null;
  let containerRef: HTMLDivElement | null = null;

  const placeholderSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="opacity-20">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  `;

  const processFile = (file: File | null | undefined) => {
    error = null;
    if (!file) return;

    if (file.type !== "image/svg+xml" && !file.name.endsWith(".svg")) {
      error = "Please upload a valid SVG file.";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        svgContent = result;
        transform = { x: 0, y: 0, scale: DEFAULT_SCALE };
      }
    };
    reader.onerror = () => {
      error = "Error reading file.";
    };
    reader.readAsText(file);
  };

  const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    processFile(file);
  };

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragging) dragActive = true;
  };

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragActive = false;
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragActive = false;
    const file = event.dataTransfer?.files?.[0];
    processFile(file);
  };

  const handleWheel = (event: WheelEvent) => {
    if (
      isPanelOpen &&
      containerRef &&
      event.target instanceof Node &&
      !containerRef.contains(event.target)
    )
      return;
    if (
      event.target instanceof HTMLElement &&
      event.target.closest(".sidebar-content")
    )
      return;

    event.preventDefault();
    const scaleSensitivity = 0.001;
    const delta = -event.deltaY * scaleSensitivity;
    const newScale = Math.max(0.1, Math.min(transform.scale + delta, 20));
    transform = { ...transform, scale: newScale };
  };

  const handleMouseDown = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea")
    )
      return;

    isDragging = true;
    dragStart = {
      x: event.clientX - transform.x,
      y: event.clientY - transform.y,
    };
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging) return;
    event.preventDefault();
    transform = {
      ...transform,
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y,
    };
  };

  const handleMouseUp = () => {
    isDragging = false;
  };

  const adjustZoom = (amount: number) => {
    const newScale = Math.max(0.1, Math.min(transform.scale + amount, 20));
    transform = { ...transform, scale: newScale };
  };

  const resetTransform = () => {
    transform = { x: 0, y: 0, scale: DEFAULT_SCALE };
  };

  const handlePasteChange = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    svgContent = target.value;
    error = null;
  };

  const clearAll = () => {
    svgContent = "";
    error = null;
    resetTransform();
  };
</script>

<div
  class="relative w-full h-screen overflow-hidden text-gray-100 font-sans select-none"
  style={`background-color: ${bgColor}`}
  ondragenter={handleDragEnter}
  ondragover={(e) => {
    e.preventDefault();
  }}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    bind:this={containerRef}
    role="application"
    tabindex="0"
    aria-label="SVG canvas"
    class={`absolute inset-0 cursor-grab active:cursor-grabbing ${isDragging ? "cursor-grabbing" : ""}`}
    onwheel={handleWheel}
    onmousedown={handleMouseDown}
    onmousemove={handleMouseMove}
    onmouseup={handleMouseUp}
    onmouseleave={handleMouseUp}
  >
    <div
      class="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out origin-center p-8"
      style={`transform: translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`}
    >
      <div
        class="svg-preview-wrapper w-full flex items-center justify-center filter drop-shadow-xl"
      >
        {@html svgContent || placeholderSVG}
      </div>
    </div>
  </div>

  <div class="absolute bottom-6 left-6 flex flex-col gap-2 z-30">
    <div
      class="bg-gray-800/90 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 p-2 flex flex-col gap-2"
    >
      <button
        onclick={() => adjustZoom(0.1)}
        class="p-2 hover:bg-gray-700 rounded text-blue-400"
        title="Zoom In"
      >
        <ZoomIn size={20} />
      </button>
      <button
        onclick={() => adjustZoom(-0.1)}
        class="p-2 hover:bg-gray-700 rounded text-blue-400"
        title="Zoom Out"
      >
        <ZoomOut size={20} />
      </button>
      <button
        onclick={resetTransform}
        class="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
        title="Reset View"
      >
        <RotateCcw size={20} />
      </button>
    </div>
    <div
      class="bg-gray-800/90 backdrop-blur-md px-3 py-1 rounded text-xs font-mono text-gray-400 border border-gray-700 text-center"
    >
      {Math.round(transform.scale * 100)}%
    </div>
  </div>

  {#if dragActive}
    <div
      class="absolute inset-0 flex items-center justify-center bg-blue-500/20 border-4 border-blue-400 border-dashed backdrop-blur-sm z-50 m-4 rounded-xl pointer-events-none"
    >
      <div class="text-2xl font-bold text-blue-100 animate-pulse">
        Drop SVG here
      </div>
    </div>
  {/if}

  {#if !isPanelOpen}
    <button
      onclick={() => (isPanelOpen = true)}
      class="absolute top-6 right-6 z-50 p-3 bg-gray-800/90 hover:bg-blue-600 text-white rounded-full shadow-lg backdrop-blur-md transition-all hover:scale-110"
      title="Open Controls"
    >
      <Settings size={24} />
    </button>
  {/if}

  <div
    class={`sidebar-content absolute top-0 right-0 h-full w-full md:w-80 bg-gray-900/95 border-l border-gray-700 backdrop-blur-xl shadow-2xl z-40 transform transition-transform duration-300 ease-out flex flex-col ${
      isPanelOpen ? "translate-x-0" : "translate-x-full"
    }`}
  >
    <div class="flex items-center justify-between p-6 border-b border-gray-700">
      <h2 class="text-xl font-bold flex items-center gap-2 text-blue-400">
        <Code size={24} />
        <span>SVG Preview</span>
      </h2>
      <button
        onclick={() => (isPanelOpen = false)}
        class="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
      >
        <X size={20} />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-6 space-y-8">
      <div
        class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3 text-blue-200 text-xs"
      >
        <Move size={16} class="shrink-0 mt-0.5" />
        <p>Scroll to zoom. Click & Drag to pan canvas.</p>
      </div>

      {#if error}
        <div
          class="p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start gap-3 text-red-200 text-sm"
        >
          <AlertCircle size={16} class="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      {/if}

      <div class="space-y-3">
        <label
          class="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2"
        >
          <Upload size={16} /> Input Source
        </label>

        <div class="grid grid-cols-1 gap-4">
          <button
            onclick={() => fileInputRef?.click()}
            class="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 border-dashed rounded-lg transition-all group"
          >
            <Upload size={18} class="text-gray-400 group-hover:text-blue-400" />
            <span class="text-sm font-medium">Upload File</span>
          </button>
          <input
            type="file"
            bind:this={fileInputRef}
            onchange={handleFileChange}
            accept=".svg"
            class="hidden"
          />
        </div>

        <div class="relative">
          <textarea
            bind:value={svgContent}
            oninput={handlePasteChange}
            placeholder="Or paste SVG code here..."
            class="w-full h-40 bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs font-mono text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none scrollbar-thin scrollbar-thumb-gray-600"
            spellcheck="false"
          ></textarea>
          {#if svgContent}
            <button
              onclick={clearAll}
              class="absolute bottom-3 right-3 p-1.5 bg-gray-700 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-colors"
              title="Clear SVG"
            >
              <Trash2 size={14} />
            </button>
          {/if}
        </div>
      </div>

      <div class="space-y-3">
        <label
          class="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2"
        >
          <Palette size={16} /> Background Color
        </label>
        <div class="flex gap-2">
          <div class="relative flex-1">
            <input
              type="text"
              bind:value={bgColor}
              placeholder="#171717"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 text-sm text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
            <div
              class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full border border-gray-500"
              style={`background-color: ${bgColor}`}
            ></div>
          </div>
          <input
            type="color"
            bind:value={bgColor}
            class="h-11.5 w-12 p-1 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
          />
        </div>

        <div class="flex gap-2 text-xs text-gray-500 flex-wrap">
          <span>Presets:</span>
          <button
            onclick={() => (bgColor = "#171717")}
            class="hover:text-blue-400 underline">Dark</button
          >
          <button
            onclick={() => (bgColor = "#ffffff")}
            class="hover:text-blue-400 underline">Light</button
          >
          <button
            onclick={() => (bgColor = "#ff0000")}
            class="hover:text-blue-400 underline">Red</button
          >
          <button
            onclick={() => (bgColor = "#00ff00")}
            class="hover:text-blue-400 underline">Green</button
          >
          <button
            onclick={() => (bgColor = "transparent")}
            class="hover:text-blue-400 underline">None</button
          >
        </div>
      </div>
    </div>
    <div
      class="mt-auto text-center p-4 border-t border-gray-800 text-xs text-gray-500"
    >
      <a
        href="https://shamscorner.com"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-blue-400 underline underline-offset-4"
      >
        Developed by Shamscorner LLC
      </a>
    </div>
  </div>
</div>

<style>
  .svg-preview-wrapper :global(svg) {
    width: 100% !important;
    height: auto !important;
    overflow: visible;
    pointer-events: none;
  }
</style>
