import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, X, CheckCircle } from "lucide-react";

interface BloodworkUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export function BloodworkUpload({ onFileSelect, selectedFile }: BloodworkUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file or image (JPG, PNG, WebP). For best AI analysis results, use clear photos of individual bloodwork pages.",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = useCallback((file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
      toast({
        title: "File selected",
        description: `${file.name} is ready for upload.`,
      });
    }
  }, [onFileSelect, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveFile = () => {
    onFileSelect(null);
    toast({
      title: "File removed",
      description: "File has been removed.",
    });
  };

  if (selectedFile) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h4 className="font-medium text-green-800">File Selected</h4>
                <p className="text-sm text-green-700">{selectedFile.name}</p>
                <p className="text-xs text-green-600">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveFile}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`border-2 border-dashed transition-colors cursor-pointer ${
        isDragOver 
          ? "border-primary bg-blue-50" 
          : "border-neutral-300 hover:border-primary"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="p-8 text-center">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
          id="bloodwork-upload"
        />
        
        <Upload className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
        
        <div className="text-lg font-medium text-neutral-800 mb-2">
          Drop your bloodwork PDF here
        </div>
        
        <div className="text-neutral-600 mb-4">
          or click to browse files
        </div>
        
        <Button 
          variant="outline"
          onClick={() => document.getElementById('bloodwork-upload')?.click()}
          className="mb-4"
        >
          <FileText className="h-4 w-4 mr-2" />
          Choose File
        </Button>
        
        <p className="text-xs text-neutral-500">
          Supported: PDF files up to 10MB
        </p>
      </CardContent>
    </Card>
  );
}
