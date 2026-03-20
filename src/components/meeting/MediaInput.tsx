"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VideoUpload } from "./VideoUpload";
import { YouTubeInput } from "./YouTubeInput";
import { Upload, Youtube } from "lucide-react";

interface MediaInputProps {
  onFileSelect: (file: File) => void;
  onUrlSubmit: (url: string) => void;
  disabled?: boolean;
}

export function MediaInput({
  onFileSelect,
  onUrlSubmit,
  disabled,
}: MediaInputProps) {
  return (
    <Tabs defaultValue="upload">
      <TabsList variant="line">
        <TabsTrigger value="upload">
          <Upload className="h-3.5 w-3.5" />
          Upload Video
        </TabsTrigger>
        <TabsTrigger value="youtube">
          <Youtube className="h-3.5 w-3.5" />
          YouTube URL
        </TabsTrigger>
      </TabsList>
      <TabsContent value="upload" className="pt-4">
        <VideoUpload onFileSelect={onFileSelect} disabled={disabled} />
      </TabsContent>
      <TabsContent value="youtube" className="pt-4">
        <YouTubeInput onUrlSubmit={onUrlSubmit} disabled={disabled} />
      </TabsContent>
    </Tabs>
  );
}
