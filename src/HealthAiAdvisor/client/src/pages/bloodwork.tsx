import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NavigationHeader } from "@/components/navigation-header";
import type { BloodworkAnalysis as BloodworkAnalysisType } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { BloodworkUpload } from "@/components/bloodwork-upload";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, TrendingUp, TrendingDown, Minus, AlertTriangle, ChevronDown, ChevronRight, Trash2, Activity, Plus, Target, Zap, Filter, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Dot, LineChart, Line, ComposedChart, Legend } from 'recharts';

function BloodworkInsightsDashboard({ analyses }: { analyses: any[] }) {
  const [selectedParameter, setSelectedParameter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({
    'Critical': false,
    'Improving': false,
    'Stable': true, // Start with stable collapsed since it's often the largest
    'Declining': false
  });

  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };
  
  const processBloodworkData = () => {
    const parameterData: { [key: string]: any[] } = {};
    const categories = {
      'Critical': [] as string[],
      'Improving': [] as string[],
      'Stable': [] as string[],
      'Declining': [] as string[]
    };
    
    analyses.forEach(analysis => {
      if (analysis.analysisResult.parameters) {
        analysis.analysisResult.parameters.forEach((param: any) => {
          if (!parameterData[param.name]) {
            parameterData[param.name] = [];
          }
          
          const numericValue = parseFloat(param.value.replace(/[^\d.-]/g, ''));
          if (!isNaN(numericValue)) {
            const labDate = analysis.labDate ? new Date(analysis.labDate) : new Date(analysis.createdAt);
            parameterData[param.name].push({
              date: labDate.getTime(),
              dateFormatted: format(labDate, "MMM dd, yyyy"),
              value: numericValue,
              status: param.status,
              normalRange: param.normalRange,
              filename: analysis.filename
            });
          }
        });
      }
    });
    
    // Categorize parameters by trend and status
    Object.keys(parameterData).forEach(name => {
      const data = parameterData[name].sort((a, b) => a.date - b.date);
      if (data.length >= 2) {
        const latest = data[data.length - 1];
        const previous = data[data.length - 2];
        const trend = latest.value > previous.value ? 'up' : latest.value < previous.value ? 'down' : 'stable';
        
        if (latest.status !== 'normal') {
          categories.Critical.push(name);
        } else if (trend === 'up' && previous.status !== 'normal') {
          categories.Improving.push(name);
        } else if (trend === 'down' && latest.status === 'normal') {
          categories.Declining.push(name);
        } else {
          categories.Stable.push(name);
        }
      } else if (data.length === 1 && data[0].status !== 'normal') {
        categories.Critical.push(name);
      }
    });
    
    return { parameterData, categories };
  };

  const { parameterData, categories } = processBloodworkData();

  const renderParameterCard = (parameterName: string, category: string) => {
    const data = parameterData[parameterName]?.sort((a, b) => a.date - b.date) || [];
    if (data.length === 0) return null;
    
    const latest = data[data.length - 1];
    const trend = data.length >= 2 ? 
      (latest.value > data[data.length - 2].value ? 'up' : 
       latest.value < data[data.length - 2].value ? 'down' : 'stable') : 'stable';
    
    const getCategoryColor = (cat: string) => {
      switch(cat) {
        case 'Critical': return 'border-red-200 bg-red-50';
        case 'Improving': return 'border-green-200 bg-green-50';
        case 'Stable': return 'border-blue-200 bg-blue-50';
        case 'Declining': return 'border-yellow-200 bg-yellow-50';
        default: return 'border-gray-200 bg-gray-50';
      }
    };

    return (
      <Card 
        key={parameterName} 
        className={`cursor-pointer transition-all hover:shadow-md ${getCategoryColor(category)}`}
        onClick={() => setSelectedParameter(parameterName)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">{parameterName}</h4>
            <div className="flex items-center space-x-1">
              {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
              {trend === 'stable' && <Minus className="h-4 w-4 text-gray-600" />}
            </div>
          </div>
          <div className="text-lg font-bold">{latest.value}</div>
          <div className="text-xs text-gray-600">{latest.normalRange}</div>
          <Badge 
            className={`mt-2 text-xs ${
              latest.status === 'high' ? 'bg-red-100 text-red-800' :
              latest.status === 'low' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}
          >
            {latest.status}
          </Badge>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Activity className="h-6 w-6 text-blue-600" />
            <span>Health Insights</span>
          </h2>
          <p className="text-gray-600">Track your biomarker trends and health progress</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={viewMode === 'overview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('overview')}
          >
            Overview
          </Button>
          <Button 
            variant={viewMode === 'detailed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('detailed')}
          >
            Detailed
          </Button>
        </div>
      </div>

      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* Category sections */}
          {Object.entries(categories).map(([categoryName, parameters]) => {
            if (parameters.length === 0) return null;
            
            const getCategoryIcon = (cat: string) => {
              switch(cat) {
                case 'Critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
                case 'Improving': return <TrendingUp className="h-5 w-5 text-green-600" />;
                case 'Stable': return <Target className="h-5 w-5 text-blue-600" />;
                case 'Declining': return <TrendingDown className="h-5 w-5 text-yellow-600" />;
                default: return <Activity className="h-5 w-5" />;
              }
            };

            return (
              <Collapsible key={categoryName} open={!collapsedSections[categoryName]} onOpenChange={() => toggleSection(categoryName)}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center space-x-2 mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    {getCategoryIcon(categoryName)}
                    <h3 className="text-lg font-semibold flex-1">{categoryName}</h3>
                    <Badge variant="secondary">{parameters.length}</Badge>
                    {collapsedSections[categoryName] ? (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {parameters.map(param => renderParameterCard(param, categoryName))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      {viewMode === 'detailed' && (
        <div className="space-y-6">
          {/* All parameters with detailed charts */}
          {Object.entries(parameterData).map(([parameterName, data]) => {
            if (data.length === 0) return null;
            
            const sortedData = data.sort((a, b) => a.date - b.date);
            const latest = sortedData[sortedData.length - 1];
            const trend = sortedData.length >= 2 ? 
              (latest.value > sortedData[sortedData.length - 2].value ? 'up' : 
               latest.value < sortedData[sortedData.length - 2].value ? 'down' : 'stable') : 'stable';

            return (
              <Card key={parameterName}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>{parameterName}</span>
                      {trend === 'up' && <TrendingUp className="h-5 w-5 text-green-600" />}
                      {trend === 'down' && <TrendingDown className="h-5 w-5 text-red-600" />}
                      {trend === 'stable' && <Minus className="h-5 w-5 text-gray-600" />}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={`text-xs ${
                          latest.status === 'high' ? 'bg-red-100 text-red-800' :
                          latest.status === 'low' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}
                      >
                        {latest.status}
                      </Badge>
                      <span className="text-sm text-gray-600">Latest: {latest.value}</span>
                    </div>
                  </CardTitle>
                  <p className="text-sm text-gray-600">Normal range: {latest.normalRange}</p>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sortedData}>
                        <defs>
                          <linearGradient id={`colorValue-${parameterName}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="dateFormatted" 
                          className="text-xs"
                        />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border rounded-lg shadow-lg">
                                  <p className="font-medium">{label}</p>
                                  <p className="text-blue-600">Value: {data.value}</p>
                                  <p className="text-sm text-gray-600">Range: {data.normalRange}</p>
                                  <p className="text-sm text-gray-600">Status: {data.status}</p>
                                  <p className="text-xs text-gray-500">File: {data.filename}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill={`url(#colorValue-${parameterName})`}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  {sortedData.length > 1 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">First Value:</span>
                        <p className="font-medium">{sortedData[0].value}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Latest Value:</span>
                        <p className="font-medium">{latest.value}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Change:</span>
                        <p className={`font-medium ${
                          latest.value > sortedData[0].value ? 'text-green-600' : 
                          latest.value < sortedData[0].value ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {latest.value > sortedData[0].value ? '+' : ''}
                          {(latest.value - sortedData[0].value).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Data Points:</span>
                        <p className="font-medium">{sortedData.length}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detailed parameter view */}
      {selectedParameter && parameterData[selectedParameter] && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedParameter} Trend</span>
              <Button variant="outline" size="sm" onClick={() => setSelectedParameter(null)}>
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={parameterData[selectedParameter].sort((a, b) => a.date - b.date)}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="dateFormatted" 
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded-lg shadow-lg">
                            <p className="font-medium">{label}</p>
                            <p className="text-blue-600">Value: {data.value}</p>
                            <p className="text-sm text-gray-600">Range: {data.normalRange}</p>
                            <p className="text-sm text-gray-600">Status: {data.status}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );


  if (parametersWithTrends.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-600">
        <p>No parameter trends available yet.</p>
        <p className="text-sm mt-2">Upload more bloodwork to see parameter changes over time.</p>
      </div>
    );
  }

  const abnormalParams = parametersWithTrends.filter(p => p.hasAbnormal);
  const normalParams = parametersWithTrends.filter(p => !p.hasAbnormal);

  const parseNormalRange = (range: string) => {
    if (!range) return { min: null, max: null };
    
    // Handle ranges like "12-15" or "12.5-15.7"
    const match = range.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
    if (match) {
      return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
    }
    
    // Handle single values like "< 5" or "> 10"
    const lessThan = range.match(/<\s*(\d+(?:\.\d+)?)/);
    if (lessThan) return { min: null, max: parseFloat(lessThan[1]) };
    
    const greaterThan = range.match(/>\s*(\d+(?:\.\d+)?)/);
    if (greaterThan) return { min: parseFloat(greaterThan[1]), max: null };
    
    return { min: null, max: null };
  };

  const renderChart = (param: any, isAbnormal: boolean) => {
    const { min, max } = parseNormalRange(param.normalRange);
    
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={param.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis 
              dataKey="dateFormatted" 
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <Tooltip 
              labelStyle={{ color: "#333" }}
              contentStyle={{ 
                backgroundColor: "white", 
                border: "1px solid #ddd",
                borderRadius: "6px"
              }}
              formatter={(value: any, name: string) => [value, param.name]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            
            {/* Normal range reference lines */}
            {min !== null && (
              <ReferenceLine 
                y={min} 
                stroke="#10b981" 
                strokeDasharray="5 5"
                strokeWidth={1}
              />
            )}
            {max !== null && (
              <ReferenceLine 
                y={max} 
                stroke="#10b981" 
                strokeDasharray="5 5"
                strokeWidth={1}
              />
            )}
            
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={isAbnormal ? "#ef4444" : "#3b82f6"}
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload, index } = props;
                const color = payload.status === 'high' ? '#ef4444' : 
                             payload.status === 'low' ? '#f59e0b' : '#10b981';
                return <circle key={`dot-${index}`} cx={cx} cy={cy} r={4} fill={color} stroke="white" strokeWidth={2} />;
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Create combined overview data
  const createCombinedOverview = () => {
    const dateMap: { [key: string]: any } = {};
    
    analyses.forEach(analysis => {
      const labDate = analysis.labDate ? new Date(analysis.labDate) : new Date(analysis.createdAt);
      const dateKey = format(labDate, "MMM d, yyyy");
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { date: dateKey, dateTimestamp: labDate.getTime() };
      }
      
      if (analysis.analysisResult.parameters) {
        analysis.analysisResult.parameters.forEach(param => {
          const numericValue = parseFloat(param.value.replace(/[^\d.-]/g, ''));
          if (!isNaN(numericValue)) {
            dateMap[dateKey][param.name] = numericValue;
          }
        });
      }
    });
    
    return Object.values(dateMap).sort((a: any, b: any) => a.dateTimestamp - b.dateTimestamp);
  };

  const combinedData = createCombinedOverview();
  const allParameterNames = Array.from(new Set(
    analyses.flatMap(analysis => 
      analysis.analysisResult.parameters?.map(p => p.name) || []
    )
  ));

  const colors = [
    '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', 
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ];

  return (
    <div className="space-y-6">
      {/* Combined Overview Chart */}
      {combinedData.length > 1 && allParameterNames.length > 0 && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span>All Parameters Overview</span>
            </CardTitle>
            <p className="text-sm text-neutral-600">
              Combined view of all bloodwork parameters across {analyses.length} analyses
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    stroke="#666"
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    stroke="#666"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "white", 
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      fontSize: "12px"
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  
                  {allParameterNames.slice(0, 8).map((paramName, index) => (
                    <Line
                      key={paramName}
                      type="monotone"
                      dataKey={paramName}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls={true}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            {allParameterNames.length > 8 && (
              <p className="text-xs text-neutral-500 mt-2">
                Showing first 8 parameters. Individual parameter charts below show all data.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {abnormalParams.length > 0 && (
        <Collapsible defaultOpen={true}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between border-red-200 text-red-700 hover:bg-red-50">
              <span className="font-semibold">Parameters with Abnormal Values ({abnormalParams.length})</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="grid gap-6">
              {abnormalParams.map((param) => (
                <Card key={param.name} className="border-l-4 border-l-red-400">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{param.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        Normal: {param.normalRange}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderChart(param, true)}
                    <div className="mt-3 flex items-center gap-4 text-xs text-neutral-600">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>High</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Low</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Normal</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {normalParams.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>Normal Parameters with Trends ({normalParams.length})</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="grid gap-4">
              {normalParams.map((param) => (
                <Card key={param.name} className="border-l-4 border-l-green-400">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{param.name}</CardTitle>
                      <Badge variant="outline" className="text-xs bg-green-50">
                        Normal: {param.normalRange}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderChart(param, false)}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

interface BloodworkInsight {
  parameter: string;
  value: string;
  normalRange: string;
  status: "low" | "normal" | "high";
  recommendation: string;
}

interface BloodworkParameter {
  name: string;
  value: string;
  status: "low" | "normal" | "high";
  normalRange: string;
  significance: string;
}



export default function Bloodwork() {
  const { data: bloodworkAnalyses = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/bloodwork"],
  });
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [showGraphs, setShowGraphs] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('bloodwork', file);
      
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/bloodwork/upload', {
        method: 'POST',
        body: formData,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Upload failed: ${errorData}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bloodwork uploaded and analyzed successfully!",
      });
      setSelectedFile(null);
      setIsUploadDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/bloodwork"] });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/bloodwork/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bloodwork"] });
      toast({
        title: "Success",
        description: "Bloodwork analysis deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete bloodwork analysis.",
        variant: "destructive",
      });
    },
  });

  const toggleSection = (analysisId: number, section: string) => {
    const key = `${analysisId}-${section}`;
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleDelete = (id: number, filename: string) => {
    if (confirm(`Are you sure you want to delete the analysis for "${filename}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "high":
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case "low":
        return <TrendingDown className="h-4 w-4 text-yellow-500" />;
      case "normal":
        return <Minus className="h-4 w-4 text-green-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "high":
        return "destructive";
      case "low":
        return "secondary";
      case "normal":
        return "default";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading bloodwork analysis...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <NavigationHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-neutral-800 mb-2">
                Bloodwork Analysis
              </h1>
              <p className="text-lg text-neutral-600">
                AI-powered analysis of your uploaded bloodwork files and lab results.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Upload Bloodwork</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Bloodwork</DialogTitle>
                    <DialogDescription>
                      Upload your bloodwork PDF or image files for AI-powered analysis.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <BloodworkUpload 
                      onFileSelect={setSelectedFile} 
                      selectedFile={selectedFile} 
                    />
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsUploadDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleUpload}
                        disabled={!selectedFile || uploadMutation.isPending}
                      >
                        {uploadMutation.isPending ? "Analyzing..." : "Upload & Analyze"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              {bloodworkAnalyses.length > 1 && (
                <Button
                  variant={showGraphs ? "default" : "outline"}
                  onClick={() => setShowGraphs(!showGraphs)}
                  className="flex items-center space-x-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>{showGraphs ? "Hide" : "Show"} Trends</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {bloodworkAnalyses.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                No Bloodwork Uploaded
              </h3>
              <p className="text-neutral-600">
                Upload your bloodwork files to get AI-powered analysis and insights.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {showGraphs && bloodworkAnalyses.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Bloodwork Trends</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BloodworkInsightsDashboard analyses={bloodworkAnalyses} />
                </CardContent>
              </Card>
            )}
            {bloodworkAnalyses.map((analysis) => (
              <Card key={analysis.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>{analysis.filename}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-sm text-neutral-600">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(analysis.labDate || analysis.createdAt), "MMM d, yyyy")}</span>
                        {analysis.labDate && (
                          <span className="text-xs text-green-600 font-medium">Lab Date</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(analysis.id, analysis.filename)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {analysis.analysisResult.message ? (
                    // PDF file that needs conversion
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-800 mb-1">
                            Analysis Not Available
                          </h4>
                          <p className="text-yellow-700 text-sm">
                            {analysis.analysisResult.message}
                          </p>
                          {analysis.analysisResult.supportedFormats && (
                            <p className="text-yellow-700 text-sm mt-2">
                              Supported formats: {analysis.analysisResult.supportedFormats.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Analyzed bloodwork with insights
                    <div className="space-y-6">
                      {analysis.analysisResult.overallAssessment && (
                        <div>
                          <h4 className="font-semibold text-neutral-800 mb-2">
                            Overall Assessment
                          </h4>
                          <p className="text-neutral-700">
                            {analysis.analysisResult.overallAssessment}
                          </p>
                        </div>
                      )}

                      {analysis.analysisResult.warnings && analysis.analysisResult.warnings.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-neutral-800 mb-2">
                            Important Warnings
                          </h4>
                          <div className="space-y-2">
                            {analysis.analysisResult.warnings.map((warning, index) => (
                              <div
                                key={index}
                                className="bg-red-50 border border-red-200 rounded-lg p-3"
                              >
                                <div className="flex items-start space-x-2">
                                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                                  <p className="text-red-700 text-sm">{warning}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysis.analysisResult.keyFindings && 
                       analysis.analysisResult.keyFindings.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-neutral-800 mb-4">
                            Key Findings
                          </h4>
                          <div className="space-y-2 mb-6">
                            {analysis.analysisResult.keyFindings.map((finding, index) => (
                              <div
                                key={index}
                                className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                              >
                                <div className="flex items-start space-x-2">
                                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                  <p className="text-yellow-700 text-sm">{finding}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysis.analysisResult.recommendations && 
                       analysis.analysisResult.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-neutral-800 mb-4">
                            Recommendations
                          </h4>
                          <div className="space-y-2 mb-6">
                            {analysis.analysisResult.recommendations.map((rec, index) => (
                              <div
                                key={index}
                                className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                              >
                                <p className="text-blue-700 text-sm">{rec}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysis.analysisResult.parameters && 
                       analysis.analysisResult.parameters.length > 0 && (
                        <Collapsible 
                          open={expandedSections[`${analysis.id}-parameters`]} 
                          onOpenChange={() => toggleSection(analysis.id, 'parameters')}
                        >
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                              <h4 className="font-semibold text-neutral-800 text-left">
                                Laboratory Results ({analysis.analysisResult.parameters.length} parameters)
                              </h4>
                              {expandedSections[`${analysis.id}-parameters`] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-4">
                            <div className="space-y-3">
                              {/* Abnormal values first */}
                              {analysis.analysisResult.parameters
                                .filter(param => param.status !== 'normal')
                                .map((param, index) => (
                                <Card key={`abnormal-${index}`} className={`border-l-4 ${
                                  param.status === 'high' ? 'border-l-red-400 bg-red-50' :
                                  param.status === 'low' ? 'border-l-yellow-400 bg-yellow-50' :
                                  'border-l-neutral-200'
                                }`}>
                                  <CardContent className="pt-3 pb-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="font-medium text-neutral-800 text-sm">
                                        {param.name}
                                      </h5>
                                      <div className="flex items-center space-x-2">
                                        {getStatusIcon(param.status)}
                                        <Badge variant={getStatusColor(param.status) as any} className="text-xs">
                                          {param.status.toUpperCase()}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2 text-sm">
                                      <span>
                                        <span className="text-neutral-600">Value:</span>
                                        <span className="ml-1 font-medium">{param.value}</span>
                                      </span>
                                      <span>
                                        <span className="text-neutral-600">Normal:</span>
                                        <span className="ml-1 font-medium text-neutral-500">{param.normalRange}</span>
                                      </span>
                                    </div>
                                    <p className="text-neutral-700 text-xs">
                                      {param.significance}
                                    </p>
                                  </CardContent>
                                </Card>
                              ))}
                              
                              {/* Collapsible normal values */}
                              {analysis.analysisResult.parameters.filter(param => param.status === 'normal').length > 0 && (
                                <Collapsible 
                                  open={expandedSections[`${analysis.id}-normal`]} 
                                  onOpenChange={() => toggleSection(analysis.id, 'normal')}
                                >
                                  <CollapsibleTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full justify-between mt-4">
                                      <span className="text-sm">
                                        Normal Values ({analysis.analysisResult.parameters.filter(param => param.status === 'normal').length})
                                      </span>
                                      {expandedSections[`${analysis.id}-normal`] ? (
                                        <ChevronDown className="h-3 w-3" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {analysis.analysisResult.parameters
                                        .filter(param => param.status === 'normal')
                                        .map((param, index) => (
                                        <div key={`normal-${index}`} className="border rounded-lg p-2 bg-green-50 border-green-200">
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm text-neutral-800">
                                              {param.name}
                                            </span>
                                            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                              NORMAL
                                            </Badge>
                                          </div>
                                          <div className="text-xs text-neutral-600 mt-1">
                                            {param.value} (Normal: {param.normalRange})
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}