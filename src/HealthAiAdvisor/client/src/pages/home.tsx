import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NavigationHeader } from "@/components/navigation-header";
import { BloodworkUpload } from "@/components/bloodwork-upload";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { User, FileText, TrendingUp, Plus, Activity, Calendar, Target, AlertTriangle, ArrowRight, Clock, BarChart3 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: profile } = useQuery({
    queryKey: ['/api/health-profile'],
  });

  const { data: latestRecommendation } = useQuery({
    queryKey: ['/api/recommendations/latest'],
  });

  const { data: bloodworkAnalyses } = useQuery({
    queryKey: ['/api/bloodwork'],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/bloodwork/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bloodwork uploaded and analyzed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bloodwork'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to upload bloodwork",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return <div>Loading...</div>;
  }

  // Process bloodwork data for insights
  const processedInsights = bloodworkAnalyses ? (() => {
    const parameterData: { [key: string]: any[] } = {};
    
    bloodworkAnalyses.forEach((analysis: any) => {
      // Check different possible data structures
      let parameters = null;
      if (analysis.analysisResult && analysis.analysisResult.parameters) {
        parameters = analysis.analysisResult.parameters;
      } else if (analysis.analysisResult && analysis.analysisResult.insights) {
        parameters = analysis.analysisResult.insights;
      } else if (analysis.insights) {
        parameters = analysis.insights;
      }
      
      if (parameters && Array.isArray(parameters)) {
        parameters.forEach((param: any) => {
          const paramName = param.name || param.parameter;
          if (paramName) {
            if (!parameterData[paramName]) {
              parameterData[paramName] = [];
            }
            parameterData[paramName].push({
              parameter: paramName,
              value: param.value,
              status: param.status,
              normalRange: param.normalRange,
              date: new Date(analysis.createdAt),
              analysisId: analysis.id
            });
          }
        });
      }
    });

    // Calculate trends and categorize
    const categories = {
      critical: [] as any[],
      improving: [] as any[],
      stable: [] as any[],
      declining: [] as any[]
    };

    Object.entries(parameterData).forEach(([parameter, data]) => {
      if (data.length === 0) return;
      
      const sortedData = data.sort((a, b) => a.date.getTime() - b.date.getTime());
      const latest = sortedData[sortedData.length - 1];
      
      let trend = 'stable';
      if (sortedData.length >= 2) {
        const previous = sortedData[sortedData.length - 2];
        const currentValue = parseFloat(latest.value);
        const previousValue = parseFloat(previous.value);
        
        if (latest.status === 'high' || latest.status === 'low') {
          if (latest.status === 'high' && currentValue > previousValue) {
            trend = 'declining';
          } else if (latest.status === 'low' && currentValue < previousValue) {
            trend = 'declining';
          } else if (
            (latest.status === 'high' && currentValue < previousValue) ||
            (latest.status === 'low' && currentValue > previousValue)
          ) {
            trend = 'improving';
          }
        }
      }
      
      const paramData = {
        name: parameter,
        value: latest.value,
        status: latest.status,
        trend: trend,
        data: sortedData
      };
      
      if (latest.status === 'high' || latest.status === 'low') {
        if (trend === 'declining') {
          categories.critical.push(paramData);
        } else if (trend === 'improving') {
          categories.improving.push(paramData);
        } else {
          categories.stable.push(paramData);
        }
      } else {
        categories.stable.push(paramData);
      }
    });

    return categories;
  })() : { critical: [], improving: [], stable: [], declining: [] };

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationHeader />
      
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.firstName || 'there'}
              </h1>
              <p className="text-gray-600 mt-1">Here's your health overview for today</p>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Labs
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Bloodwork</DialogTitle>
                    <DialogDescription>
                      Upload your lab results to get AI-powered insights and personalized recommendations.
                    </DialogDescription>
                  </DialogHeader>
                  <BloodworkUpload 
                    onFileSelect={(file) => {
                      if (file) {
                        uploadMutation.mutate(file);
                      }
                    }} 
                    selectedFile={null}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Health Insights Summary */}
        {bloodworkAnalyses && bloodworkAnalyses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">Critical Issues</p>
                    <p className="text-3xl font-bold">{processedInsights.critical.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Improving</p>
                    <p className="text-3xl font-bold">{processedInsights.improving.length}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Stable Parameters</p>
                    <p className="text-3xl font-bold">{processedInsights.stable.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Supplements</p>
                    <p className="text-3xl font-bold">{latestRecommendation?.supplements?.length || 0}</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Navigation Cards */}
          <div className="lg:col-span-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Health Hub</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link to="/bloodwork">
                <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 hover:border-l-blue-600">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <BarChart3 className="h-6 w-6 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Health Insights</h3>
                        </div>
                        <p className="text-gray-600 mb-4">View detailed analysis of your bloodwork with trending insights and personalized recommendations.</p>
                        <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                          <span className="text-sm font-medium">Explore insights</span>
                          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/recommendations">
                <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500 hover:border-l-purple-600">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="p-2 bg-purple-100 rounded-lg mr-3">
                            <Target className="h-6 w-6 text-purple-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Supplements</h3>
                        </div>
                        <p className="text-gray-600 mb-4">Get AI-powered supplement recommendations tailored to your health profile and current medications.</p>
                        <div className="flex items-center text-purple-600 group-hover:text-purple-700">
                          <span className="text-sm font-medium">View recommendations</span>
                          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/questionnaire">
                <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 hover:border-l-green-600">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="p-2 bg-green-100 rounded-lg mr-3">
                            <User className="h-6 w-6 text-green-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Health Profile</h3>
                        </div>
                        <p className="text-gray-600 mb-4">Update your health information, medications, and preferences for more accurate recommendations.</p>
                        <div className="flex items-center text-green-600 group-hover:text-green-700">
                          <span className="text-sm font-medium">Update profile</span>
                          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500 hover:border-l-orange-600">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <div className="p-2 bg-orange-100 rounded-lg mr-3">
                          <Calendar className="h-6 w-6 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Track Progress</h3>
                      </div>
                      <p className="text-gray-600 mb-4">Monitor your health journey with detailed trends and progress tracking over time.</p>
                      <div className="flex items-center text-orange-600">
                        <span className="text-sm font-medium">Coming soon</span>
                        <Clock className="h-4 w-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Health Profile Sidebar */}
          <div className="lg:col-span-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Health Profile</h2>
            <Card>
              <CardContent className="p-6">
                {profile ? (
                  <div className="space-y-4">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-blue-100 rounded-full mr-3">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Profile Complete</h3>
                        <p className="text-sm text-gray-600">Last updated {format(new Date(profile.updatedAt), 'MMM dd')}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 block">Age</span>
                        <span className="font-medium">{profile.age}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Sex</span>
                        <span className="font-medium capitalize">{profile.sex}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Height</span>
                        <span className="font-medium">
                          {profile.isImperial ? 
                            `${Math.floor(profile.height / 12)}'${profile.height % 12}"` : 
                            `${profile.height} cm`
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Weight</span>
                        <span className="font-medium">{profile.weight} {profile.isImperial ? 'lbs' : 'kg'}</span>
                      </div>
                    </div>

                    {profile.medications && profile.medications.length > 0 && (
                      <div className="mt-4">
                        <span className="text-gray-500 text-sm block mb-2">Current Medications</span>
                        <div className="flex flex-wrap gap-1">
                          {profile.medications.map((med: any, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {med}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                      <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">Complete Your Profile</h3>
                    <p className="text-gray-600 text-sm mb-4">Get personalized health insights by completing your health profile.</p>
                    <Link to="/questionnaire">
                      <Button size="sm" className="w-full">Get Started</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            {bloodworkAnalyses && bloodworkAnalyses.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bloodworkAnalyses.slice(0, 3).map((analysis: any, index: number) => (
                      <div key={analysis.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-500 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Lab Analysis</p>
                            <p className="text-xs text-gray-600">{format(new Date(analysis.createdAt), 'MMM dd, h:mm a')}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {analysis.analysisResult?.parameters?.length || 0} insights
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}