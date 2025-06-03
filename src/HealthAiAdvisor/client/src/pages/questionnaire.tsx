import React from "react";
import { useState } from "react";
import { NavigationHeader } from "@/components/navigation-header";
import { QuestionnaireForm } from "@/components/questionnaire-form";
import { BloodworkUpload } from "@/components/bloodwork-upload";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function Questionnaire() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [bloodworkFile, setBloodworkFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const createProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/health-profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-profile"] });
      toast({
        title: "Health profile saved",
        description: "Your health profile has been successfully saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save health profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uploadBloodworkMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append("bloodwork", file);
      
      const response = await fetch("/api/bloodwork/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload bloodwork");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bloodwork"] });
      toast({
        title: "Bloodwork uploaded",
        description: "Your bloodwork has been successfully analyzed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload bloodwork. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateRecommendationsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/recommendations/generate");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      toast({
        title: "Recommendations generated",
        description: "Your personalized supplement recommendations are ready!",
      });
      setLocation("/recommendations");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate recommendations. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNext = async () => {
    if (currentStep === 1) {
      // Save health profile
      await createProfileMutation.mutateAsync(formData);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Upload bloodwork if provided
      if (bloodworkFile) {
        await uploadBloodworkMutation.mutateAsync(bloodworkFile);
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Generate recommendations
      await generateRecommendationsMutation.mutateAsync();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isLoading = createProfileMutation.isPending || 
                   uploadBloodworkMutation.isPending || 
                   generateRecommendationsMutation.isPending;

  return (
    <div className="min-h-screen bg-neutral-50">
      <NavigationHeader />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-4">
            Personalized Supplement Recommendations
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Get AI-powered supplement recommendations based on your health profile, goals, and optional bloodwork analysis.
          </p>
        </div>

        {/* Progress Indicator */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-neutral-600 mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            {currentStep === 1 && (
              <div>
                <h3 className="text-xl font-semibold text-neutral-800 mb-6">Basic Health Profile</h3>
                <QuestionnaireForm formData={formData} setFormData={setFormData} />
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h3 className="text-xl font-semibold text-neutral-800 mb-6">Optional: Upload Bloodwork</h3>
                <p className="text-neutral-600 mb-6">
                  Upload your recent bloodwork for more personalized recommendations. We support PDF format.
                </p>
                <BloodworkUpload onFileSelect={setBloodworkFile} selectedFile={bloodworkFile} />
              </div>
            )}

            {currentStep === 3 && (
              <div className="text-center py-8">
                <h3 className="text-xl font-semibold text-neutral-800 mb-6">Generate Your Recommendations</h3>
                <p className="text-neutral-600 mb-8">
                  We're ready to analyze your health profile and generate personalized supplement recommendations using AI.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                  <div className="text-sm text-blue-800">
                    <strong>Your Assessment Includes:</strong>
                    <ul className="mt-2 space-y-1 text-left">
                      <li>• Health profile analysis</li>
                      {bloodworkFile && <li>• Bloodwork analysis</li>}
                      <li>• AI-powered recommendations</li>
                      <li>• Safety and interaction checks</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 mt-6 border-t border-neutral-200">
              <Button 
                variant="outline" 
                onClick={handlePrevious} 
                disabled={currentStep === 1 || isLoading}
              >
                Previous
              </Button>
              
              <Button 
                onClick={handleNext} 
                disabled={isLoading}
                className="bg-primary text-white hover:bg-primary-dark"
              >
                {isLoading ? "Processing..." : 
                 currentStep === totalSteps ? "Generate Recommendations" : "Next Step"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Medical Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-8">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 text-yellow-600 mt-0.5">⚠️</div>
            <div>
              <h4 className="font-semibold text-yellow-800 mb-1">Medical Disclaimer</h4>
              <p className="text-sm text-yellow-700">
                These recommendations are for informational purposes only and should not replace professional medical advice. 
                Always consult with your healthcare provider before starting any new supplement regimen, especially if you have 
                medical conditions or take medications.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
