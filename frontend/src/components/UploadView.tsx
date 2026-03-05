import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { uploadSchedule, saveSchedule } from "@/lib/api";
import { StudyData } from "@/types";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";

export function UploadView() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<StudyData | null>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadSchedule(file),
    onSuccess: (data) => {
      setPreviewData(data);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!previewData) throw new Error("No data to save");
      await saveSchedule(previewData);
      await queryClient.invalidateQueries({ queryKey: ["syllabus"] });
    },
    onSuccess: () => {
      setSelectedFile(null);
      setPreviewData(null);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewData(null);
    }
  };

  const handleProcess = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="file-upload"
            className="block text-sm font-medium mb-2"
          >
            Select Syllabus Image
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
        </div>

        <Button
          onClick={handleProcess}
          disabled={!selectedFile || uploadMutation.isPending}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploadMutation.isPending ? "Processing..." : "Process Schedule"}
        </Button>
      </div>

      {uploadMutation.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {uploadMutation.error instanceof Error
              ? uploadMutation.error.message
              : "Failed to process schedule"}
          </AlertDescription>
        </Alert>
      )}

      {uploadMutation.isSuccess && previewData && (
        <div className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Schedule Processed Successfully</AlertTitle>
            <AlertDescription>
              Review the parsed data below and click "Save Schedule" to apply it.
            </AlertDescription>
          </Alert>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="preview">
              <AccordionTrigger>Preview Parsed Schedule</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <p className="font-semibold">Course: {previewData.course_title}</p>
                  <p className="text-sm text-muted-foreground">
                    Topics: {previewData.topics.length}
                  </p>
                  <pre className="mt-4 p-4 bg-muted rounded-md overflow-auto max-h-96 text-xs">
                    {JSON.stringify(previewData, null, 2)}
                  </pre>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="w-full"
          >
            {saveMutation.isPending ? "Saving..." : "Save Schedule"}
          </Button>
        </div>
      )}
    </div>
  );
}
