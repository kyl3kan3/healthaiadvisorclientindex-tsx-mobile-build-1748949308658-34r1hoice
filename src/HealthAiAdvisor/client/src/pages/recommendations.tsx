import { useQuery, useMutation } from "@tanstack/react-query";
import { NavigationHeader } from "@/components/navigation-header";
import { RecommendationCards } from "@/components/recommendation-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Download, Calendar, Share, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Recommendations() {
  const { toast } = useToast();
  
  const { data: recommendation, isLoading: recommendationLoading } = useQuery({
    queryKey: ["/api/recommendations/latest"],
  });

  const { data: bloodwork, isLoading: bloodworkLoading } = useQuery({
    queryKey: ["/api/bloodwork"],
  });

  const { data: healthProfile } = useQuery({
    queryKey: ["/api/health-profile"],
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/recommendations/regenerate");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your supplement recommendations have been updated!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations/latest"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to regenerate recommendations. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (recommendationLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <NavigationHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <NavigationHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-800 mb-2">No Recommendations Yet</h3>
              <p className="text-neutral-600 mb-6">
                Complete your health questionnaire to get personalized supplement recommendations.
              </p>
              <Link href="/questionnaire">
                <Button className="bg-primary text-white hover:bg-primary-dark">
                  Start Questionnaire
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const recommendations = recommendation?.recommendations || {};
  const hasBloodworkInsights = recommendations.bloodworkInsights && recommendations.bloodworkInsights.length > 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      <NavigationHeader />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-neutral-800">Your Personalized Recommendations</h1>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => regenerateMutation.mutate()}
                disabled={regenerateMutation.isPending}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
                <span>{regenerateMutation.isPending ? 'Regenerating...' : 'Regenerate'}</span>
              </Button>
              <Badge className="bg-secondary text-white">
                Complete
              </Badge>
            </div>
          </div>
          <p className="text-lg text-neutral-600">
            AI-generated supplement recommendations based on your health profile and goals.
          </p>
        </div>

        {/* Current Supplements */}
        {healthProfile?.currentSupplements && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Supplements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600 mb-3">Supplements you're already taking:</p>
              <div className="flex flex-wrap gap-2">
                {healthProfile.currentSupplements.split(',').map((supplement: string, index: number) => (
                  <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {supplement.trim()}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overall Assessment */}
        {recommendations.overallAssessment && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Health Assessment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-700">{recommendations.overallAssessment}</p>
            </CardContent>
          </Card>
        )}

        {/* Warnings */}
        {recommendations.warnings && recommendations.warnings.length > 0 && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-yellow-800">
                <AlertCircle className="h-5 w-5" />
                <span>Important Safety Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recommendations.warnings.map((warning: string, index: number) => (
                  <li key={index} className="text-yellow-700 text-sm">
                    • {warning}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Supplement Recommendations */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recommended Supplements</CardTitle>
          </CardHeader>
          <CardContent>
            <RecommendationCards supplements={recommendations.supplements || []} />
          </CardContent>
        </Card>

        {/* Bloodwork Insights */}
        {hasBloodworkInsights && (
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-900">
                <AlertCircle className="h-5 w-5" />
                <span>Bloodwork Analysis Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.bloodworkInsights.map((insight: any, index: number) => (
                  <div key={index} className="border border-blue-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-blue-900">{insight.parameter}</h4>
                      <Badge 
                        variant={insight.status === 'normal' ? 'default' : 'destructive'}
                        className={
                          insight.status === 'normal' ? 'bg-green-100 text-green-800' :
                          insight.status === 'low' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }
                      >
                        {insight.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>Value:</strong> {insight.value}</p>
                      <p><strong>Normal Range:</strong> {insight.normalRange}</p>
                      <p><strong>Recommendation:</strong> {insight.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button className="bg-primary text-white hover:bg-primary-dark flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download Full Report
          </Button>
          <Button className="bg-secondary text-white hover:bg-green-700 flex-1">
            <Calendar className="h-4 w-4 mr-2" />
            Set Reminders
          </Button>
          <Button variant="outline" className="border-neutral-300 text-neutral-700 hover:bg-neutral-50">
            <Share className="h-4 w-4 mr-2" />
            Share with Doctor
          </Button>
        </div>

        {/* Medical Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
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
