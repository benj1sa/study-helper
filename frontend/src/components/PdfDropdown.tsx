import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FileText, ChevronDown } from "lucide-react";
import { getPdfUrl } from "@/lib/pdfUtils";

interface PdfDropdownProps {
  topicName: string;
}

export function PdfDropdown({ topicName }: PdfDropdownProps) {
  const [open, setOpen] = useState(false);

  const noSolutionsUrl = getPdfUrl(topicName, false);
  const withSolutionsUrl = getPdfUrl(topicName, true);

  // Don't render if no PDF is available at all
  if (!noSolutionsUrl && !withSolutionsUrl) {
    return null;
  }

  const handlePdfClick = (url: string) => {
    window.open(url, "_blank");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          PDF
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex flex-col gap-2">
          {noSolutionsUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePdfClick(noSolutionsUrl)}
              className="justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              Problems (No Solutions)
            </Button>
          )}
          {withSolutionsUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePdfClick(withSolutionsUrl)}
              className="justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              Problems (With Solutions)
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
